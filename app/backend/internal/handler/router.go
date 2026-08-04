package handler

import (
	"log/slog"
	"net/http"

	"github.com/go-chi/chi/v5"
)

func NewRouter(logger *slog.Logger, db DatabasePinger) *chi.Mux {
	r := chi.NewRouter()
	swaggerUI := NewSwaggerUIHandler("/api/openapi.yaml")

	r.Get("/health/live", Live)
	r.Method("GET", "/health/ready", NewReadyHandler(db))
	r.Get("/swagger", func(w http.ResponseWriter, req *http.Request) {
		http.Redirect(w, req, "/swagger/", http.StatusMovedPermanently)
	})
	r.Handle("/swagger/*", http.StripPrefix("/swagger", swaggerUI))
	r.Get("/api/openapi.yaml", OpenAPISpec)

	mountAPIRoutes(r, logger)

	return r
}

func mountAPIRoutes(r chi.Router, logger *slog.Logger) {
	_ = logger

	r.Route("/api", func(r chi.Router) {
		_ = r
	})
}
