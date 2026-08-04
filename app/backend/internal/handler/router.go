package handler

import (
	"log/slog"

	"github.com/go-chi/chi/v5"
)

func NewRouter(logger *slog.Logger) *chi.Mux {
	r := chi.NewRouter()

	r.Get("/health/live", Live)
	r.Get("/health/ready", Ready)

	mountAPIRoutes(r, logger)

	return r
}

func mountAPIRoutes(r chi.Router, logger *slog.Logger) {
	_ = logger

	r.Route("/api", func(r chi.Router) {
		_ = r
	})
}
