package model

import (
	"time"

	"github.com/google/uuid"
)

type PetDailyAchievement string

const (
	PetDailyAchievementBecameHappy    PetDailyAchievement = "BECAME_HAPPY"
	PetDailyAchievementBecameEcstatic PetDailyAchievement = "BECAME_ECSTATIC"
	PetDailyAchievementLevelUp        PetDailyAchievement = "LEVEL_UP"
)

type PetNeedChange struct {
	Type          NeedType
	StartingValue int
	EndingValue   int
	Delta         int
}

type PetDailySummary struct {
	Date             time.Time
	PetID            uuid.UUID
	PetName          string
	StartingState    PetState
	EndingState      PetState
	NeedChanges      []PetNeedChange
	StartingGrowthXP int
	EarnedGrowthXP   int
	EndingGrowthXP   int
	StartingLevel    int
	EndingLevel      int
	Achievements     []PetDailyAchievement
}
