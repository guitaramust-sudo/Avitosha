package handler

import (
	"bytes"
	"context"
	"encoding/json"
	"io"
	"log/slog"
	"net/http"
	"net/http/httptest"
	"testing"
	"time"

	"github.com/google/uuid"

	"github.com/guitaramust-sudo/Avitosha/app/backend/internal/model"
	"github.com/guitaramust-sudo/Avitosha/app/backend/internal/usecase"
)

type fakeGameUseCase struct {
	ensureProfileFunc   func(context.Context, uuid.UUID, time.Time) (usecase.GameProfile, error)
	listTasksFunc       func(context.Context, uuid.UUID, time.Time) ([]model.TaskProgress, error)
	getTaskFunc         func(context.Context, uuid.UUID, uuid.UUID, time.Time) (model.TaskProgress, error)
	getRoomFunc         func(context.Context, uuid.UUID, time.Time) ([]model.RoomItemProgress, error)
	getStoryFunc        func(context.Context, uuid.UUID, time.Time) (model.StorySnapshot, error)
	getDailyFunc        func(context.Context, uuid.UUID, time.Time) (usecase.DailySummary, error)
	getLeaderboardFunc  func(context.Context, uuid.UUID, int, time.Time) (usecase.Leaderboard, error)
	getAchievementsFunc func(context.Context, uuid.UUID, time.Time) ([]model.AchievementProgress, error)
	processActionFunc   func(context.Context, usecase.ProcessActionCommand) (usecase.ProcessActionResult, error)
}

func (fake fakeGameUseCase) EnsureProfile(ctx context.Context, userID uuid.UUID, now time.Time) (usecase.GameProfile, error) {
	return fake.ensureProfileFunc(ctx, userID, now)
}

func (fake fakeGameUseCase) ListTasks(ctx context.Context, userID uuid.UUID, now time.Time) ([]model.TaskProgress, error) {
	return fake.listTasksFunc(ctx, userID, now)
}

func (fake fakeGameUseCase) GetTask(ctx context.Context, userID, taskID uuid.UUID, now time.Time) (model.TaskProgress, error) {
	return fake.getTaskFunc(ctx, userID, taskID, now)
}

func (fake fakeGameUseCase) GetRoom(ctx context.Context, userID uuid.UUID, now time.Time) ([]model.RoomItemProgress, error) {
	return fake.getRoomFunc(ctx, userID, now)
}

func (fake fakeGameUseCase) GetStory(ctx context.Context, userID uuid.UUID, now time.Time) (model.StorySnapshot, error) {
	return fake.getStoryFunc(ctx, userID, now)
}

func (fake fakeGameUseCase) GetDailySummary(ctx context.Context, userID uuid.UUID, now time.Time) (usecase.DailySummary, error) {
	return fake.getDailyFunc(ctx, userID, now)
}

func (fake fakeGameUseCase) GetLeaderboard(ctx context.Context, userID uuid.UUID, limit int, now time.Time) (usecase.Leaderboard, error) {
	return fake.getLeaderboardFunc(ctx, userID, limit, now)
}

func (fake fakeGameUseCase) GetAchievements(ctx context.Context, userID uuid.UUID, now time.Time) ([]model.AchievementProgress, error) {
	return fake.getAchievementsFunc(ctx, userID, now)
}

func (fake fakeGameUseCase) ProcessAction(ctx context.Context, command usecase.ProcessActionCommand) (usecase.ProcessActionResult, error) {
	return fake.processActionFunc(ctx, command)
}

func TestGameRoutesRequireIdentity(t *testing.T) {
	router := newGameTestRouter(RouterDependencies{})
	for _, route := range []struct {
		method string
		path   string
	}{
		{http.MethodGet, "/api/v1/pet"},
		{http.MethodGet, "/api/v1/tasks"},
		{http.MethodPost, "/api/v1/actions"},
		{http.MethodGet, "/api/v1/room"},
		{http.MethodGet, "/api/v1/story"},
		{http.MethodGet, "/api/v1/daily-summary"},
		{http.MethodGet, "/api/v1/leaderboard"},
		{http.MethodGet, "/api/v1/achievements"},
	} {
		request := httptest.NewRequestWithContext(context.Background(), route.method, route.path, nil)
		recorder := httptest.NewRecorder()
		router.ServeHTTP(recorder, request)
		if recorder.Code != http.StatusUnauthorized {
			t.Fatalf("%s %s status = %d, want 401", route.method, route.path, recorder.Code)
		}
	}
}

