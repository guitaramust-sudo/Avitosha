package api

import (
	"context"
	"testing"

	"github.com/getkin/kin-openapi/openapi3"
)

func TestOpenAPIYAMLIsValid(t *testing.T) {
	t.Parallel()

	loader := openapi3.NewLoader()
	doc, err := loader.LoadFromData(OpenAPIYAML())
	if err != nil {
		t.Fatalf("LoadFromData() error = %v", err)
	}

	if err := doc.Validate(context.Background()); err != nil {
		t.Fatalf("Validate() error = %v", err)
	}
}

func TestRefreshUnauthorizedContract(t *testing.T) {
	t.Parallel()

	loader := openapi3.NewLoader()
	doc, err := loader.LoadFromData(OpenAPIYAML())
	if err != nil {
		t.Fatalf("LoadFromData() error = %v", err)
	}

	refreshPath := doc.Paths.Find("/api/auth/refresh")
	if refreshPath == nil || refreshPath.Post == nil {
		t.Fatal("refresh operation is missing")
	}

	responseRef := refreshPath.Post.Responses.Status(httpStatusUnauthorized)
	if responseRef == nil || responseRef.Value == nil {
		t.Fatal("refresh 401 response is missing")
	}

	content := responseRef.Value.Content.Get("application/json")
	if content == nil {
		t.Fatal("refresh 401 response content is missing")
	}

	missingCookie, ok := content.Examples["missing_refresh_cookie"]
	if !ok || missingCookie.Value == nil {
		t.Fatal("refresh 401 missing_refresh_cookie example is missing")
	}
	expiredSession, ok := content.Examples["expired_session"]
	if !ok || expiredSession.Value == nil {
		t.Fatal("refresh 401 expired_session example is missing")
	}
}

func TestPetAPIContract(t *testing.T) {
	t.Parallel()

	loader := openapi3.NewLoader()
	doc, err := loader.LoadFromData(OpenAPIYAML())
	if err != nil {
		t.Fatalf("LoadFromData() error = %v", err)
	}

	tests := []struct {
		path   string
		method string
	}{
		{path: "/api/pet", method: "GET"},
		{path: "/api/pet/items/{item_id}/use", method: "POST"},
		{path: "/api/pet/daily-summary", method: "GET"},
	}
	for _, tt := range tests {
		path := doc.Paths.Find(tt.path)
		if path == nil {
			t.Errorf("pet path %s is missing", tt.path)
			continue
		}
		operation := path.GetOperation(tt.method)
		if operation == nil {
			t.Errorf("%s %s operation is missing", tt.method, tt.path)
			continue
		}
		if operation.Security == nil || len(*operation.Security) == 0 {
			t.Errorf("%s %s must require bearer authentication", tt.method, tt.path)
		}
	}

	for _, schema := range []string{"PetSnapshotResponse", "PetCareResponse", "PetDailySummaryResponse"} {
		if _, ok := doc.Components.Schemas[schema]; !ok {
			t.Errorf("schema %s is missing", schema)
		}
	}
}

const httpStatusUnauthorized = 401
