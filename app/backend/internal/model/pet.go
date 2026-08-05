package model

import (
	"time"

	"github.com/google/uuid"
)

type PetMood string

const (
	PetMoodCalm     PetMood = "CALM"
	PetMoodCurious  PetMood = "CURIOUS"
	PetMoodHappy    PetMood = "HAPPY"
	PetMoodExcited  PetMood = "EXCITED"
	PetMoodProud    PetMood = "PROUD"
	PetMoodSleeping PetMood = "SLEEPING"
)

type PetCharacter string

const (
	PetCharacterExplorer     PetCharacter = "EXPLORER"
	PetCharacterEntrepreneur PetCharacter = "ENTREPRENEUR"
	PetCharacterMechanic     PetCharacter = "MECHANIC"
	PetCharacterTraveler     PetCharacter = "TRAVELER"
	PetCharacterArchitect    PetCharacter = "ARCHITECT"
	PetCharacterCraftsperson PetCharacter = "CRAFTSPERSON"
)

// NeedType remains only until the legacy care service is removed in stage 3.
type NeedType string

const (
	NeedTypeSatiety   NeedType = "SATIETY"
	NeedTypeMood      NeedType = "MOOD"
	NeedTypeCuriosity NeedType = "CURIOSITY"
)

type Pet struct {
	ID        uuid.UUID
	UserID    uuid.UUID
	Name      string
	Level     int
	GrowthXP  int
	Mood      PetMood
	Character *PetCharacter
	CreatedAt time.Time
	UpdatedAt time.Time
}
