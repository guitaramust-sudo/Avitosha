package handler

import (
	"context"
	"log/slog"
	"net/http"
	"time"

	"github.com/go-chi/chi/v5"

	"github.com/guitaramust-sudo/Avitosha/app/backend/internal/model"
	"github.com/guitaramust-sudo/Avitosha/app/backend/internal/usecase"
)

type AuthService interface {
	Register(ctx context.Context, params usecase.RegisterParams) (usecase.AuthenticationResult, error)
	Login(ctx context.Context, params usecase.LoginParams) (usecase.AuthenticationResult, error)
	Refresh(ctx context.Context, params usecase.RefreshParams) (usecase.RefreshResult, error)
	Logout(ctx context.Context, params usecase.LogoutParams) error
	GetCurrentUser(ctx context.Context, params usecase.GetCurrentUserParams) (model.User, error)
}

type AccessTokenVerifier interface {
	VerifyAccessToken(token string) (model.AuthenticatedUser, error)
}

type RouterDependencies struct {
	Logger              *slog.Logger
	DB                  DatabasePinger
	AuthService         AuthService
	AccessTokenVerifier AccessTokenVerifier
	FrontendOrigin      string
	RefreshTokenTTL     time.Duration
	SecureRefreshCookie bool
	PetLifecycle        PetLifecycleUseCase
	PetCare             PetCareUseCase
	PetDailySummary     PetDailySummaryUseCase
	Now                 func() time.Time
}

func NewRouter(deps RouterDependencies) *chi.Mux {
	logger := deps.Logger
	if logger == nil {
		logger = slog.Default()
	}

	r := chi.NewRouter()
	swaggerUI := NewSwaggerUIHandler("/api/openapi.yaml")

	r.Use(RequestID)
	r.Use(StructuredRequestLogger(logger))
	r.Use(Recovery(logger))
	r.Use(CORS(deps.FrontendOrigin))

	r.Get("/health/live", Live)
	r.Method("GET", "/health/ready", NewReadyHandler(deps.DB))
	r.Get("/swagger", func(w http.ResponseWriter, req *http.Request) {
		http.Redirect(w, req, "/swagger/", http.StatusMovedPermanently)
	})
	r.Handle("/swagger/*", http.StripPrefix("/swagger", swaggerUI))
	r.Get("/api/openapi.yaml", OpenAPISpec)

	mountAPIRoutes(r, logger, deps)

	return r
}

func mountAPIRoutes(r chi.Router, logger *slog.Logger, deps RouterDependencies) {
	authHandler := NewAuthHandler(AuthHandlerDependencies{
		Logger:              logger,
		AuthService:         deps.AuthService,
		RefreshTokenTTL:     deps.RefreshTokenTTL,
		SecureRefreshCookie: deps.SecureRefreshCookie,
	})
	r.Route("/api", func(r chi.Router) {
		r.Route("/auth", func(r chi.Router) {
			r.Post("/register", authHandler.Register)
			r.Post("/login", authHandler.Login)
			r.Post("/refresh", authHandler.Refresh)
			r.Post("/logout", authHandler.Logout)
		})

		authenticated := BearerAuth(logger, deps.AccessTokenVerifier)
		r.With(authenticated).Get("/me", authHandler.Me)

		petHandler := NewPetHandler(PetHandlerDependencies{
			Logger: logger, Lifecycle: deps.PetLifecycle, Care: deps.PetCare,
			DailySummary: deps.PetDailySummary, Now: deps.Now,
		})
		r.Route("/pet", func(r chi.Router) {
			r.Use(authenticated)
			r.Get("/", petHandler.Get)
			r.Post("/items/{item_id}/use", petHandler.UseItem)
			r.Get("/daily-summary", petHandler.DailySummary)
		})
	})
}
