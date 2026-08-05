package handler

import (
	"context"
	"errors"
	"log/slog"
	"net/http"
	"time"

	"github.com/go-chi/chi/v5"
	chimiddleware "github.com/go-chi/chi/v5/middleware"
	"github.com/google/uuid"

	backendauth "github.com/guitaramust-sudo/Avitosha/app/backend/internal/auth"
	"github.com/guitaramust-sudo/Avitosha/app/backend/internal/model"
	"github.com/guitaramust-sudo/Avitosha/app/backend/internal/usecase"
)

const (
	petNotFoundCode       = "pet_not_found"
	petDayNotFoundCode    = "pet_day_not_found"
	itemNotFoundCode      = "item_not_found"
	itemUnavailableCode   = "item_unavailable"
	invalidPetItemIDCode  = "invalid_request"
	petInternalErrorCode  = "internal_error"
	petAuthenticationCode = "unauthorized"
)

type PetLifecycleUseCase interface {
	EnsurePet(context.Context, uuid.UUID, time.Time) (usecase.PetSnapshot, error)
}

type PetCareUseCase interface {
	ApplyInventoryItem(context.Context, usecase.ApplyInventoryItemCommand) (usecase.ApplyCareItemResult, error)
}

type PetDailySummaryUseCase interface {
	GetPreviousDay(context.Context, uuid.UUID, time.Time) (model.PetDailySummary, error)
}

type PetHandlerDependencies struct {
	Logger       *slog.Logger
	Lifecycle    PetLifecycleUseCase
	Care         PetCareUseCase
	DailySummary PetDailySummaryUseCase
	Now          func() time.Time
}

type PetHandler struct {
	logger       *slog.Logger
	lifecycle    PetLifecycleUseCase
	care         PetCareUseCase
	dailySummary PetDailySummaryUseCase
	now          func() time.Time
}

func NewPetHandler(deps PetHandlerDependencies) PetHandler {
	logger := deps.Logger
	if logger == nil {
		logger = slog.Default()
	}
	now := deps.Now
	if now == nil {
		now = time.Now
	}
	return PetHandler{
		logger: logger, lifecycle: deps.Lifecycle, care: deps.Care,
		dailySummary: deps.DailySummary, now: now,
	}
}

func (handler PetHandler) Get(w http.ResponseWriter, r *http.Request) {
	userID, ok := authenticatedPetUserID(w, r)
	if !ok {
		return
	}
	snapshot, err := handler.lifecycle.EnsurePet(r.Context(), userID, handler.now())
	if err != nil {
		handler.writeUsecaseError(w, r, "get_pet", err)
		return
	}
	writeJSON(w, http.StatusOK, dataEnvelope[petSnapshotDTO]{Data: newPetSnapshotDTO(snapshot)})
}

func (handler PetHandler) UseItem(w http.ResponseWriter, r *http.Request) {
	userID, ok := authenticatedPetUserID(w, r)
	if !ok {
		return
	}
	itemID, err := uuid.Parse(chi.URLParam(r, "item_id"))
	if err != nil {
		writeErrorResponse(w, http.StatusBadRequest, invalidPetItemIDCode, "item_id must be a UUID")
		return
	}
	result, err := handler.care.ApplyInventoryItem(r.Context(), usecase.ApplyInventoryItemCommand{
		UserID: userID, ItemID: itemID, Now: handler.now(),
	})
	if err != nil {
		handler.writeUsecaseError(w, r, "use_pet_item", err)
		return
	}
	writeJSON(w, http.StatusOK, dataEnvelope[petCareResultDTO]{Data: newPetCareResultDTO(result)})
}

func (handler PetHandler) DailySummary(w http.ResponseWriter, r *http.Request) {
	userID, ok := authenticatedPetUserID(w, r)
	if !ok {
		return
	}
	summary, err := handler.dailySummary.GetPreviousDay(r.Context(), userID, handler.now())
	if err != nil {
		handler.writeUsecaseError(w, r, "get_pet_daily_summary", err)
		return
	}
	writeJSON(w, http.StatusOK, dataEnvelope[petDailySummaryDTO]{Data: newPetDailySummaryDTO(summary)})
}

func authenticatedPetUserID(w http.ResponseWriter, r *http.Request) (uuid.UUID, bool) {
	authenticatedUser, ok := backendauth.AuthenticatedUserFromContext(r.Context())
	if !ok {
		writeErrorResponse(w, http.StatusUnauthorized, petAuthenticationCode, "Authentication is required")
		return uuid.Nil, false
	}
	return authenticatedUser.UserID, true
}

func (handler PetHandler) writeUsecaseError(w http.ResponseWriter, r *http.Request, operation string, err error) {
	status, code, message := mapPetUsecaseError(err)
	if status == http.StatusInternalServerError {
		handler.logger.Error("pet request failed",
			"request_id", chimiddleware.GetReqID(r.Context()), "operation", operation, "error", err.Error())
	}
	writeErrorResponse(w, status, code, message)
}

func mapPetUsecaseError(err error) (int, string, string) {
	switch {
	case errors.Is(err, usecase.ErrPetNotFound):
		return http.StatusNotFound, petNotFoundCode, "Pet not found"
	case errors.Is(err, usecase.ErrPetDailyStateNotFound):
		return http.StatusNotFound, petDayNotFoundCode, "Pet daily state not found"
	case errors.Is(err, usecase.ErrInventoryItemNotFound):
		return http.StatusNotFound, itemNotFoundCode, "Inventory item not found"
	case errors.Is(err, usecase.ErrInventoryItemUnavailable):
		return http.StatusConflict, itemUnavailableCode, "Inventory item is unavailable"
	default:
		return http.StatusInternalServerError, petInternalErrorCode, "Internal server error"
	}
}
