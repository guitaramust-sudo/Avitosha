package usecase

import (
	"context"
	"errors"
	"time"

	"github.com/google/uuid"

	"github.com/guitaramust-sudo/Avitosha/app/backend/internal/model"
)

var ErrSessionNotFound = errors.New("session not found")

type CreateSessionParams struct {
	UserID           uuid.UUID
	RefreshTokenHash []byte
	ExpiresAt        time.Time
	LastUsedAt       time.Time
	UserAgent        *string
}

type RotateSessionParams struct {
	SessionID           uuid.UUID
	OldRefreshTokenHash []byte
	NewRefreshTokenHash []byte
	NewExpiresAt        time.Time
	LastUsedAt          time.Time
}

type SessionRepository interface {
	Create(ctx context.Context, params CreateSessionParams) (model.Session, error)
	GetActiveByRefreshTokenHash(ctx context.Context, refreshTokenHash []byte, now time.Time) (model.Session, error)
	Rotate(ctx context.Context, params RotateSessionParams) (model.Session, error)
	Revoke(ctx context.Context, sessionID uuid.UUID, revokedAt time.Time) error
}
