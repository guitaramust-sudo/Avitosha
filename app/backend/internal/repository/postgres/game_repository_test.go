package postgres_test

import (
	"context"
	"encoding/json"
	"testing"
	"time"

	"github.com/google/uuid"

	"github.com/guitaramust-sudo/Avitosha/app/backend/internal/model"
	"github.com/guitaramust-sudo/Avitosha/app/backend/internal/repository/postgres"
	"github.com/guitaramust-sudo/Avitosha/app/backend/internal/usecase"
)

func TestGameRepositoryBootstrapsProfileAndKeepsEventIdempotent(t *testing.T) {
	pool := newTestPool(t)
	userRepository := postgres.NewUserRepository(pool)
	user, err := userRepository.Create(context.Background(), usecase.CreateUserParams{
		Email: "game-owner@example.com", PasswordHash: "hashed-password",
	})
	if err != nil {
		t.Fatalf("create user: %v", err)
	}

	repository := postgres.NewGameRepository(pool)
	txManager := postgres.NewTxManager(pool)
	now := time.Now().UTC().Truncate(time.Microsecond)
	petID := uuid.New()
	storyID := uuid.New()

	err = txManager.WithinTx(context.Background(), func(ctx context.Context) error {
		_, txErr := repository.GetOrCreateGamePet(ctx, model.Pet{
			ID: petID, UserID: user.ID, Name: "Авитоша", Level: 1,
			Mood: model.PetMoodCalm, CreatedAt: now, UpdatedAt: now,
		})
		if txErr != nil {
			return txErr
		}
		_, txErr = repository.GetOrCreateStoryProgress(ctx, model.UserStoryProgress{
			ID: storyID, UserID: user.ID, StoryCode: "FIRST_ROOM", Status: model.StoryStatusActive,
			StartedAt: now, CreatedAt: now, UpdatedAt: now,
		})
		if txErr != nil {
			return txErr
		}
		placedAt := now
		if txErr = repository.EnsureInitialRoomItem(ctx, model.UserRoomItem{
			ID: uuid.New(), UserID: user.ID, ItemCode: "BOX", Status: model.RoomItemStatusPlaced,
			UnlockedAt: now, PlacedAt: &placedAt, CreatedAt: now, UpdatedAt: now,
		}); txErr != nil {
			return txErr
		}
		_, txErr = repository.AssignStoryTask(ctx, user.ID, "FIRST_ROOM", 1, now)
		return txErr
	})
	if err != nil {
		t.Fatalf("bootstrap game profile: %v", err)
	}

	tasks, err := repository.ListTaskProgress(context.Background(), user.ID)
	if err != nil || len(tasks) != 1 || tasks[0].Task.Code != "VIEW_FURNITURE_ADS" {
		t.Fatalf("tasks = %+v, error = %v", tasks, err)
	}
	room, err := repository.ListRoomItems(context.Background(), user.ID)
	if err != nil || len(room) == 0 || room[0].Status != model.RoomItemStatusPlaced {
		t.Fatalf("room = %+v, error = %v", room, err)
	}

	eventID := uuid.New()
	actionCandidate := model.UserAction{
		ID: uuid.New(), UserID: user.ID, EventID: eventID, ActionType: model.ActionTypeAdViewed,
		Category: stringPointer("FURNITURE"), Metadata: json.RawMessage(`{}`), OccurredAt: now, CreatedAt: now,
	}
	first, inserted, err := repository.InsertAction(context.Background(), actionCandidate)
	if err != nil || !inserted {
		t.Fatalf("first InsertAction() inserted = %v, error = %v", inserted, err)
	}
	if err := repository.CompleteAction(context.Background(), first.ID, now, []model.DomainEvent{}); err != nil {
		t.Fatalf("CompleteAction() error = %v", err)
	}
	second, inserted, err := repository.InsertAction(context.Background(), actionCandidate)
	if err != nil || inserted || second.ID != first.ID || second.ProcessedAt == nil {
		t.Fatalf("idempotent action = %+v, inserted = %v, error = %v", second, inserted, err)
	}
}

func TestGameRepositoryRoomUnlockIsIdempotent(t *testing.T) {
	pool := newTestPool(t)
	userRepository := postgres.NewUserRepository(pool)
	user, err := userRepository.Create(context.Background(), usecase.CreateUserParams{
		Email: "room-owner@example.com", PasswordHash: "hashed-password",
	})
	if err != nil {
		t.Fatalf("create user: %v", err)
	}

	repository := postgres.NewGameRepository(pool)
	now := time.Now().UTC().Truncate(time.Microsecond)
	placedAt := now
	item := model.UserRoomItem{
		ID: uuid.New(), UserID: user.ID, ItemCode: "DESK", Status: model.RoomItemStatusPlaced,
		UnlockedAt: now, PlacedAt: &placedAt, CreatedAt: now, UpdatedAt: now,
	}
	first, err := repository.UnlockRoomItem(context.Background(), item)
	if err != nil || !first {
		t.Fatalf("first UnlockRoomItem() unlocked = %v, error = %v", first, err)
	}
	item.ID = uuid.New()
	second, err := repository.UnlockRoomItem(context.Background(), item)
	if err != nil || second {
		t.Fatalf("second UnlockRoomItem() unlocked = %v, error = %v", second, err)
	}
}
