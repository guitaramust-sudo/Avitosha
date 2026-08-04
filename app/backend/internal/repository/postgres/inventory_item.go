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

func (repository *PetRepository) GetInventoryItemForUpdate(ctx context.Context, userID, itemID uuid.UUID) (model.InventoryItem, error) {
	var item model.InventoryItem
	err := executorFromContext(ctx, repository.executor).QueryRow(ctx, `
SELECT id, user_id, item_type, status, source_type, source_id, idempotency_key, created_at, used_at
FROM inventory_items
WHERE id = $1 AND user_id = $2
FOR UPDATE
`, itemID, userID).Scan(
		&item.ID, &item.UserID, &item.ItemType, &item.Status, &item.SourceType,
		&item.SourceID, &item.IdempotencyKey, &item.CreatedAt, &item.UsedAt,
	)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return model.InventoryItem{}, usecase.ErrInventoryItemNotFound
		}
		return model.InventoryItem{}, mapPetStorageError("get inventory item", err)
	}
	return item, nil
}

func (repository *PetRepository) MarkInventoryItemUsed(ctx context.Context, userID, itemID uuid.UUID, usedAt time.Time) error {
	tag, err := executorFromContext(ctx, repository.executor).Exec(ctx, `
UPDATE inventory_items
SET status = 'USED', used_at = $3
WHERE id = $1 AND user_id = $2 AND status = 'AVAILABLE'
`, itemID, userID, usedAt)
	if err != nil {
		return mapPetStorageError("mark inventory item used", err)
	}
	if tag.RowsAffected() != 1 {
		return fmt.Errorf("mark inventory item used: %w", usecase.ErrInventoryItemUnavailable)
	}
	return nil
}
