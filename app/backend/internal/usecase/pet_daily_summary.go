package usecase

import (
	"context"
	"fmt"
	"time"

	"github.com/google/uuid"

	"github.com/guitaramust-sudo/Avitosha/app/backend/internal/model"
)

type PetDailySummaryService struct {
	reader PetDailySummaryReader
}

func NewPetDailySummaryService(reader PetDailySummaryReader) *PetDailySummaryService {
	return &PetDailySummaryService{reader: reader}
}

func (service *PetDailySummaryService) GetPreviousDay(ctx context.Context, userID uuid.UUID, now time.Time) (model.PetDailySummary, error) {
	date := utcDate(now).AddDate(0, 0, -1)
	pet, dailyState, err := service.reader.GetPetDailySummarySource(ctx, userID, date)
	if err != nil {
		return model.PetDailySummary{}, fmt.Errorf("get pet daily summary source: %w", err)
	}
	return BuildPetDailySummary(pet, dailyState)
}

func BuildPetDailySummary(pet model.Pet, dailyState model.PetDailyState) (model.PetDailySummary, error) {
	if pet.ID != dailyState.PetID {
		return model.PetDailySummary{}, fmt.Errorf("%w: pet IDs do not match", ErrInconsistentPetDailyState)
	}
	calculatedState, err := DeterminePetState(dailyState)
	if err != nil {
		return model.PetDailySummary{}, fmt.Errorf("determine ending pet state: %w", err)
	}
	if calculatedState != dailyState.State || (dailyState.EcstaticXPGranted && !dailyState.HappyXPGranted) {
		return model.PetDailySummary{}, ErrInconsistentPetDailyState
	}
	startingLevel, err := CalculateLevel(dailyState.StartingGrowthXP)
	if err != nil {
		return model.PetDailySummary{}, fmt.Errorf("calculate starting level: %w", err)
	}
	earnedXP := 0
	achievements := make([]model.PetDailyAchievement, 0, 3)
	if dailyState.HappyXPGranted {
		earnedXP += HappyXPReward
		achievements = append(achievements, model.PetDailyAchievementBecameHappy)
	}
	if dailyState.EcstaticXPGranted {
		earnedXP += EcstaticXPReward
		achievements = append(achievements, model.PetDailyAchievementBecameEcstatic)
	}
	endingXP := dailyState.StartingGrowthXP + earnedXP
	endingLevel, err := CalculateLevel(endingXP)
	if err != nil {
		return model.PetDailySummary{}, fmt.Errorf("calculate ending level: %w", err)
	}
	if endingLevel > startingLevel {
		achievements = append(achievements, model.PetDailyAchievementLevelUp)
	}
	return model.PetDailySummary{
		Date: dailyState.Date, PetID: pet.ID, PetName: pet.Name,
		StartingState: model.PetStateCurious, EndingState: dailyState.State,
		NeedChanges: []model.PetNeedChange{
			newPetNeedChange(model.NeedTypeSatiety, dailyState.Satiety),
			newPetNeedChange(model.NeedTypeMood, dailyState.Mood),
			newPetNeedChange(model.NeedTypeCuriosity, dailyState.Curiosity),
		},
		StartingGrowthXP: dailyState.StartingGrowthXP, EarnedGrowthXP: earnedXP, EndingGrowthXP: endingXP,
		StartingLevel: startingLevel, EndingLevel: endingLevel, Achievements: achievements,
	}, nil
}

func newPetNeedChange(needType model.NeedType, endingValue int) model.PetNeedChange {
	return model.PetNeedChange{
		Type: needType, StartingValue: InitialNeedValue,
		EndingValue: endingValue, Delta: endingValue - InitialNeedValue,
	}
}
