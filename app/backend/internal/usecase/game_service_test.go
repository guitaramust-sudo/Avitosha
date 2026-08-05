package usecase

import (
	"context"
	"encoding/json"
	"testing"
	"time"

	"github.com/google/uuid"

	"github.com/guitaramust-sudo/Avitosha/app/backend/internal/model"
)

type gameTestTxManager struct {
	inside bool
}

func (manager *gameTestTxManager) WithinTx(ctx context.Context, fn func(context.Context) error) error {
	if manager.inside {
		return fn(ctx)
	}
	manager.inside = true
	defer func() { manager.inside = false }()
	return fn(ctx)
}

type gameTestPublisher struct {
	txManager *gameTestTxManager
	users     []uuid.UUID
	batches   [][]model.DomainEvent
	insideTx  bool
}

func (publisher *gameTestPublisher) Publish(userID uuid.UUID, events []model.DomainEvent) {
	publisher.insideTx = publisher.insideTx || publisher.txManager.inside
	publisher.users = append(publisher.users, userID)
	publisher.batches = append(publisher.batches, append([]model.DomainEvent(nil), events...))
}

type gameTestRepository struct {
	GameRepository
	pet          model.Pet
	story        model.UserStoryProgress
	tasksByStage map[int]model.Task
	userTasks    map[uuid.UUID]model.UserTask
	actions      map[uuid.UUID]model.UserAction
	roomItems    map[string]model.UserRoomItem
	weekly       model.WeeklyProgress
	daily        model.DailyProgress
	scores       model.ActivityScores
	achievements map[string]model.UserAchievement
	events       []model.DomainEvent
}

func newGameTestRepository(userID uuid.UUID) *gameTestRepository {
	category := "FURNITURE"
	storyCode := FirstRoomStoryCode
	stageOne := 1
	stageTwo := 2
	desk := "DESK"
	lamp := "LAMP"
	return &gameTestRepository{
		tasksByStage: map[int]model.Task{
			1: {
				ID: uuid.New(), Code: "VIEW_FURNITURE_ADS", Title: "Стол",
				ActionType: model.ActionTypeAdViewed, Category: &category,
				TargetValue: 5, XPReward: 30, RoomItemCode: &desk,
				StoryCode: &storyCode, StoryStage: &stageOne, IsActive: true,
			},
			2: {
				ID: uuid.New(), Code: "FAVORITE_FURNITURE_AD", Title: "Лампа",
				ActionType: model.ActionTypeAdFavorited, Category: &category,
				TargetValue: 1, XPReward: 30, RoomItemCode: &lamp,
				StoryCode: &storyCode, StoryStage: &stageTwo, IsActive: true,
			},
		},
		userTasks: make(map[uuid.UUID]model.UserTask), actions: make(map[uuid.UUID]model.UserAction),
		roomItems: make(map[string]model.UserRoomItem), achievements: make(map[string]model.UserAchievement),
		scores: model.ActivityScores{UserID: userID},
	}
}

func (repository *gameTestRepository) GetOrCreateGamePet(_ context.Context, candidate model.Pet) (model.Pet, error) {
	if repository.pet.ID == uuid.Nil {
		repository.pet = candidate
	}
	return repository.pet, nil
}

func (repository *gameTestRepository) UpdateGamePet(_ context.Context, pet model.Pet) error {
	repository.pet = pet
	return nil
}

func (repository *gameTestRepository) GetOrCreateStoryProgress(
	_ context.Context,
	candidate model.UserStoryProgress,
) (model.UserStoryProgress, error) {
	if repository.story.ID == uuid.Nil {
		repository.story = candidate
	}
	return repository.story, nil
}

func (repository *gameTestRepository) GetStorySnapshot(
	_ context.Context,
	_ uuid.UUID,
	_ string,
) (model.StorySnapshot, error) {
	snapshot := model.StorySnapshot{
		Story:    model.Story{Code: FirstRoomStoryCode, Title: "Первая комната", TotalStages: 5, IsActive: true},
		Progress: repository.story,
	}
	if next, ok := repository.tasksByStage[repository.story.CurrentStage+1]; ok {
		snapshot.NextTask = &next
	}
	return snapshot, nil
}

func (repository *gameTestRepository) UpdateStoryProgress(_ context.Context, progress model.UserStoryProgress) error {
	repository.story = progress
	return nil
}

func (repository *gameTestRepository) EnsureInitialRoomItem(_ context.Context, item model.UserRoomItem) error {
	if _, ok := repository.roomItems[item.ItemCode]; !ok {
		repository.roomItems[item.ItemCode] = item
	}
	return nil
}

