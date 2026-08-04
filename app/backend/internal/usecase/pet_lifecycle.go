package usecase

import (
	"context"
	"fmt"
	"time"

	"github.com/google/uuid"

	"github.com/guitaramust-sudo/Avitosha/app/backend/internal/model"
)

const DefaultPetName = "Авитоша"

type IDGenerator func() uuid.UUID

type PetSnapshot struct {
	Pet        model.Pet
	DailyState model.PetDailyState
}

type PetLifecycleService struct {
	repository  PetLifecycleRepository
	txManager   TxManager
	idGenerator IDGenerator
}

func NewPetLifecycleService(repository PetLifecycleRepository, txManager TxManager, idGenerator IDGenerator) *PetLifecycleService {
	return &PetLifecycleService{repository: repository, txManager: txManager, idGenerator: idGenerator}
}

func (service *PetLifecycleService) EnsurePet(ctx context.Context, userID uuid.UUID, now time.Time) (PetSnapshot, error) {
	now = now.UTC()
	candidate := model.Pet{
		ID: service.idGenerator(), UserID: userID, Name: DefaultPetName,
		Level: 1, GrowthXP: 0, CreatedAt: now, UpdatedAt: now,
	}

	var snapshot PetSnapshot
	if err := service.txManager.WithinTx(ctx, func(txCtx context.Context) error {
		pet, err := service.repository.GetOrCreatePet(txCtx, candidate)
		if err != nil {
			return fmt.Errorf("get or create pet: %w", err)
		}
		dailyCandidate := NewPetDailyState(service.idGenerator(), pet.ID, utcDate(now), now, pet.GrowthXP)
		dailyState, err := service.repository.GetOrCreateDailyState(txCtx, dailyCandidate)
		if err != nil {
			return fmt.Errorf("get or create daily state: %w", err)
		}
		snapshot = PetSnapshot{Pet: pet, DailyState: dailyState}
		return nil
	}); err != nil {
		return PetSnapshot{}, fmt.Errorf("ensure pet transaction: %w", err)
	}
	return snapshot, nil
}

func utcDate(value time.Time) time.Time {
	value = value.UTC()
	return time.Date(value.Year(), value.Month(), value.Day(), 0, 0, 0, 0, time.UTC)
}
