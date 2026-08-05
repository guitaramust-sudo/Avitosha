package usecase

import (
	"time"

	"github.com/google/uuid"

	"github.com/guitaramust-sudo/Avitosha/app/backend/internal/model"
)

const (
	NeedMin               = 0
	NeedMax               = 100
	InitialNeedValue      = 50
	ClosedNeedThreshold   = 80
	LowNeedThreshold      = 40
	CareItemEffect        = 40
	HappyXPReward         = 30
	EcstaticXPReward      = 10
	LevelTwoXPThreshold   = 100
	LevelThreeXPThreshold = 250
	LevelFourXPThreshold  = 450
	LevelFiveXPThreshold  = 700
	MaxPetLevel           = 5
)

type ApplyCareItemResult struct {
	Pet        model.Pet
	DailyState model.PetDailyState
	Events     []model.PetEvent
}

func NewPetDailyState(id, petID uuid.UUID, date, now time.Time, startingGrowthXP int) model.PetDailyState {
	return model.PetDailyState{
		ID: id, PetID: petID, Date: date,
		Satiety: InitialNeedValue, Mood: InitialNeedValue, Curiosity: InitialNeedValue,
		State: model.PetStateCurious, StartingGrowthXP: startingGrowthXP,
		CreatedAt: now, UpdatedAt: now,
	}
}

func DeterminePetState(dailyState model.PetDailyState) (model.PetState, error) {
	needs := [...]int{dailyState.Satiety, dailyState.Mood, dailyState.Curiosity}
	closedNeeds := 0
	for _, need := range needs {
		if need < NeedMin || need > NeedMax {
			return "", ErrInvalidNeedValue
		}
		if need >= ClosedNeedThreshold {
			closedNeeds++
		}
	}

	switch closedNeeds {
	case 3:
		return model.PetStateEcstatic, nil
	case 2:
		return model.PetStateHappy, nil
	case 1:
		return model.PetStateContent, nil
	default:
		if dailyState.Satiety < LowNeedThreshold {
			return model.PetStateHungry, nil
		}
		if dailyState.Mood < LowNeedThreshold {
			return model.PetStateBored, nil
		}
		return model.PetStateCurious, nil
	}
}

func CalculateLevel(growthXP int) (int, error) {
	if growthXP < 0 {
		return 0, ErrInvalidGrowthXP
	}
	switch {
	case growthXP >= LevelFiveXPThreshold:
		return MaxPetLevel, nil
	case growthXP >= LevelFourXPThreshold:
		return 4, nil
	case growthXP >= LevelThreeXPThreshold:
		return 3, nil
	case growthXP >= LevelTwoXPThreshold:
		return 2, nil
	default:
		return 1, nil
	}
}

func ApplyCareItem(pet model.Pet, dailyState model.PetDailyState, itemType model.ItemType, now time.Time) (ApplyCareItemResult, error) {
	previousState := dailyState.State
	previousLevel := pet.Level
	previousGrowthXP := pet.GrowthXP

	if _, err := DeterminePetState(dailyState); err != nil {
		return ApplyCareItemResult{}, err
	}
	if pet.GrowthXP < 0 {
		return ApplyCareItemResult{}, ErrInvalidGrowthXP
	}

	switch itemType {
	case model.ItemTypeFood:
		dailyState.Satiety = min(dailyState.Satiety+CareItemEffect, NeedMax)
	case model.ItemTypeToy:
		dailyState.Mood = min(dailyState.Mood+CareItemEffect, NeedMax)
	case model.ItemTypeBook:
		dailyState.Curiosity = min(dailyState.Curiosity+CareItemEffect, NeedMax)
	default:
		return ApplyCareItemResult{}, ErrInvalidItemType
	}

	newState, err := DeterminePetState(dailyState)
	if err != nil {
		return ApplyCareItemResult{}, err
	}
	dailyState.State = newState

	happyGranted := false
	if (newState == model.PetStateHappy || newState == model.PetStateEcstatic) && !dailyState.HappyXPGranted {
		pet.GrowthXP += HappyXPReward
		dailyState.HappyXPGranted = true
		happyGranted = true
	}
	ecstaticGranted := false
	if newState == model.PetStateEcstatic && !dailyState.EcstaticXPGranted {
		pet.GrowthXP += EcstaticXPReward
		dailyState.EcstaticXPGranted = true
		ecstaticGranted = true
	}

	calculatedLevel, err := CalculateLevel(pet.GrowthXP)
	if err != nil {
		return ApplyCareItemResult{}, err
	}
	if calculatedLevel > pet.Level {
		pet.Level = calculatedLevel
	}
	pet.UpdatedAt = now
	dailyState.UpdatedAt = now

	baseEvent := model.PetEvent{
		PetID: pet.ID, UserID: pet.UserID, OccurredAt: now,
		PreviousState: previousState, NewState: newState,
		PreviousLevel: previousLevel, NewLevel: pet.Level,
	}
	events := make([]model.PetEvent, 0, 4)
	if previousState != newState {
		event := baseEvent
		event.Type = model.PetEventTypeStateChanged
		events = append(events, event)
	}
	if happyGranted {
		event := baseEvent
		event.Type = model.PetEventTypeBecameHappy
		event.XPDelta = HappyXPReward
		events = append(events, event)
	}
	if ecstaticGranted {
		event := baseEvent
		event.Type = model.PetEventTypeBecameEcstatic
		event.XPDelta = EcstaticXPReward
		events = append(events, event)
	}
	if previousLevel < pet.Level {
		event := baseEvent
		event.Type = model.PetEventTypeLevelUp
		event.XPDelta = pet.GrowthXP - previousGrowthXP
		events = append(events, event)
	}

	return ApplyCareItemResult{Pet: pet, DailyState: dailyState, Events: events}, nil
}