func (repository *gameTestRepository) UnlockRoomItem(_ context.Context, item model.UserRoomItem) (bool, error) {
	if _, ok := repository.roomItems[item.ItemCode]; ok {
		return false, nil
	}
	repository.roomItems[item.ItemCode] = item
	return true, nil
}

func (repository *gameTestRepository) AssignStoryTask(
	_ context.Context,
	userID uuid.UUID,
	_ string,
	stage int,
	now time.Time,
) (model.TaskProgress, error) {
	task, ok := repository.tasksByStage[stage]
	if !ok {
		return model.TaskProgress{}, ErrTaskNotFound
	}
	progress, exists := repository.userTasks[task.ID]
	if !exists {
		progress = model.UserTask{
			ID: uuid.New(), UserID: userID, TaskID: task.ID, TargetValue: task.TargetValue,
			Status: model.TaskStatusActive, AssignedAt: now, CreatedAt: now, UpdatedAt: now,
		}
		repository.userTasks[task.ID] = progress
	}
	return model.TaskProgress{Task: task, Progress: progress}, nil
}

func (repository *gameTestRepository) FindMatchingActiveTasksForUpdate(
	_ context.Context,
	_ uuid.UUID,
	actionType model.ActionType,
	category *string,
) ([]model.TaskProgress, error) {
	result := make([]model.TaskProgress, 0, 1)
	for taskID, progress := range repository.userTasks {
		task := repository.taskByID(taskID)
		if progress.Status != model.TaskStatusActive || task.ActionType != actionType {
			continue
		}
		if task.Category != nil && !equalStringPointers(task.Category, category) {
			continue
		}
		result = append(result, model.TaskProgress{Task: task, Progress: progress})
	}
	return result, nil
}

func (repository *gameTestRepository) UpdateTaskProgress(_ context.Context, progress model.UserTask) error {
	repository.userTasks[progress.TaskID] = progress
	return nil
}

func (repository *gameTestRepository) InsertAction(
	_ context.Context,
	candidate model.UserAction,
) (model.UserAction, bool, error) {
	if existing, ok := repository.actions[candidate.EventID]; ok {
		return existing, false, nil
	}
	repository.actions[candidate.EventID] = candidate
	return candidate, true, nil
}

func (repository *gameTestRepository) CompleteAction(
	_ context.Context,
	actionID uuid.UUID,
	processedAt time.Time,
	events []model.DomainEvent,
) error {
	for eventID, action := range repository.actions {
		if action.ID != actionID {
			continue
		}
		action.ProcessedAt = &processedAt
		action.ResultEvents, _ = json.Marshal(events)
		repository.actions[eventID] = action
		return nil
	}
	return ErrActionNotFound
}

func (repository *gameTestRepository) InsertDomainEvents(_ context.Context, events []model.DomainEvent) error {
	repository.events = append(repository.events, events...)
	return nil
}

func (repository *gameTestRepository) UpdateWeeklyProgress(
	_ context.Context,
	userID uuid.UUID,
	weekStart time.Time,
	delta WeeklyProgressDelta,
	now time.Time,
) (model.WeeklyProgress, error) {
	repository.weekly.UserID = userID
	repository.weekly.WeekStart = weekStart
	repository.weekly.EarnedXP += delta.EarnedXP
	repository.weekly.CompletedTasks += delta.CompletedTasks
	repository.weekly.CompletedStages += delta.CompletedStages
	repository.weekly.Score += WeeklyScore(delta)
	repository.weekly.UpdatedAt = now
	return repository.weekly, nil
}

func (repository *gameTestRepository) UpdateDailyProgress(
	_ context.Context,
	userID uuid.UUID,
	date time.Time,
	delta DailyProgressDelta,
	_ time.Time,
) (model.DailyProgress, error) {
	if repository.daily.ActionsCount == 0 {
		repository.daily.LevelBefore = delta.LevelBefore
		repository.daily.StoryStageBefore = delta.StoryStageBefore
	}
	repository.daily.UserID = userID
	repository.daily.Date = date
	repository.daily.ActionsCount += delta.ActionsCount
	repository.daily.CompletedTasks += delta.CompletedTasks
	repository.daily.EarnedXP += delta.EarnedXP
	repository.daily.LevelAfter = delta.LevelAfter
	repository.daily.UnlockedRoomItems = append(repository.daily.UnlockedRoomItems, delta.UnlockedRoomItems...)
	repository.daily.StoryStageAfter = delta.StoryStageAfter
	repository.daily.WeeklyScoreDelta += delta.WeeklyScoreDelta
	repository.daily.PetMood = delta.PetMood
	return repository.daily, nil
}