func TestGetGamePetAcceptsXUserIDAndReturnsProductProfile(t *testing.T) {
	userID := uuid.New()
	petID := uuid.New()
	now := time.Date(2026, 8, 5, 12, 0, 0, 0, time.UTC)
	service := completeFakeGameUseCase()
	service.ensureProfileFunc = func(_ context.Context, gotUserID uuid.UUID, gotNow time.Time) (usecase.GameProfile, error) {
		if gotUserID != userID || !gotNow.Equal(now) {
			t.Fatalf("EnsureProfile(%s, %v)", gotUserID, gotNow)
		}
		return usecase.GameProfile{
			Pet: model.Pet{ID: petID, UserID: userID, Name: "Авитоша", Level: 2, GrowthXP: 130, Mood: model.PetMoodProud},
			Story: model.StorySnapshot{
				Story:    model.Story{Code: "FIRST_ROOM", Title: "Обустроить первую комнату", TotalStages: 5},
				Progress: model.UserStoryProgress{CurrentStage: 2, Status: model.StoryStatusActive},
			},
			NextLevelXP: gameIntPointer(250),
		}, nil
	}
	router := newGameTestRouter(RouterDependencies{GameService: service, Now: func() time.Time { return now }})
	request := httptest.NewRequestWithContext(context.Background(), http.MethodGet, "/api/v1/pet", nil)
	request.Header.Set("X-User-ID", userID.String())
	recorder := httptest.NewRecorder()

	router.ServeHTTP(recorder, request)

	if recorder.Code != http.StatusOK {
		t.Fatalf("status = %d, body = %s", recorder.Code, recorder.Body.String())
	}
	var body map[string]any
	if err := json.Unmarshal(recorder.Body.Bytes(), &body); err != nil {
		t.Fatalf("decode response: %v", err)
	}
	if body["growthXp"] != float64(130) || body["mood"] != "PROUD" {
		t.Fatalf("body = %v", body)
	}
}

func TestGameReadRoutesReturnTasksRoomAndStory(t *testing.T) {
	userID := uuid.New()
	taskID := uuid.New()
	category := "FURNITURE"
	itemCode := "DESK"
	stage := 1
	task := model.Task{ID: taskID, Code: "VIEW_FURNITURE_ADS", ActionType: model.ActionTypeAdViewed,
		Category: &category, TargetValue: 5, XPReward: 30, RoomItemCode: &itemCode, StoryStage: &stage}
	progress := model.TaskProgress{Task: task, Progress: model.UserTask{TaskID: taskID, Progress: 3, TargetValue: 5, Status: model.TaskStatusActive}}
	service := completeFakeGameUseCase()
	service.listTasksFunc = func(context.Context, uuid.UUID, time.Time) ([]model.TaskProgress, error) {
		return []model.TaskProgress{progress}, nil
	}
	service.getTaskFunc = func(context.Context, uuid.UUID, uuid.UUID, time.Time) (model.TaskProgress, error) {
		return progress, nil
	}
	service.getRoomFunc = func(context.Context, uuid.UUID, time.Time) ([]model.RoomItemProgress, error) {
		return []model.RoomItemProgress{{Item: model.RoomItem{Code: "DESK", Name: "Стол"}, Status: model.RoomItemStatusLocked}}, nil
	}
	service.getStoryFunc = func(context.Context, uuid.UUID, time.Time) (model.StorySnapshot, error) {
		return model.StorySnapshot{
			Story:    model.Story{Code: "FIRST_ROOM", TotalStages: 5},
			Progress: model.UserStoryProgress{CurrentStage: 0, Status: model.StoryStatusActive}, NextTask: &task,
		}, nil
	}
	router := newGameTestRouter(RouterDependencies{GameService: service})
	for _, path := range []string{"/api/v1/tasks", "/api/v1/tasks/" + taskID.String(), "/api/v1/room", "/api/v1/story"} {
		request := httptest.NewRequestWithContext(context.Background(), http.MethodGet, path, nil)
		request.Header.Set("X-User-ID", userID.String())
		recorder := httptest.NewRecorder()
		router.ServeHTTP(recorder, request)
		if recorder.Code != http.StatusOK {
			t.Fatalf("GET %s status = %d, body = %s", path, recorder.Code, recorder.Body.String())
		}
	}
}

