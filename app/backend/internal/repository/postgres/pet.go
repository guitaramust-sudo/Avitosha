package postgres

import (
	"context"
	"errors"
	"fmt"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"

	"github.com/guitaramust-sudo/Avitosha/app/backend/internal/model"
	"github.com/guitaramust-sudo/Avitosha/app/backend/internal/usecase"
)

type PetRepository struct {
	executor QueryExecutor
}

func NewPetRepository(pool *pgxpool.Pool) *PetRepository {
	return &PetRepository{executor: pool}
}

func (repository *PetRepository) GetOrCreatePet(ctx context.Context, candidate model.Pet) (model.Pet, error) {
	executor := executorFromContext(ctx, repository.executor)
	_, err := executor.Exec(ctx, `
INSERT INTO pets (id, user_id, name, level, growth_xp, created_at, updated_at)
VALUES ($1, $2, $3, $4, $5, $6, $7)
ON CONFLICT (user_id) DO NOTHING
`, candidate.ID, candidate.UserID, candidate.Name, candidate.Level, candidate.GrowthXP, candidate.CreatedAt, candidate.UpdatedAt)
	if err != nil {
		return model.Pet{}, mapPetStorageError("create pet", err)
	}
	return repository.GetPetByUserIDForUpdate(ctx, candidate.UserID)
}

func (repository *PetRepository) GetPetByUserIDForUpdate(ctx context.Context, userID uuid.UUID) (model.Pet, error) {
	return scanPet(executorFromContext(ctx, repository.executor).QueryRow(ctx, `
SELECT id, user_id, name, level, growth_xp, created_at, updated_at
FROM pets
WHERE user_id = $1
FOR UPDATE
`, userID))
}

func (repository *PetRepository) UpdatePet(ctx context.Context, pet model.Pet) error {
	tag, err := executorFromContext(ctx, repository.executor).Exec(ctx, `
UPDATE pets
SET name = $2, level = $3, growth_xp = $4, updated_at = $5
WHERE id = $1
`, pet.ID, pet.Name, pet.Level, pet.GrowthXP, pet.UpdatedAt)
	if err != nil {
		return mapPetStorageError("update pet", err)
	}
	if tag.RowsAffected() != 1 {
		return fmt.Errorf("update pet: %w", usecase.ErrPetNotFound)
	}
	return nil
}

func scanPet(row pgx.Row) (model.Pet, error) {
	var pet model.Pet
	if err := row.Scan(&pet.ID, &pet.UserID, &pet.Name, &pet.Level, &pet.GrowthXP, &pet.CreatedAt, &pet.UpdatedAt); err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return model.Pet{}, usecase.ErrPetNotFound
		}
		return model.Pet{}, mapPetStorageError("scan pet", err)
	}
	return pet, nil
}

func mapPetStorageError(operation string, _ error) error {
	return fmt.Errorf("%s: %w", operation, usecase.ErrUnexpectedStorage)
}

var _ usecase.PetLifecycleRepository = (*PetRepository)(nil)
var _ usecase.PetCareRepository = (*PetRepository)(nil)
var _ usecase.PetDailySummaryReader = (*PetRepository)(nil)
