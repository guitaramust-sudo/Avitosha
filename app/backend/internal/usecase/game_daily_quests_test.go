package usecase

import (
	"testing"
	"time"

	"github.com/google/uuid"

	"github.com/guitaramust-sudo/Avitosha/app/backend/internal/model"
)

func TestSelectDailyQuestSetUsesTwoBuyerTwoSellerAndOneUniversal(t *testing.T) {
	templates := []model.DailyQuestTemplate{
		{Code: "BUY_VIEW", Role: model.DailyQuestRoleBuyer, ActionType: model.ActionTypeAdViewed, SortOrder: 1},
		{Code: "BUY_FAVORITE", Role: model.DailyQuestRoleBuyer, ActionType: model.ActionTypeAdFavorited, SortOrder: 2},
		{Code: "BUY_CONTACT", Role: model.DailyQuestRoleBuyer, ActionType: model.ActionTypeMessageSent, SortOrder: 3},
		{Code: "SELL_CREATE", Role: model.DailyQuestRoleSeller, ActionType: model.ActionTypeAdCreated, SortOrder: 4},
		{Code: "SELL_IMPROVE", Role: model.DailyQuestRoleSeller, ActionType: model.ActionTypeListingImproved, SortOrder: 5},
		{Code: "SELL_SOLD", Role: model.DailyQuestRoleSeller, ActionType: model.ActionTypeListingSold, SortOrder: 6},
		{Code: "ANY_DELIVERY", Role: model.DailyQuestRoleUniversal, ActionType: model.ActionTypeDeliveryUsed, SortOrder: 7},
		{Code: "ANY_REVIEW", Role: model.DailyQuestRoleUniversal, ActionType: model.ActionTypeReviewLeft, SortOrder: 8},
	}
	set, err := selectDailyQuestSet(uuid.MustParse("00000000-0000-0000-0000-000000000001"), time.Date(2026, 8, 12, 0, 0, 0, 0, time.UTC), templates)
	if err != nil {
		t.Fatalf("select set: %v", err)
	}
	counts := map[model.DailyQuestRole]int{}
	actions := map[model.ActionType]bool{}
	for _, quest := range set {
		counts[quest.Role]++
		if actions[quest.ActionType] {
			t.Fatalf("duplicate action type %s in set", quest.ActionType)
		}
		actions[quest.ActionType] = true
	}
	if len(set) != 5 || counts[model.DailyQuestRoleBuyer] != 2 || counts[model.DailyQuestRoleSeller] != 2 || counts[model.DailyQuestRoleUniversal] != 1 {
		t.Fatalf("set = %+v, counts = %+v", set, counts)
	}
}

func TestRetentionDateChangesAtMoscowMidnight(t *testing.T) {
	before := retentionDate(time.Date(2026, 8, 11, 20, 59, 59, 0, time.UTC))
	after := retentionDate(time.Date(2026, 8, 11, 21, 0, 0, 0, time.UTC))
	if before.Format(time.DateOnly) != "2026-08-11" || after.Format(time.DateOnly) != "2026-08-12" {
		t.Fatalf("before=%s after=%s", before.Format(time.DateOnly), after.Format(time.DateOnly))
	}
}

func TestAdvanceStreakEarnsAndConsumesOneDayProtection(t *testing.T) {
	lastActive := time.Date(2026, 8, 10, 0, 0, 0, 0, time.UTC)
	streak := model.UserStreak{CurrentStreak: 6, LongestStreak: 6, LastActiveDate: &lastActive}
	changed, reset, _, used, earned := advanceStreak(&streak, lastActive.AddDate(0, 0, 1), lastActive.AddDate(0, 0, 1))
	if !changed || reset || used || !earned || streak.CurrentStreak != 7 || streak.ProtectionCount != 1 {
		t.Fatalf("earned protection streak = %+v", streak)
	}
	changed, reset, _, used, earned = advanceStreak(&streak, lastActive.AddDate(0, 0, 3), lastActive.AddDate(0, 0, 3))
	if !changed || reset || !used || earned || streak.CurrentStreak != 8 || streak.ProtectionCount != 0 {
		t.Fatalf("consumed protection streak = %+v", streak)
	}
}
