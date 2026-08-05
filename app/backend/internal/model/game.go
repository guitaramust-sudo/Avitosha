package model

import (
	"encoding/json"
	"time"

	"github.com/google/uuid"
)

type ActionType string

const (
	ActionTypeAdViewed       ActionType = "AD_VIEWED"
	ActionTypeAdFavorited    ActionType = "AD_FAVORITED"
	ActionTypeMessageSent    ActionType = "MESSAGE_SENT"
	ActionTypeAdCreated      ActionType = "AD_CREATED"
	ActionTypeDeliveryUsed   ActionType = "DELIVERY_USED"
	ActionTypeReviewLeft     ActionType = "REVIEW_LEFT"
	ActionTypeBookingCreated ActionType = "BOOKING_CREATED"
)

type TaskStatus string

const (
	TaskStatusActive    TaskStatus = "ACTIVE"
	TaskStatusCompleted TaskStatus = "COMPLETED"
	TaskStatusRewarded  TaskStatus = "REWARDED"
	TaskStatusExpired   TaskStatus = "EXPIRED"
)

type RoomItemStatus string

const (
	RoomItemStatusLocked   RoomItemStatus = "LOCKED"
	RoomItemStatusUnlocked RoomItemStatus = "UNLOCKED"
	RoomItemStatusPlaced   RoomItemStatus = "PLACED"
)

type StoryStatus string

const (
	StoryStatusActive    StoryStatus = "ACTIVE"
	StoryStatusCompleted StoryStatus = "COMPLETED"
)

type Task struct {
	ID                uuid.UUID
	Code              string
	Title             string
	Description       string
	PetPhrase         string
	ActionType        ActionType
	Category          *string
	TargetValue       int
	XPReward          int
	AvitoRewardType   *string
	AvitoRewardAmount int
	RoomItemCode      *string
	StoryCode         *string
	StoryStage        *int
	IsActive          bool
	CreatedAt         time.Time
	UpdatedAt         time.Time
}

type UserTask struct {
	ID          uuid.UUID
	UserID      uuid.UUID
	TaskID      uuid.UUID
	Progress    int
	TargetValue int
	Status      TaskStatus
	AssignedAt  time.Time
	CompletedAt *time.Time
	RewardedAt  *time.Time
	CreatedAt   time.Time
	UpdatedAt   time.Time
}

type TaskProgress struct {
	Task     Task
	Progress UserTask
}

type UserAction struct {
	ID           uuid.UUID
	UserID       uuid.UUID
	EventID      uuid.UUID
	ActionType   ActionType
	EntityID     *string
	Category     *string
	Metadata     json.RawMessage
	OccurredAt   time.Time
	ProcessedAt  *time.Time
	ResultEvents json.RawMessage
	CreatedAt    time.Time
}

type RoomItem struct {
	Code        string
	Name        string
	Description string
	AssetKey    string
	PositionKey string
	UnlockLevel int
	SortOrder   int
	CreatedAt   time.Time
	UpdatedAt   time.Time
}

type UserRoomItem struct {
	ID           uuid.UUID
	UserID       uuid.UUID
	ItemCode     string
	Status       RoomItemStatus
	SourceTaskID *uuid.UUID
	UnlockedAt   time.Time
	PlacedAt     *time.Time
	CreatedAt    time.Time
	UpdatedAt    time.Time
}

type Story struct {
	Code        string
	Title       string
	Description string
	TotalStages int
	IsActive    bool
	CreatedAt   time.Time
	UpdatedAt   time.Time
}

type UserStoryProgress struct {
	ID           uuid.UUID
	UserID       uuid.UUID
	StoryCode    string
	CurrentStage int
	Status       StoryStatus
	StartedAt    time.Time
	CompletedAt  *time.Time
	CreatedAt    time.Time
	UpdatedAt    time.Time
}

type WeeklyProgress struct {
	ID              uuid.UUID
	UserID          uuid.UUID
	WeekStart       time.Time
	EarnedXP        int
	CompletedTasks  int
	CompletedStages int
	Score           int
	CreatedAt       time.Time
	UpdatedAt       time.Time
}

type DailyProgress struct {
	Date              time.Time
	UserID            uuid.UUID
	ActionsCount      int
	CompletedTasks    int
	EarnedXP          int
	LevelBefore       int
	LevelAfter        int
	UnlockedRoomItems []string
	StoryStageBefore  int
	StoryStageAfter   int
	WeeklyScoreDelta  int
	PetMood           PetMood
}

type Achievement struct {
	Code        string
	Title       string
	Description string
	IconKey     string
	SortOrder   int
}

type UserAchievement struct {
	ID              uuid.UUID
	UserID          uuid.UUID
	AchievementCode string
	UnlockedAt      time.Time
}

type ActivityScores struct {
	UserID          uuid.UUID
	BuyerScore      int
	SellerScore     int
	AutoScore       int
	TravelScore     int
	RealEstateScore int
	ServicesScore   int
	UpdatedAt       time.Time
}
