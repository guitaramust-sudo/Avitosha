package model

import (
	"time"

	"github.com/google/uuid"
)

type NeedType string

const (
	NeedTypeSatiety   NeedType = "SATIETY"
	NeedTypeMood      NeedType = "MOOD"
	NeedTypeCuriosity NeedType = "CURIOSITY"
)

type Pet struct {
	ID        uuid.UUID
	UserID    uuid.UUID
	Name      string
	Level     int
	GrowthXP  int
	CreatedAt time.Time
	UpdatedAt time.Time
}
