package handler

import (
	"encoding/json"
	"fmt"
	"time"

	"github.com/google/uuid"

	"github.com/guitaramust-sudo/Avitosha/app/backend/internal/model"
	"github.com/guitaramust-sudo/Avitosha/app/backend/internal/usecase"
)

type gamePetDTO struct {
	ID                uuid.UUID           `json:"id"`
	Name              string              `json:"name"`
	Level             int                 `json:"level"`
	GrowthXP          int                 `json:"growthXp"`
	NextLevelXP       *int                `json:"nextLevelXp"`
	Mood              model.PetMood       `json:"mood"`
	Character         *model.PetCharacter `json:"character"`
	CharacterProgress int                 `json:"characterProgress"`
	CharacterTarget   int                 `json:"characterTarget"`
	CurrentStory      currentStoryDTO     `json:"currentStory"`
}

type currentStoryDTO struct {
	Code         string `json:"code"`
	Title        string `json:"title"`
	CurrentStage int    `json:"currentStage"`
	TotalStages  int    `json:"totalStages"`
	Status       string `json:"status"`
}

func newGamePetDTO(profile usecase.GameProfile) gamePetDTO {
	return gamePetDTO{
		ID: profile.Pet.ID, Name: profile.Pet.Name, Level: profile.Pet.Level,
		GrowthXP: profile.Pet.GrowthXP, NextLevelXP: profile.NextLevelXP,
		Mood: profile.Pet.Mood, Character: profile.Pet.Character,
		CharacterProgress: profile.CharacterProgress, CharacterTarget: usecase.CharacterUnlockTarget,
		CurrentStory: currentStoryDTO{
			Code: profile.Story.Story.Code, Title: profile.Story.Story.Title,
			CurrentStage: profile.Story.Progress.CurrentStage,
			TotalStages:  profile.Story.Story.TotalStages, Status: string(profile.Story.Progress.Status),
		},
	}
}

type taskListDTO struct {
	Tasks []taskDTO `json:"tasks"`
}

type taskDTO struct {
	ID                uuid.UUID        `json:"id"`
	Code              string           `json:"code"`
	Title             string           `json:"title"`
	Description       string           `json:"description"`
	PetPhrase         string           `json:"petPhrase"`
	ActionType        model.ActionType `json:"actionType"`
	Category          *string          `json:"category"`
	Progress          int              `json:"progress"`
	Target            int              `json:"target"`
	Status            model.TaskStatus `json:"status"`
	XPReward          int              `json:"xpReward"`
	RoomItemCode      *string          `json:"roomItemCode"`
	AvitoRewardType   *string          `json:"avitoRewardType"`
	AvitoRewardAmount int              `json:"avitoRewardAmount"`
	StoryStage        *int             `json:"storyStage"`
}

func newTaskDTOs(tasks []model.TaskProgress) []taskDTO {
	result := make([]taskDTO, len(tasks))
	for index, task := range tasks {
		result[index] = newTaskDTO(task)
	}
	return result
}

func newTaskDTO(task model.TaskProgress) taskDTO {
	return taskDTO{
		ID: task.Task.ID, Code: task.Task.Code, Title: task.Task.Title,
		Description: task.Task.Description, PetPhrase: task.Task.PetPhrase,
		ActionType: task.Task.ActionType, Category: task.Task.Category,
		Progress: task.Progress.Progress, Target: task.Progress.TargetValue,
		Status: task.Progress.Status, XPReward: task.Task.XPReward,
		RoomItemCode: task.Task.RoomItemCode, AvitoRewardType: task.Task.AvitoRewardType,
		AvitoRewardAmount: task.Task.AvitoRewardAmount, StoryStage: task.Task.StoryStage,
	}
}

type actionResultDTO struct {
	ActionID  uuid.UUID        `json:"actionId"`
	Duplicate bool             `json:"duplicate"`
	Events    []map[string]any `json:"events"`
}

func newActionResultDTO(result usecase.ProcessActionResult) actionResultDTO {
	events := make([]map[string]any, len(result.Events))
	for index, event := range result.Events {
		events[index] = newDomainEventDTO(event)
	}
	return actionResultDTO{ActionID: result.ActionID, Duplicate: result.Duplicate, Events: events}
}

func newDomainEventDTO(event model.DomainEvent) map[string]any {
	payload := make(map[string]any)
	_ = json.Unmarshal(event.Payload, &payload)
	payload["id"] = event.ID
	payload["type"] = event.Type
	payload["occurredAt"] = event.OccurredAt.UTC().Format(time.RFC3339Nano)
	return payload
}

type roomDTO struct {
	StoryCode string        `json:"storyCode"`
	Progress  string        `json:"progress"`
	Items     []roomItemDTO `json:"items"`
}

type roomItemDTO struct {
	Code           string               `json:"code"`
	Name           string               `json:"name"`
	Description    string               `json:"description"`
	Status         model.RoomItemStatus `json:"status"`
	AssetKey       string               `json:"assetKey"`
	PositionKey    string               `json:"positionKey"`
	UnlockTaskCode *string              `json:"unlockTaskCode"`
}

func newRoomDTO(items []model.RoomItemProgress) roomDTO {
	dtos := make([]roomItemDTO, len(items))
	placed := 0
	for index, item := range items {
		dtos[index] = roomItemDTO{
			Code: item.Item.Code, Name: item.Item.Name, Description: item.Item.Description,
			Status: item.Status, AssetKey: item.Item.AssetKey, PositionKey: item.Item.PositionKey,
			UnlockTaskCode: item.SourceTaskCode,
		}
		if item.Status == model.RoomItemStatusPlaced {
			placed++
		}
	}
	return roomDTO{
		StoryCode: usecase.FirstRoomStoryCode,
		Progress:  fmtProgress(placed, len(items)), Items: dtos,
	}
}

func fmtProgress(current, total int) string {
	return fmt.Sprintf("%d/%d", current, total)
}

type storyDTO struct {
	Code         string            `json:"code"`
	Title        string            `json:"title"`
	Description  string            `json:"description"`
	CurrentStage int               `json:"currentStage"`
	TotalStages  int               `json:"totalStages"`
	Status       model.StoryStatus `json:"status"`
	NextTask     *taskPreviewDTO   `json:"nextTask"`
}

type taskPreviewDTO struct {
	ID           uuid.UUID `json:"id"`
	Code         string    `json:"code"`
	Title        string    `json:"title"`
	RoomItemCode *string   `json:"roomItemCode"`
}

func newStoryDTO(snapshot model.StorySnapshot) storyDTO {
	result := storyDTO{
		Code: snapshot.Story.Code, Title: snapshot.Story.Title,
		Description: snapshot.Story.Description, CurrentStage: snapshot.Progress.CurrentStage,
		TotalStages: snapshot.Story.TotalStages, Status: snapshot.Progress.Status,
	}
	if snapshot.NextTask != nil {
		result.NextTask = &taskPreviewDTO{
			ID: snapshot.NextTask.ID, Code: snapshot.NextTask.Code,
			Title: snapshot.NextTask.Title, RoomItemCode: snapshot.NextTask.RoomItemCode,
		}
	}
	return result
}
