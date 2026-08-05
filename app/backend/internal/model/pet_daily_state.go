package model

import (
	"time"

	"github.com/google/uuid"
)

type PetState string

const (
	PetStateCurious  PetState = "CURIOUS"
	PetStateHungry   PetState = "HUNGRY"
	PetStateBored    PetState = "BORED"
	PetStateContent  PetState = "CONTENT"
	PetStateHappy    PetState = "HAPPY"
	PetStateEcstatic PetState = "ECSTATIC"
)

type PetDailyState struct {
	ID                uuid.UUID
	PetID             uuid.UUID
	Date              time.Time
	Satiety           int
	Mood              int
	Curiosity         int
	State             PetState
	HappyXPGranted    bool
	EcstaticXPGranted bool
	StartingGrowthXP  int
	CreatedAt         time.Time
	UpdatedAt         time.Time
}
