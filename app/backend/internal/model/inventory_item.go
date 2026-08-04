package model

import (
	"time"

	"github.com/google/uuid"
)

type ItemType string

const (
	ItemTypeFood ItemType = "FOOD"
	ItemTypeToy  ItemType = "TOY"
	ItemTypeBook ItemType = "BOOK"
)

type InventoryItemStatus string

const (
	InventoryItemStatusAvailable InventoryItemStatus = "AVAILABLE"
	InventoryItemStatusUsed      InventoryItemStatus = "USED"
	InventoryItemStatusExpired   InventoryItemStatus = "EXPIRED"
)

type InventoryItem struct {
	ID             uuid.UUID
	UserID         uuid.UUID
	ItemType       ItemType
	Status         InventoryItemStatus
	SourceType     string
	SourceID       uuid.UUID
	IdempotencyKey string
	CreatedAt      time.Time
	UsedAt         *time.Time
}
