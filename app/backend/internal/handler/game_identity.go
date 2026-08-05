package handler

import (
	"context"
	"log/slog"
	"net/http"
	"strings"

	chimiddleware "github.com/go-chi/chi/v5/middleware"
	"github.com/google/uuid"
)

type gameUserContextKey struct{}

func GameIdentity(logger *slog.Logger, verifier AccessTokenVerifier) func(http.Handler) http.Handler {
	if logger == nil {
		logger = slog.Default()
	}
	return func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			if header := strings.TrimSpace(r.Header.Get("X-User-ID")); header != "" {
				userID, err := uuid.Parse(header)
				if err != nil || userID == uuid.Nil {
					writeErrorResponse(w, http.StatusBadRequest, invalidRequestCode, "X-User-ID must be a UUID")
					return
				}
				next.ServeHTTP(w, r.WithContext(context.WithValue(r.Context(), gameUserContextKey{}, userID)))
				return
			}

			authorization := r.Header.Get("Authorization")
			if authorization == "" {
				if queryToken := strings.TrimSpace(r.URL.Query().Get("access_token")); queryToken != "" {
					authorization = "Bearer " + queryToken
				}
			}
			token, err := bearerToken(authorization)
			if err != nil || verifier == nil {
				writeErrorResponse(w, http.StatusUnauthorized, unauthorizedCode, "Authentication is required")
				return
			}
			authenticated, err := verifier.VerifyAccessToken(token)
			if err != nil {
				logger.Warn("game identity verification failed",
					"request_id", chimiddleware.GetReqID(r.Context()), "path", r.URL.Path)
				writeErrorResponse(w, http.StatusUnauthorized, unauthorizedCode, "Authentication is required")
				return
			}
			next.ServeHTTP(w, r.WithContext(context.WithValue(
				r.Context(), gameUserContextKey{}, authenticated.UserID,
			)))
		})
	}
}

func gameUserID(ctx context.Context) (uuid.UUID, bool) {
	userID, ok := ctx.Value(gameUserContextKey{}).(uuid.UUID)
	return userID, ok && userID != uuid.Nil
}
