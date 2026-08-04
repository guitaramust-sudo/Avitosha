package handler

import (
	"context"
	"io"
	"log/slog"
	"net/http"
	"net/http/httptest"
	"testing"
	"time"

	"github.com/google/uuid"

	backendauth "github.com/guitaramust-sudo/Avitosha/app/backend/internal/auth"
	"github.com/guitaramust-sudo/Avitosha/app/backend/internal/model"
	"github.com/guitaramust-sudo/Avitosha/app/backend/internal/usecase"
)

type fakePetLifecycleUseCase struct {
	ensureFunc func(context.Context, uuid.UUID, time.Time) (usecase.PetSnapshot, error)
}

func (fake fakePetLifecycleUseCase) EnsurePet(ctx context.Context, userID uuid.UUID, now time.Time) (usecase.PetSnapshot, error) {
	return fake.ensureFunc(ctx, userID, now)
}

func TestPetRoutesRequireBearerAuthentication(t *testing.T) {
	router := newPetTestRouter(RouterDependencies{})
	for _, request := range []*http.Request{
		httptest.NewRequestWithContext(context.Background(), http.MethodGet, "/api/pet", nil),
		httptest.NewRequestWithContext(context.Background(), http.MethodPost, "/api/pet/items/"+uuid.NewString()+"/use", nil),
		httptest.NewRequestWithContext(context.Background(), http.MethodGet, "/api/pet/daily-summary", nil),
	} {
		recorder := httptest.NewRecorder()
		router.ServeHTTP(recorder, request)
		if recorder.Code != http.StatusUnauthorized {
			t.Fatalf("%s %s status = %d, want 401", request.Method, request.URL.Path, recorder.Code)
		}
	}
}

func TestGetPetUsesAuthenticatedUserFromJWTContext(t *testing.T) {
	userID := uuid.New()
	petID := uuid.New()
	dailyID := uuid.New()
	now := time.Date(2026, 8, 5, 12, 0, 0, 0, time.UTC)
	deps := RouterDependencies{
		AccessTokenVerifier: fakeAccessTokenVerifier{verifyFunc: func(token string) (model.AuthenticatedUser, error) {
			if token != "valid-token" {
				t.Fatalf("token = %q, want valid-token", token)
			}
			return model.AuthenticatedUser{UserID: userID, SessionID: uuid.New()}, nil
		}},
		PetLifecycle: fakePetLifecycleUseCase{ensureFunc: func(ctx context.Context, gotUserID uuid.UUID, gotNow time.Time) (usecase.PetSnapshot, error) {
			if authenticated, ok := backendauth.AuthenticatedUserFromContext(ctx); !ok || authenticated.UserID != userID {
				t.Fatal("authenticated user is missing from handler context")
			}
			if gotUserID != userID || !gotNow.Equal(now) {
				t.Fatalf("EnsurePet args = (%s, %v), want (%s, %v)", gotUserID, gotNow, userID, now)
			}
			return usecase.PetSnapshot{
				Pet: model.Pet{ID: petID, UserID: userID, Name: "Авитоша", Level: 1, CreatedAt: now, UpdatedAt: now},
				DailyState: model.PetDailyState{
					ID: dailyID, PetID: petID, Date: now, Satiety: 50, Mood: 50, Curiosity: 50,
					State: model.PetStateCurious, CreatedAt: now, UpdatedAt: now,
				},
			}, nil
		}},
		Now: func() time.Time { return now },
	}
	router := newPetTestRouter(deps)
	request := httptest.NewRequestWithContext(context.Background(), http.MethodGet, "/api/pet", nil)
	request.Header.Set("Authorization", "Bearer valid-token")
	recorder := httptest.NewRecorder()

	router.ServeHTTP(recorder, request)

	if recorder.Code != http.StatusOK {
		t.Fatalf("status = %d, want 200; body=%s", recorder.Code, recorder.Body.String())
	}
	wantBody := `{"data":{"pet":{"id":"` + petID.String() + `","name":"Авитоша","level":1,"growth_xp":0,"created_at":"2026-08-05T12:00:00Z","updated_at":"2026-08-05T12:00:00Z"},"daily_state":{"id":"` + dailyID.String() + `","date":"2026-08-05","satiety":50,"mood":50,"curiosity":50,"state":"CURIOUS","happy_xp_granted":false,"ecstatic_xp_granted":false,"created_at":"2026-08-05T12:00:00Z","updated_at":"2026-08-05T12:00:00Z"}}}` + "\n"
	if recorder.Body.String() != wantBody {
		t.Fatalf("body = %s\nwant = %s", recorder.Body.String(), wantBody)
	}
}

func TestUsePetItemRejectsInvalidUUID(t *testing.T) {
	userID := uuid.New()
	router := newPetTestRouter(RouterDependencies{
		AccessTokenVerifier: fakeAccessTokenVerifier{verifyFunc: func(string) (model.AuthenticatedUser, error) {
			return model.AuthenticatedUser{UserID: userID, SessionID: uuid.New()}, nil
		}},
	})
	request := httptest.NewRequestWithContext(context.Background(), http.MethodPost, "/api/pet/items/not-a-uuid/use", nil)
	request.Header.Set("Authorization", "Bearer valid-token")
	recorder := httptest.NewRecorder()

	router.ServeHTTP(recorder, request)

	assertErrorResponse(t, recorder, http.StatusBadRequest, invalidRequestCode, "item_id must be a UUID")
}

func newPetTestRouter(overrides RouterDependencies) http.Handler {
	if overrides.Logger == nil {
		overrides.Logger = slog.New(slog.NewTextHandler(io.Discard, nil))
	}
	if overrides.DB == nil {
		overrides.DB = fakeDatabasePinger{}
	}
	if overrides.FrontendOrigin == "" {
		overrides.FrontendOrigin = "http://localhost:3000"
	}
	if overrides.RefreshTokenTTL == 0 {
		overrides.RefreshTokenTTL = 30 * 24 * time.Hour
	}
	return NewRouter(overrides)
}