func (repository *gameTestRepository) UpdateActivityScores(
	_ context.Context,
	_ uuid.UUID,
	delta ActivityScoreDelta,
	now time.Time,
) (model.ActivityScores, error) {
	repository.scores.BuyerScore += delta.Buyer
	repository.scores.SellerScore += delta.Seller
	repository.scores.AutoScore += delta.Auto
	repository.scores.TravelScore += delta.Travel
	repository.scores.RealEstateScore += delta.RealEstate
	repository.scores.ServicesScore += delta.Services
	repository.scores.UpdatedAt = now
	return repository.scores, nil
}

func (repository *gameTestRepository) UnlockAchievements(
	_ context.Context,
	userID uuid.UUID,
	codes []string,
	now time.Time,
) ([]model.UserAchievement, error) {
	result := make([]model.UserAchievement, 0, len(codes))
	for _, code := range codes {
		if _, exists := repository.achievements[code]; exists {
			continue
		}
		achievement := model.UserAchievement{
			ID: uuid.New(), UserID: userID, AchievementCode: code, UnlockedAt: now,
		}
		repository.achievements[code] = achievement
		result = append(result, achievement)
	}
	return result, nil
}

func (repository *gameTestRepository) taskByID(id uuid.UUID) model.Task {
	for _, task := range repository.tasksByStage {
		if task.ID == id {
			return task
		}
	}
	return model.Task{}
}

func TestProcessActionCompletesFirstRoomStageAndIsIdempotent(t *testing.T) {
	userID := uuid.New()
	repository := newGameTestRepository(userID)
	txManager := &gameTestTxManager{}
	publisher := &gameTestPublisher{txManager: txManager}
	service := NewGameService(GameServiceDependencies{
		Repository: repository, TxManager: txManager, IDGenerator: uuid.New, Publisher: publisher,
	})
	now := time.Date(2026, 8, 5, 12, 0, 0, 0, time.UTC)
	category := "furniture"

	var lastCommand ProcessActionCommand
	for index := 0; index < 5; index++ {
		lastCommand = ProcessActionCommand{
			UserID: userID, EventID: uuid.New(), ActionType: model.ActionTypeAdViewed,
			EntityID: gameStringPointer("advert-" + string(rune('1'+index))), Category: &category,
			Metadata: json.RawMessage(`{}`), OccurredAt: now.Add(time.Duration(index) * time.Minute),
			Now: now.Add(time.Duration(index) * time.Minute),
		}
		result, err := service.ProcessAction(context.Background(), lastCommand)
		if err != nil {
			t.Fatalf("ProcessAction(%d) error = %v", index+1, err)
		}
		if result.Duplicate {
			t.Fatalf("ProcessAction(%d) unexpectedly duplicate", index+1)
		}
	}

	firstTask := repository.tasksByStage[1]
	progress := repository.userTasks[firstTask.ID]
	if progress.Status != model.TaskStatusRewarded || progress.Progress != 5 || progress.RewardedAt == nil {
		t.Fatalf("task progress = %+v", progress)
	}
	if repository.pet.GrowthXP != 30 || repository.pet.Level != 1 || repository.pet.Mood != model.PetMoodProud {
		t.Fatalf("pet = %+v", repository.pet)
	}
	if repository.story.CurrentStage != 1 || repository.story.Status != model.StoryStatusActive {
		t.Fatalf("story = %+v", repository.story)
	}
	if _, ok := repository.roomItems["DESK"]; !ok {
		t.Fatal("DESK was not unlocked")
	}
	if repository.weekly.Score != 100 || repository.weekly.EarnedXP != 30 {
		t.Fatalf("weekly progress = %+v", repository.weekly)
	}
	if repository.daily.ActionsCount != 5 || repository.daily.CompletedTasks != 1 {
		t.Fatalf("daily progress = %+v", repository.daily)
	}
	if publisher.insideTx || len(publisher.batches) != 5 {
		t.Fatalf("publisher insideTx = %v, batches = %d", publisher.insideTx, len(publisher.batches))
	}

	duplicate, err := service.ProcessAction(context.Background(), lastCommand)
	if err != nil || !duplicate.Duplicate {
		t.Fatalf("duplicate result = %+v, error = %v", duplicate, err)
	}
	if repository.pet.GrowthXP != 30 || repository.weekly.Score != 100 || repository.daily.ActionsCount != 5 {
		t.Fatal("duplicate action changed rewards or aggregates")
	}
	if len(publisher.batches) != 5 {
		t.Fatal("duplicate action was published")
	}
}

func gameStringPointer(value string) *string {
	return &value
}
