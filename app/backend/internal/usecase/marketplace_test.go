package usecase

import (
	"strings"
	"testing"

	"github.com/guitaramust-sudo/Avitosha/app/backend/internal/model"
)

func TestEvaluateListingQuality(t *testing.T) {
	tests := []struct {
		name     string
		listing  model.Listing
		score    int
		eligible bool
		missing  []string
	}{
		{name: "empty", listing: model.Listing{}, missing: []string{"price", "photo", "description"}},
		{name: "complete", listing: model.Listing{PriceKopecks: 100, Description: strings.Repeat("a", 150), Photos: []model.ListingPhoto{{URL: "https://example.test/photo.jpg"}}}, score: 3, eligible: true},
		{name: "short description is a recommendation", listing: model.Listing{PriceKopecks: 100, Description: "short", Photos: []model.ListingPhoto{{URL: "https://example.test/photo.jpg"}}}, score: 2, eligible: true, missing: []string{"description"}},
		{name: "photo and description are optional", listing: model.Listing{PriceKopecks: 100}, score: 1, eligible: true, missing: []string{"photo", "description"}},
	}
	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			quality := EvaluateListingQuality(tt.listing)
			if quality.Score != tt.score || quality.IsEligible != tt.eligible || len(quality.MissingFields) != len(tt.missing) {
				t.Fatalf("quality = %+v", quality)
			}
		})
	}
}

func TestValidateListingInput(t *testing.T) {
	if err := validateListingInput("FURNITURE", "Lamp", "", 0, nil); err != nil {
		t.Fatalf("draft without description or photo: %v", err)
	}
	if err := validateListingInput("FURNITURE", "Lamp", "", 1, []string{"https://example.test/photo.jpg"}); err != nil {
		t.Fatalf("valid input: %v", err)
	}
	if err := validateListingInput("FURNITURE", "Lamp", "", 1, []string{"/storage/avitosha-photos/listing-photos/user/photo.jpg"}); err != nil {
		t.Fatalf("valid MinIO photo URL: %v", err)
	}
	if err := validateListingInput("FURNITURE", "Lamp", "", 1, []string{"not-a-url"}); err == nil {
		t.Fatal("invalid photo URL was accepted")
	}
	if err := validateListingInput("FURNITURE", "Lamp", "", 1, []string{"/api/v1/me"}); err == nil {
		t.Fatal("non-storage relative URL was accepted")
	}
}
