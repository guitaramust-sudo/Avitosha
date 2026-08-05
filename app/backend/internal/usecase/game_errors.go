package usecase

import "errors"

var (
	ErrTaskNotFound             = errors.New("task not found")
	ErrStoryNotFound            = errors.New("story not found")
	ErrActionNotFound           = errors.New("action not found")
	ErrDailyProgressNotFound    = errors.New("daily progress not found")
	ErrLeaderboardEntryNotFound = errors.New("leaderboard entry not found")
	ErrEventIDConflict          = errors.New("event ID belongs to another action")
	ErrInvalidAction            = errors.New("invalid action")
	ErrOutOfOrderStoryStage     = errors.New("story stage is out of order")
)
