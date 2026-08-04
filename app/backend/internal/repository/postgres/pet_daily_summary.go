package postgres

import (
	"context"
	"errors"
	"time"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"

	"github.com/guitaramust-sudo/Avitosha/app/backend/internal/model"
	"github.com/guitaramust-sudo/Avitosha/app/backend/internal/usecase"
)

func (repository *PetRepository) GetPetDailySummarySource(ctx context.Context, userID uuid.UUID, date time.Time) (model.Pet, model.PetDailyState, error) {
	var pet model.Pet
	var state model.PetDailyState
	err := executorFromContext(ctx, repository.executor).QueryRow(ctx, `
SELECT p.id, p.user_id, p.name, p.level, p.growth_xp, p.created_at, p.updated_at,
       d.id, d.pet_id, d.date, d.satiety, d.mood, d.curiosity, d.state,
       d.happy_xp_granted, d.ecstatic_xp_granted, d.starting_growth_xp, d.created_at, d.updated_at
FROM pets p
JOIN pet_daily_states d ON d.pet_id = p.id
WHERE p.user_id = $1 AND d.date = $2
`, userID, date).Scan(
		&pet.ID, &pet.UserID, &pet.Name, &pet.Level, &pet.GrowthXP, &pet.CreatedAt, &pet.UpdatedAt,
		&state.ID, &state.PetID, &state.Date, &state.Satiety, &state.Mood, &state.Curiosity, &state.State,
		&state.HappyXPGranted, &state.EcstaticXPGranted, &state.StartingGrowthXP, &state.CreatedAt, &state.UpdatedAt,
	)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return model.Pet{}, model.PetDailyState{}, usecase.ErrPetDailyStateNotFound
		}
		return model.Pet{}, model.PetDailyState{}, mapPetStorageError("get pet daily summary source", err)
	}
	return pet, state, nil
}