func TestProcessActionValidatesAndFlattensDomainEvents(t *testing.T) {
	userID := uuid.New()
	eventID := uuid.New()
	domainEventID := uuid.New()
	now := time.Date(2026, 8, 5, 12, 0, 0, 0, time.UTC)
	service := completeFakeGameUseCase()
	service.processActionFunc = func(_ context.Context, command usecase.ProcessActionCommand) (usecase.ProcessActionResult, error) {
		if command.UserID != userID || command.EventID != eventID || command.ActionType != model.ActionTypeAdViewed {
			t.Fatalf("command = %+v", command)
		}
		return usecase.ProcessActionResult{
			ActionID: uuid.New(), Events: []model.DomainEvent{{
				ID: domainEventID, Type: model.DomainEventTaskProgressUpdated, OccurredAt: now,
				Payload: json.RawMessage(`{"taskCode":"VIEW_FURNITURE_ADS","progress":1,"target":5}`),
			}},
		}, nil
	}
	router := newGameTestRouter(RouterDependencies{GameService: service, Now: func() time.Time { return now }})
	body := []byte(`{"eventId":"` + eventID.String() + `","type":"AD_VIEWED","entityId":"advert-1","category":"FURNITURE","occurredAt":"2026-08-05T12:00:00Z","metadata":{}}`)
	request := httptest.NewRequestWithContext(context.Background(), http.MethodPost, "/api/v1/actions", bytes.NewReader(body))
	request.Header.Set("X-User-ID", userID.String())
	recorder := httptest.NewRecorder()

	router.ServeHTTP(recorder, request)

	if recorder.Code != http.StatusOK {
		t.Fatalf("status = %d, body = %s", recorder.Code, recorder.Body.String())
	}
	if !bytes.Contains(recorder.Body.Bytes(), []byte(`"taskCode":"VIEW_FURNITURE_ADS"`)) ||
		bytes.Contains(recorder.Body.Bytes(), []byte(`"payload"`)) {
		t.Fatalf("events were not flattened: %s", recorder.Body.String())
	}
}

func TestProcessActionRejectsMalformedBody(t *testing.T) {
	router := newGameTestRouter(RouterDependencies{GameService: completeFakeGameUseCase()})
	request := httptest.NewRequestWithContext(context.Background(), http.MethodPost, "/api/v1/actions", bytes.NewBufferString(`{"type":"AD_VIEWED"}`))
	request.Header.Set("X-User-ID", uuid.NewString())
	recorder := httptest.NewRecorder()

	router.ServeHTTP(recorder, request)

	if recorder.Code != http.StatusBadRequest {
		t.Fatalf("status = %d, body = %s", recorder.Code, recorder.Body.String())
	}
}

