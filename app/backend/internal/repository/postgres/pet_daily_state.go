package postgres

import (
	"context"
	"errors"
	"fmt"
	"time"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"

	"github.com/guitaramust-sudo/Avitosha/app/backend/internal/model"
	"github.com/guitaramust-sudo/Avitosha/app/backend/internal/usecase"
)

func (repository *PetRepository) GetOrCreateDailyState(ctx context.Context, candidate model.PetDailyState) (model.PetDailyState, error) {
	executor := executorFromContext(ctx, repository.executor)
	_, err := executor.Exec(ctx, `
INSERT INTO pet_daily_states (
    id, pet_id, date, satiety, mood, curiosity, state,
    happy_xp_granted, ecstatic_xp_granted, starting_growth_xp, created_at, updated_at
)
VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
ON CONFLICT (pet_id, date) DO NOTHING
`, candidate.ID, candidate.PetID, candidate.Date, candidate.Satiety, candidate.Mood, candidate.Curiosity,
		candidate.State, candidate.HappyXPGranted, candidate.EcstaticXPGranted, candidate.StartingGrowthXP,
		candidate.CreatedAt, candidate.UpdatedAt)
	if err != nil {
		return model.PetDailyState{}, mapPetStorageError("create pet daily state", err)
	}
	return repository.getDailyStateForUpdate(ctx, candidate.PetID, candidate.Date)
}

func (repository *PetRepository) getDailyStateForUpdate(ctx context.Context, petID uuid.UUID, date time.Time) (model.PetDailyState, error) {
	return scanPetDailyState(executorFromContext(ctx, repository.executor).QueryRow(ctx, `
SELECT id, pet_id, date, satiety, mood, curiosity, state,
       happy_xp_granted, ecstatic_xp_granted, starting_growth_xp, created_at, updated_at
FROM pet_daily_states
WHERE pet_id = $1 AND date = $2
FOR UPDATE
`, petID, date))
}

func (repository *PetRepository) UpdateDailyState(ctx context.Context, dailyState model.PetDailyState) error {
	tag, err := executorFromContext(ctx, repository.executor).Exec(ctx, `
UPDATE pet_daily_states
SET satiety = $2, mood = $3, curiosity = $4, state = $5,
    happy_xp_granted = $6, ecstatic_xp_granted = $7, updated_at = $8
WHERE id = $1
`, dailyState.ID, dailyState.Satiety, dailyState.Mood, dailyState.Curiosity, dailyState.State,
		dailyState.HappyXPGranted, dailyState.EcstaticXPGranted, dailyState.UpdatedAt)
	if err != nil {
		return mapPetStorageError("update pet daily state", err)
	}
	if tag.RowsAffected() != 1 {
		return fmt.Errorf("update pet daily state: %w", usecase.ErrPetDailyStateNotFound)
	}
	return nil
}

func scanPetDailyState(row pgx.Row) (model.PetDailyState, error) {
	var state model.PetDailyState
	if err := row.Scan(
		&state.ID, &state.PetID, &state.Date, &state.Satiety, &state.Mood, &state.Curiosity, &state.State,
		&state.HappyXPGranted, &state.EcstaticXPGranted, &state.StartingGrowthXP, &state.CreatedAt, &state.UpdatedAt,
	); err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return model.PetDailyState{}, usecase.ErrPetDailyStateNotFound
		}
		return model.PetDailyState{}, mapPetStorageError("scan pet daily state", err)
	}
	return state, nil
}
