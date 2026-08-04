package handler

import (
	"log/slog"
	"net/http"
	"net/http/httptest"
	"testing"
)

func TestHealthEndpoints(t *testing.T) {
	t.Parallel()

	router := NewRouter(slog.Default())

	tests := []struct {
		name string
		path string
	}{
		{name: "live", path: "/health/live"},
		{name: "ready", path: "/health/ready"},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			t.Parallel()

			req := httptest.NewRequest(http.MethodGet, tt.path, nil)
			rec := httptest.NewRecorder()

			router.ServeHTTP(rec, req)

			if rec.Code != http.StatusOK {
				t.Fatalf("status = %d, want %d", rec.Code, http.StatusOK)
			}
			if contentType := rec.Header().Get("Content-Type"); contentType != "application/json" {
				t.Fatalf("Content-Type = %q, want application/json", contentType)
			}
			if body := rec.Body.String(); body != "{\"status\":\"ok\"}\n" {
				t.Fatalf("body = %q", body)
			}
		})
	}
}
