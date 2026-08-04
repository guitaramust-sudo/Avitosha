package usecase

import (
	"testing"
	"time"

	"github.com/google/uuid"

	"github.com/guitaramust-sudo/Avitosha/app/backend/internal/model"
)

func TestNewPetDailyStateStartsUTCNeedsAtFifty(t *testing.T) {
	now := time.Date(2026, 8, 5, 10, 0, 0, 0, time.UTC)
	state := NewPetDailyState(uuid.New(), uuid.New(), now, now, 75)

	if state.Satiety != 50 || state.Mood != 50 || state.Curiosity != 50 {
		t.Fatalf("initial needs = (%d, %d, %d), want (50, 50, 50)", state.Satiety, state.Mood, state.Curiosity)
	}
	if state.State != model.PetStateCurious {
		t.Fatalf("state = %q, want %q", state.State, model.PetStateCurious)
	}
	if state.StartingGrowthXP != 75 {
		t.Fatalf("starting XP = %d, want 75", state.StartingGrowthXP)
	}
}

func TestDeterminePetStateUsesClosedNeedsAndLowNeedPriority(t *testing.T) {
	tests := []struct {
		name      string
		satiety   int
		mood      int
		curiosity int
		wantState model.PetState
	}{
		{name: "all closed", satiety: 80, mood: 90, curiosity: 100, wantState: model.PetStateEcstatic},
		{name: "two closed", satiety: 80, mood: 80, curiosity: 0, wantState: model.PetStateHappy},
		{name: "one closed", satiety: 80, mood: 0, curiosity: 0, wantState: model.PetStateContent},
		{name: "hungry before bored", satiety: 39, mood: 20, curiosity: 50, wantState: model.PetStateHungry},
		{name: "bored", satiety: 40, mood: 39, curiosity: 50, wantState: model.PetStateBored},
		{name: "curious fallback", satiety: 40, mood: 40, curiosity: 50, wantState: model.PetStateCurious},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			got, err := DeterminePetState(model.PetDailyState{
				Satiety: tt.satiety, Mood: tt.mood, Curiosity: tt.curiosity,
			})
			if err != nil {
				t.Fatalf("DeterminePetState() error = %v", err)
			}
			if got != tt.wantState {
				t.Fatalf("state = %q, want %q", got, tt.wantState)
			}
		})
	}
}

func TestDeterminePetStateRejectsOutOfRangeNeeds(t *testing.T) {
	_, err := DeterminePetState(model.PetDailyState{Satiety: 101, Mood: 50, Curiosity: 50})
	if err != ErrInvalidNeedValue {
		t.Fatalf("error = %v, want %v", err, ErrInvalidNeedValue)
	}
}

func TestCalculateLevelThresholds(t *testing.T) {
	tests := map[int]int{0: 1, 99: 1, 100: 2, 249: 2, 250: 3, 449: 3, 450: 4, 699: 4, 700: 5}
	for xp, want := range tests {
		got, err := CalculateLevel(xp)
		if err != nil {
			t.Fatalf("CalculateLevel(%d) error = %v", xp, err)
		}
		if got != want {
			t.Fatalf("CalculateLevel(%d) = %d, want %d", xp, got, want)
		}
	}
}

func TestApplyCareItemCapsNeedAndGrantsDailyRewardsOnce(t *testing.T) {
	now := time.Date(2026, 8, 5, 10, 0, 0, 0, time.UTC)
	pet := model.Pet{ID: uuid.New(), UserID: uuid.New(), Name: "Авитоша", Level: 1, GrowthXP: 60}
	state := model.PetDailyState{
		ID: uuid.New(), PetID: pet.ID, Date: now, Satiety: 90, Mood: 90, Curiosity: 50,
		State: model.PetStateHappy, HappyXPGranted: true,
	}

	first, err := ApplyCareItem(pet, state, model.ItemTypeBook, now)
	if err != nil {
		t.Fatalf("ApplyCareItem() error = %v", err)
	}
	if first.DailyState.Curiosity != 90 || first.DailyState.State != model.PetStateEcstatic {
		t.Fatalf("daily state = %+v, want curiosity 90 and ECSTATIC", first.DailyState)
	}
	if first.Pet.GrowthXP != 70 {
		t.Fatalf("XP = %d, want 70", first.Pet.GrowthXP)
	}
	if !first.DailyState.EcstaticXPGranted {
		t.Fatal("ecstatic reward flag was not saved")
	}

	second, err := ApplyCareItem(first.Pet, first.DailyState, model.ItemTypeBook, now.Add(time.Minute))
	if err != nil {
		t.Fatalf("second ApplyCareItem() error = %v", err)
	}
	if second.DailyState.Curiosity != 100 {
		t.Fatalf("capped curiosity = %d, want 100", second.DailyState.Curiosity)
	}
	if second.Pet.GrowthXP != 70 {
		t.Fatalf("duplicate reward changed XP to %d, want 70", second.Pet.GrowthXP)
	}
}

func TestApplyCareItemCanLevelUp(t *testing.T) {
	now := time.Date(2026, 8, 5, 10, 0, 0, 0, time.UTC)
	pet := model.Pet{ID: uuid.New(), UserID: uuid.New(), Level: 1, GrowthXP: 80}
	state := model.PetDailyState{
		ID: uuid.New(), PetID: pet.ID, Satiety: 90, Mood: 50, Curiosity: 50, State: model.PetStateContent,
	}

	result, err := ApplyCareItem(pet, state, model.ItemTypeToy, now)
	if err != nil {
		t.Fatalf("ApplyCareItem() error = %v", err)
	}
	if result.Pet.GrowthXP != 110 || result.Pet.Level != 2 {
		t.Fatalf("progress = %d XP level %d, want 110 XP level 2", result.Pet.GrowthXP, result.Pet.Level)
	}
	if len(result.Events) != 3 {
		t.Fatalf("events count = %d, want state, happy, and level events", len(result.Events))
	}
}
