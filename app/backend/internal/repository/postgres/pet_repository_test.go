package postgres_test

import (
	"context"
	"testing"
	"time"

	"github.com/google/uuid"

	"github.com/guitaramust-sudo/Avitosha/app/backend/internal/model"
	"github.com/guitaramust-sudo/Avitosha/app/backend/internal/repository/postgres"
	"github.com/guitaramust-sudo/Avitosha/app/backend/internal/usecase"
)

func TestPetRepositoryWorksWithSharedTxManager(t *testing.T) {
	pool := newTestPool(t)
	userRepository := postgres.NewUserRepository(pool)
	user, err := userRepository.Create(context.Background(), usecase.CreateUserParams{
		Email: "pet-owner@example.com", PasswordHash: "hashed-password",
	})
	if err != nil {
		t.Fatalf("create user: %v", err)
	}

	repository := postgres.NewPetRepository(pool)
	txManager := postgres.NewTxManager(pool)
	petID := uuid.New()
	dailyID := uuid.New()
	generatedIDs := []uuid.UUID{petID, dailyID}
	lifecycle := usecase.NewPetLifecycleService(repository, txManager, func() uuid.UUID {
		id := generatedIDs[0]
		generatedIDs = generatedIDs[1:]
		return id
	})
	now := time.Now().UTC().Truncate(time.Microsecond)

	snapshot, err := lifecycle.EnsurePet(context.Background(), user.ID, now)
	if err != nil {
		t.Fatalf("EnsurePet() error = %v", err)
	}
	if snapshot.Pet.ID != petID || snapshot.Pet.Name != usecase.DefaultPetName {
		t.Fatalf("pet = %+v, want generated Авитоша", snapshot.Pet)
	}

	itemID := uuid.New()
	_, err = pool.Exec(context.Background(), `
INSERT INTO inventory_items (id, user_id, item_type, status, source_type, source_id, idempotency_key, created_at)
VALUES ($1, $2, 'FOOD', 'AVAILABLE', 'TEST', $3, $4, $5)
`, itemID, user.ID, uuid.New(), "pet-test-item", now)
	if err != nil {
		t.Fatalf("seed item: %v", err)
	}

	care := usecase.NewPetCareService(repository, txManager, uuid.New)
	result, err := care.ApplyInventoryItem(context.Background(), usecase.ApplyInventoryItemCommand{
		UserID: user.ID, ItemID: itemID, Now: now.Add(time.Minute),
	})
	if err != nil {
		t.Fatalf("ApplyInventoryItem() error = %v", err)
	}
	if result.DailyState.Satiety != 90 || result.DailyState.State != model.PetStateContent {
		t.Fatalf("daily state = %+v, want satiety 90 and CONTENT", result.DailyState)
	}

	var status model.InventoryItemStatus
	var usedAt *time.Time
	if err := pool.QueryRow(context.Background(), `SELECT status, used_at FROM inventory_items WHERE id = $1`, itemID).Scan(&status, &usedAt); err != nil {
		t.Fatalf("read used item: %v", err)
	}
	if status != model.InventoryItemStatusUsed || usedAt == nil {
		t.Fatalf("item status = %q, used_at = %v; want USED with timestamp", status, usedAt)
	}
}
