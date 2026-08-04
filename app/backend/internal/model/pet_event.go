package model

import (
	"time"

	"github.com/google/uuid"
)

type PetEventType string

const (
	PetEventTypeStateChanged   PetEventType = "PET_STATE_CHANGED"
	PetEventTypeBecameHappy    PetEventType = "PET_BECAME_HAPPY"
	PetEventTypeBecameEcstatic PetEventType = "PET_BECAME_ECSTATIC"
	PetEventTypeLevelUp        PetEventType = "PET_LEVEL_UP"
)

type PetEvent struct {
	Type          PetEventType
	PetID         uuid.UUID
	UserID        uuid.UUID
	OccurredAt    time.Time
	PreviousState PetState
	NewState      PetState
	PreviousLevel int
	NewLevel      int
	XPDelta       int
}
