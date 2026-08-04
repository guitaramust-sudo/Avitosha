package handler

import (
	"time"

	"github.com/google/uuid"

	"github.com/guitaramust-sudo/Avitosha/app/backend/internal/model"
	"github.com/guitaramust-sudo/Avitosha/app/backend/internal/usecase"
)

type dataEnvelope[T any] struct {
	Data T `json:"data"`
}

type petSnapshotDTO struct {
	Pet        petDTO        `json:"pet"`
	DailyState dailyStateDTO `json:"daily_state"`
}

type petDTO struct {
	ID        uuid.UUID `json:"id"`
	Name      string    `json:"name"`
	Level     int       `json:"level"`
	GrowthXP  int       `json:"growth_xp"`
	CreatedAt time.Time `json:"created_at"`
	UpdatedAt time.Time `json:"updated_at"`
}

type dailyStateDTO struct {
	ID                uuid.UUID      `json:"id"`
	Date              string         `json:"date"`
	Satiety           int            `json:"satiety"`
	Mood              int            `json:"mood"`
	Curiosity         int            `json:"curiosity"`
	State             model.PetState `json:"state"`
	HappyXPGranted    bool           `json:"happy_xp_granted"`
	EcstaticXPGranted bool           `json:"ecstatic_xp_granted"`
	CreatedAt         time.Time      `json:"created_at"`
	UpdatedAt         time.Time      `json:"updated_at"`
}

type petCareResultDTO struct {
	Pet        petDTO        `json:"pet"`
	DailyState dailyStateDTO `json:"daily_state"`
	Events     []petEventDTO `json:"events"`
}

type petEventDTO struct {
	Type          model.PetEventType `json:"type"`
	OccurredAt    time.Time          `json:"occurred_at"`
	PreviousState model.PetState     `json:"previous_state"`
	NewState      model.PetState     `json:"new_state"`
	PreviousLevel int                `json:"previous_level"`
	NewLevel      int                `json:"new_level"`
	XPDelta       int                `json:"xp_delta"`
}

func newPetSnapshotDTO(snapshot usecase.PetSnapshot) petSnapshotDTO {
	return petSnapshotDTO{
		Pet: petDTO{
			ID: snapshot.Pet.ID, Name: snapshot.Pet.Name, Level: snapshot.Pet.Level, GrowthXP: snapshot.Pet.GrowthXP,
			CreatedAt: snapshot.Pet.CreatedAt.UTC(), UpdatedAt: snapshot.Pet.UpdatedAt.UTC(),
		},
		DailyState: dailyStateDTO{
			ID: snapshot.DailyState.ID, Date: snapshot.DailyState.Date.UTC().Format(time.DateOnly),
			Satiety: snapshot.DailyState.Satiety, Mood: snapshot.DailyState.Mood, Curiosity: snapshot.DailyState.Curiosity,
			State: snapshot.DailyState.State, HappyXPGranted: snapshot.DailyState.HappyXPGranted,
			EcstaticXPGranted: snapshot.DailyState.EcstaticXPGranted,
			CreatedAt:         snapshot.DailyState.CreatedAt.UTC(), UpdatedAt: snapshot.DailyState.UpdatedAt.UTC(),
		},
	}
}

func newPetCareResultDTO(result usecase.ApplyCareItemResult) petCareResultDTO {
	snapshot := newPetSnapshotDTO(usecase.PetSnapshot{Pet: result.Pet, DailyState: result.DailyState})
	events := make([]petEventDTO, len(result.Events))
	for index, event := range result.Events {
		events[index] = petEventDTO{
			Type: event.Type, OccurredAt: event.OccurredAt.UTC(),
			PreviousState: event.PreviousState, NewState: event.NewState,
			PreviousLevel: event.PreviousLevel, NewLevel: event.NewLevel, XPDelta: event.XPDelta,
		}
	}
	return petCareResultDTO{Pet: snapshot.Pet, DailyState: snapshot.DailyState, Events: events}
}
