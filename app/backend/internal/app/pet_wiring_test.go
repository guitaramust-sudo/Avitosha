package app

import (
	"context"
	"testing"

	"github.com/jackc/pgx/v5/pgxpool"
)

type fakeAppTxManager struct{}

func (fakeAppTxManager) WithinTx(ctx context.Context, fn func(context.Context) error) error {
	return fn(ctx)
}

func TestNewPetServicesBuildsAllServicesFromSharedInfrastructure(t *testing.T) {
	services := newPetServices(&pgxpool.Pool{}, fakeAppTxManager{})

	if services.lifecycle == nil || services.care == nil || services.dailySummary == nil {
		t.Fatalf("pet services are incomplete: %+v", services)
	}
}