func TestProgressRoutesReturnDailyLeaderboardAndAchievements(t *testing.T) {
	userID := uuid.New()
	now := time.Date(2026, 8, 5, 12, 0, 0, 0, time.UTC)
	service := completeFakeGameUseCase()
	service.getDailyFunc = func(context.Context, uuid.UUID, time.Time) (usecase.DailySummary, error) {
		return usecase.DailySummary{Progress: model.DailyProgress{
			Date: now, ActionsCount: 7, CompletedTasks: 2, EarnedXP: 60,
			LevelBefore: 1, LevelAfter: 2, UnlockedRoomItems: []string{"DESK", "LAMP"},
			StoryStageBefore: 0, StoryStageAfter: 2, WeeklyScoreDelta: 200, PetMood: model.PetMoodProud,
		}, WeeklyPosition: gameIntPointer(14)}, nil
	}
	service.getLeaderboardFunc = func(_ context.Context, gotUserID uuid.UUID, limit int, _ time.Time) (usecase.Leaderboard, error) {
		if gotUserID != userID || limit != 10 {
			t.Fatalf("leaderboard user = %s, limit = %d", gotUserID, limit)
		}
		entry := model.LeaderboardEntry{Position: 1, UserID: userID, PetName: "Авитоша", Level: 2, Score: 200}
		return usecase.Leaderboard{WeekStart: time.Date(2026, 8, 3, 0, 0, 0, 0, time.UTC), Leaders: []model.LeaderboardEntry{entry}, CurrentUser: entry}, nil
	}
	service.getAchievementsFunc = func(context.Context, uuid.UUID, time.Time) ([]model.AchievementProgress, error) {
		unlockedAt := now
		return []model.AchievementProgress{{
			Achievement: model.Achievement{Code: "FIRST_STEP", Title: "Первый шаг"}, UnlockedAt: &unlockedAt,
		}}, nil
	}
	router := newGameTestRouter(RouterDependencies{GameService: service, Now: func() time.Time { return now }})

	for _, path := range []string{
		"/api/v1/daily-summary", "/api/v1/leaderboard?period=weekly&limit=10", "/api/v1/achievements",
	} {
		request := httptest.NewRequestWithContext(context.Background(), http.MethodGet, path, nil)
		request.Header.Set("X-User-ID", userID.String())
		recorder := httptest.NewRecorder()
		router.ServeHTTP(recorder, request)
		if recorder.Code != http.StatusOK {
			t.Fatalf("GET %s status = %d, body = %s", path, recorder.Code, recorder.Body.String())
		}
	}
}

func TestLeaderboardRejectsUnsupportedPeriodAndLimit(t *testing.T) {
	router := newGameTestRouter(RouterDependencies{GameService: completeFakeGameUseCase()})
	for _, path := range []string{
		"/api/v1/leaderboard?period=all-time", "/api/v1/leaderboard?limit=101",
	} {
		request := httptest.NewRequestWithContext(context.Background(), http.MethodGet, path, nil)
		request.Header.Set("X-User-ID", uuid.NewString())
		recorder := httptest.NewRecorder()
		router.ServeHTTP(recorder, request)
		if recorder.Code != http.StatusBadRequest {
			t.Fatalf("GET %s status = %d, body = %s", path, recorder.Code, recorder.Body.String())
		}
	}
}

func completeFakeGameUseCase() fakeGameUseCase {
	return fakeGameUseCase{
		ensureProfileFunc: func(context.Context, uuid.UUID, time.Time) (usecase.GameProfile, error) {
			return usecase.GameProfile{}, nil
		},
		listTasksFunc: func(context.Context, uuid.UUID, time.Time) ([]model.TaskProgress, error) { return nil, nil },
		getTaskFunc: func(context.Context, uuid.UUID, uuid.UUID, time.Time) (model.TaskProgress, error) {
			return model.TaskProgress{}, nil
		},
		getRoomFunc: func(context.Context, uuid.UUID, time.Time) ([]model.RoomItemProgress, error) { return nil, nil },
		getStoryFunc: func(context.Context, uuid.UUID, time.Time) (model.StorySnapshot, error) {
			return model.StorySnapshot{}, nil
		},
		processActionFunc: func(context.Context, usecase.ProcessActionCommand) (usecase.ProcessActionResult, error) {
			return usecase.ProcessActionResult{}, nil
		},
		getDailyFunc: func(context.Context, uuid.UUID, time.Time) (usecase.DailySummary, error) {
			return usecase.DailySummary{}, nil
		},
		getLeaderboardFunc: func(context.Context, uuid.UUID, int, time.Time) (usecase.Leaderboard, error) {
			return usecase.Leaderboard{}, nil
		},
		getAchievementsFunc: func(context.Context, uuid.UUID, time.Time) ([]model.AchievementProgress, error) {
			return nil, nil
		},
	}
}

func newGameTestRouter(overrides RouterDependencies) http.Handler {
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

func gameIntPointer(value int) *int {
	return &value
}
