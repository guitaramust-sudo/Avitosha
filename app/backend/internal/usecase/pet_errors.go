package usecase

import "errors"

var (
	ErrInvalidItemType           = errors.New("invalid item type")
	ErrInvalidNeedValue          = errors.New("invalid need value")
	ErrInvalidGrowthXP           = errors.New("invalid growth XP")
	ErrInconsistentPetDailyState = errors.New("inconsistent pet daily state")
	ErrPetNotFound               = errors.New("pet not found")
	ErrPetDailyStateNotFound     = errors.New("pet daily state not found")
	ErrInventoryItemNotFound     = errors.New("inventory item not found")
	ErrInventoryItemUnavailable  = errors.New("inventory item unavailable")
)
