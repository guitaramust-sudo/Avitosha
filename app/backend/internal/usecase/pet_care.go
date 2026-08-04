package usecase

import (
	"context"
	"fmt"
	"time"

	"github.com/google/uuid"

	"github.com/guitaramust-sudo/Avitosha/app/backend/internal/model"
)

type ApplyInventoryItemCommand struct {
	UserID uuid.UUID
	ItemID uuid.UUID
	Now    time.Time
}

type PetCareService struct {
	repository  PetCareRepository
	txManager   TxManager
	idGenerator IDGenerator
}

func NewPetCareService(repository PetCareRepository, txManager TxManager, idGenerator IDGenerator) *PetCareService {
	return &PetCareService{repository: repository, txManager: txManager, idGenerator: idGenerator}
}

func (service *PetCareService) ApplyInventoryItem(ctx context.Context, command ApplyInventoryItemCommand) (ApplyCareItemResult, error) {
	now := command.Now.UTC()
	var result ApplyCareItemResult
	if err := service.txManager.WithinTx(ctx, func(txCtx context.Context) error {
		pet, err := service.repository.GetPetByUserIDForUpdate(txCtx, command.UserID)
		if err != nil {
			return fmt.Errorf("get pet for update: %w", err)
		}
		dailyCandidate := NewPetDailyState(service.idGenerator(), pet.ID, utcDate(now), now, pet.GrowthXP)
		dailyState, err := service.repository.GetOrCreateDailyState(txCtx, dailyCandidate)
		if err != nil {
			return fmt.Errorf("get daily state for update: %w", err)
		}
		item, err := service.repository.GetInventoryItemForUpdate(txCtx, command.UserID, command.ItemID)
		if err != nil {
			return fmt.Errorf("get inventory item for update: %w", err)
		}
		if item.Status != model.InventoryItemStatusAvailable {
			return ErrInventoryItemUnavailable
		}
		updated, err := ApplyCareItem(pet, dailyState, item.ItemType, now)
		if err != nil {
			return fmt.Errorf("apply care item rules: %w", err)
		}
		if err := service.repository.UpdatePet(txCtx, updated.Pet); err != nil {
			return fmt.Errorf("update pet: %w", err)
		}
		if err := service.repository.UpdateDailyState(txCtx, updated.DailyState); err != nil {
			return fmt.Errorf("update daily state: %w", err)
		}
		if err := service.repository.MarkInventoryItemUsed(txCtx, command.UserID, command.ItemID, now); err != nil {
			return fmt.Errorf("mark inventory item used: %w", err)
		}
		result = updated
		return nil
	}); err != nil {
		return ApplyCareItemResult{}, fmt.Errorf("apply inventory item transaction: %w", err)
	}
	return result, nil
}
