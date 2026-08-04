package handler

import (
	"time"

	"github.com/google/uuid"

	"github.com/guitaramust-sudo/Avitosha/app/backend/internal/model"
)

type petDailySummaryDTO struct {
	Date             string                      `json:"date"`
	PetID            uuid.UUID                   `json:"pet_id"`
	PetName          string                      `json:"pet_name"`
	StartingState    model.PetState              `json:"starting_state"`
	EndingState      model.PetState              `json:"ending_state"`
	NeedChanges      []petNeedChangeDTO          `json:"need_changes"`
	StartingGrowthXP int                         `json:"starting_growth_xp"`
	EarnedGrowthXP   int                         `json:"earned_growth_xp"`
	EndingGrowthXP   int                         `json:"ending_growth_xp"`
	StartingLevel    int                         `json:"starting_level"`
	EndingLevel      int                         `json:"ending_level"`
	Achievements     []model.PetDailyAchievement `json:"achievements"`
}

type petNeedChangeDTO struct {
	Type          model.NeedType `json:"type"`
	StartingValue int            `json:"starting_value"`
	EndingValue   int            `json:"ending_value"`
	Delta         int            `json:"delta"`
}

func newPetDailySummaryDTO(summary model.PetDailySummary) petDailySummaryDTO {
	needChanges := make([]petNeedChangeDTO, len(summary.NeedChanges))
	for index, change := range summary.NeedChanges {
		needChanges[index] = petNeedChangeDTO{
			Type: change.Type, StartingValue: change.StartingValue, EndingValue: change.EndingValue, Delta: change.Delta,
		}
	}
	achievements := append([]model.PetDailyAchievement(nil), summary.Achievements...)
	if achievements == nil {
		achievements = make([]model.PetDailyAchievement, 0)
	}
	return petDailySummaryDTO{
		Date: summary.Date.UTC().Format(time.DateOnly), PetID: summary.PetID, PetName: summary.PetName,
		StartingState: summary.StartingState, EndingState: summary.EndingState, NeedChanges: needChanges,
		StartingGrowthXP: summary.StartingGrowthXP, EarnedGrowthXP: summary.EarnedGrowthXP,
		EndingGrowthXP: summary.EndingGrowthXP, StartingLevel: summary.StartingLevel,
		EndingLevel: summary.EndingLevel, Achievements: achievements,
	}
}
