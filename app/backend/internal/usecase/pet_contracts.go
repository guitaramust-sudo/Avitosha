package usecase

import (
	"context"
	"time"

	"github.com/google/uuid"

	"github.com/guitaramust-sudo/Avitosha/app/backend/internal/model"
)

type PetLifecycleRepository interface {
	GetOrCreatePet(context.Context, model.Pet) (model.Pet, error)
	GetOrCreateDailyState(context.Context, model.PetDailyState) (model.PetDailyState, error)
}

type PetCareRepository interface {
	GetPetByUserIDForUpdate(context.Context, uuid.UUID) (model.Pet, error)
	GetOrCreateDailyState(context.Context, model.PetDailyState) (model.PetDailyState, error)
	GetInventoryItemForUpdate(context.Context, uuid.UUID, uuid.UUID) (model.InventoryItem, error)
	UpdatePet(context.Context, model.Pet) error
	UpdateDailyState(context.Context, model.PetDailyState) error
	MarkInventoryItemUsed(context.Context, uuid.UUID, uuid.UUID, time.Time) error
}

type PetDailySummaryReader interface {
	GetPetDailySummarySource(context.Context, uuid.UUID, time.Time) (model.Pet, model.PetDailyState, error)
}
