package usecase

import (
	"context"
	"testing"
	"time"

	"github.com/google/uuid"

	"github.com/guitaramust-sudo/Avitosha/app/backend/internal/model"
)

type petTxContextKey struct{}

type fakePetTxManager struct {
	called bool
}

func (manager *fakePetTxManager) WithinTx(ctx context.Context, fn func(context.Context) error) error {
	manager.called = true
	return fn(context.WithValue(ctx, petTxContextKey{}, true))
}

type fakePetRepository struct {
	pet             model.Pet
	dailyState      model.PetDailyState
	item            model.InventoryItem
	updatedPet      model.Pet
	updatedDaily    model.PetDailyState
	markedItemID    uuid.UUID
	allCallsInTxCtx bool
}

func (repository *fakePetRepository) observeContext(ctx context.Context) {
	if value, _ := ctx.Value(petTxContextKey{}).(bool); value {
		if !repository.allCallsInTxCtx {
			repository.allCallsInTxCtx = true
		}
		return
	}
	repository.allCallsInTxCtx = false
}

func (repository *fakePetRepository) GetOrCreatePet(ctx context.Context, candidate model.Pet) (model.Pet, error) {
	repository.observeContext(ctx)
	if repository.pet.ID == uuid.Nil {
		repository.pet = candidate
	}
	return repository.pet, nil
}

func (repository *fakePetRepository) GetOrCreateDailyState(ctx context.Context, candidate model.PetDailyState) (model.PetDailyState, error) {
	repository.observeContext(ctx)
	if repository.dailyState.ID == uuid.Nil {
		repository.dailyState = candidate
	}
	return repository.dailyState, nil
}

func (repository *fakePetRepository) GetPetByUserIDForUpdate(ctx context.Context, _ uuid.UUID) (model.Pet, error) {
	repository.observeContext(ctx)
	return repository.pet, nil
}

func (repository *fakePetRepository) GetInventoryItemForUpdate(ctx context.Context, _, _ uuid.UUID) (model.InventoryItem, error) {
	repository.observeContext(ctx)
	return repository.item, nil
}

func (repository *fakePetRepository) UpdatePet(ctx context.Context, pet model.Pet) error {
	repository.observeContext(ctx)
	repository.updatedPet = pet
	return nil
}

func (repository *fakePetRepository) UpdateDailyState(ctx context.Context, dailyState model.PetDailyState) error {
	repository.observeContext(ctx)
	repository.updatedDaily = dailyState
	return nil
}

func (repository *fakePetRepository) MarkInventoryItemUsed(ctx context.Context, _ uuid.UUID, itemID uuid.UUID, _ time.Time) error {
	repository.observeContext(ctx)
	repository.markedItemID = itemID
	return nil
}

func (repository *fakePetRepository) GetPetDailySummarySource(_ context.Context, _ uuid.UUID, _ time.Time) (model.Pet, model.PetDailyState, error) {
	return repository.pet, repository.dailyState, nil
}

func TestPetLifecycleUsesSharedTransactionContextAndCreatesAvitosha(t *testing.T) {
	repository := &fakePetRepository{}
	txManager := &fakePetTxManager{}
	petID := uuid.New()
	dailyID := uuid.New()
	generatedIDs := []uuid.UUID{petID, dailyID}
	service := NewPetLifecycleService(repository, txManager, func() uuid.UUID {
		id := generatedIDs[0]
		generatedIDs = generatedIDs[1:]
		return id
	})
	now := time.Date(2026, 8, 5, 23, 30, 0, 0, time.FixedZone("UTC+7", 7*60*60))

	snapshot, err := service.EnsurePet(context.Background(), uuid.New(), now)
	if err != nil {
		t.Fatalf("EnsurePet() error = %v", err)
	}
	if !txManager.called || !repository.allCallsInTxCtx {
		t.Fatal("lifecycle repository calls did not use the shared transaction context")
	}
	if snapshot.Pet.Name != "Авитоша" || snapshot.Pet.Level != 1 || snapshot.Pet.GrowthXP != 0 {
		t.Fatalf("pet = %+v, want a new level-one Авитоша", snapshot.Pet)
	}
	wantDate := time.Date(2026, 8, 5, 0, 0, 0, 0, time.UTC)
	if !snapshot.DailyState.Date.Equal(wantDate) {
		t.Fatalf("daily date = %v, want %v", snapshot.DailyState.Date, wantDate)
	}
}

func TestPetCareUsesSharedTransactionAndConsumesItemAtomically(t *testing.T) {
	userID := uuid.New()
	petID := uuid.New()
	itemID := uuid.New()
	repository := &fakePetRepository{
		pet: model.Pet{ID: petID, UserID: userID, Name: "Авитоша", Level: 1},
		dailyState: model.PetDailyState{
			ID: uuid.New(), PetID: petID, Satiety: 50, Mood: 50, Curiosity: 50, State: model.PetStateCurious,
		},
		item: model.InventoryItem{ID: itemID, UserID: userID, ItemType: model.ItemTypeFood, Status: model.InventoryItemStatusAvailable},
	}
	txManager := &fakePetTxManager{}
	service := NewPetCareService(repository, txManager, uuid.New)

	result, err := service.ApplyInventoryItem(context.Background(), ApplyInventoryItemCommand{
		UserID: userID, ItemID: itemID, Now: time.Date(2026, 8, 5, 12, 0, 0, 0, time.UTC),
	})
	if err != nil {
		t.Fatalf("ApplyInventoryItem() error = %v", err)
	}
	if !txManager.called || !repository.allCallsInTxCtx {
		t.Fatal("care repository calls did not use the shared transaction context")
	}
	if result.DailyState.Satiety != 90 || repository.updatedDaily.Satiety != 90 {
		t.Fatalf("satiety = %d, saved = %d, want 90", result.DailyState.Satiety, repository.updatedDaily.Satiety)
	}
	if repository.markedItemID != itemID {
		t.Fatalf("marked item = %s, want %s", repository.markedItemID, itemID)
	}
}

func TestBuildPetDailySummaryReportsXPLevelsAndAchievements(t *testing.T) {
	petID := uuid.New()
	pet := model.Pet{ID: petID, Name: "Авитоша", Level: 2, GrowthXP: 110}
	daily := model.PetDailyState{
		PetID: petID, Date: time.Date(2026, 8, 4, 0, 0, 0, 0, time.UTC),
		Satiety: 90, Mood: 90, Curiosity: 50, State: model.PetStateHappy,
		HappyXPGranted: true, StartingGrowthXP: 80,
	}

	summary, err := BuildPetDailySummary(pet, daily)
	if err != nil {
		t.Fatalf("BuildPetDailySummary() error = %v", err)
	}
	if summary.EarnedGrowthXP != 30 || summary.EndingGrowthXP != 110 {
		t.Fatalf("summary XP = earned %d ending %d, want 30 and 110", summary.EarnedGrowthXP, summary.EndingGrowthXP)
	}
	if summary.StartingLevel != 1 || summary.EndingLevel != 2 {
		t.Fatalf("levels = %d -> %d, want 1 -> 2", summary.StartingLevel, summary.EndingLevel)
	}
	if len(summary.Achievements) != 2 || summary.Achievements[1] != model.PetDailyAchievementLevelUp {
		t.Fatalf("achievements = %v, want happy and level-up", summary.Achievements)
	}
}
