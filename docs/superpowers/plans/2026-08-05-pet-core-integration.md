# Pet Core Integration Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents are allowed) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add the complete Avitosha pet backend to the team repository while reusing its shared PostgreSQL, transaction, authentication, HTTP, logging, and lifecycle infrastructure.

**Architecture:** Pure pet rules and services live in `internal/usecase`; one PostgreSQL repository uses `executorFromContext` and the shared `TxManager`; JWT-protected chi handlers are mounted in the common router. One split migration adds the complete pet schema and links it to existing users.

**Tech Stack:** Go 1.25+, chi, pgx/v5/pgxpool, PostgreSQL, golang-migrate SQL files, kin-openapi, slog.

---

## Chunk 1: Domain and persistence

### Task 1: Pet domain models and rules

**Files:**
- Create: `app/backend/internal/model/pet.go`
- Create: `app/backend/internal/model/pet_daily_state.go`
- Create: `app/backend/internal/model/inventory_item.go`
- Create: `app/backend/internal/model/pet_event.go`
- Create: `app/backend/internal/model/pet_daily_summary.go`
- Create: `app/backend/internal/usecase/pet_rules.go`
- Test: `app/backend/internal/usecase/pet_rules_test.go`

- [ ] Copy the behavior-focused rule tests into the integration branch and update module imports.
- [ ] Run `go test ./internal/usecase -run 'Test(NewPetDailyState|DeterminePetState|CalculateLevel|ApplyCareItem)'` and verify it fails because pet types/rules are absent.
- [ ] Implement the domain models and pure rules required by the tests.
- [ ] Run the focused tests and verify they pass.
- [ ] Run `go test ./internal/usecase` to check auth regressions.

### Task 2: Pet lifecycle, care, and summary services

**Files:**
- Create: `app/backend/internal/usecase/pet_errors.go`
- Create: `app/backend/internal/usecase/pet_contracts.go`
- Create: `app/backend/internal/usecase/pet_lifecycle.go`
- Create: `app/backend/internal/usecase/pet_care.go`
- Create: `app/backend/internal/usecase/pet_daily_summary.go`
- Test: corresponding `*_test.go` files.

- [ ] Add service tests using fake repository interfaces and the existing `TxManager` contract.
- [ ] Run the focused tests and verify failures are caused by missing services.
- [ ] Implement services that pass the transaction callback context to every repository operation.
- [ ] Run service tests and the complete usecase package.
- [ ] Refactor duplicate test fixtures while keeping the suite green.

### Task 3: Team-style pet migrations

**Files:**
- Create: `app/backend/migrations/000003_create_pet_core.up.sql`
- Create: `app/backend/migrations/000003_create_pet_core.down.sql`
- Create: `app/backend/migrations/pet_core_migration_test.go`

- [ ] Write a migration test for tables, user foreign keys, uniqueness, constraints, `starting_growth_xp`, and reverse drop order.
- [ ] Run the migration test and verify it fails because migration files are absent.
- [ ] Add the split up/down migration with the complete schema.
- [ ] Run migration tests and `go test ./...`.

### Task 4: PostgreSQL pet repository on the shared executor

**Files:**
- Create: `app/backend/internal/repository/postgres/pet.go`
- Create: `app/backend/internal/repository/postgres/pet_daily_state.go`
- Create: `app/backend/internal/repository/postgres/inventory_item.go`
- Create: `app/backend/internal/repository/postgres/pet_daily_summary.go`
- Test: corresponding `*_test.go` files and an integration test.

- [ ] Add repository tests that expect queries through `QueryExecutor`, locked reads, race-safe inserts, checked item consumption, and shared error mapping.
- [ ] Run the focused repository tests and verify they fail because `PetRepository` is absent.
- [ ] Implement `PetRepository` using `executorFromContext` for every SQL operation.
- [ ] Run repository tests and refactor scan/error helpers.
- [ ] Add a real-PostgreSQL integration test for lazy creation and single-use item consumption.

## Chunk 2: HTTP and application integration

### Task 5: JWT-backed pet HTTP handlers

**Files:**
- Create: `app/backend/internal/handler/pet.go`
- Create: `app/backend/internal/handler/pet_dto.go`
- Create: `app/backend/internal/handler/pet_summary.go`
- Create: `app/backend/internal/handler/pet_summary_dto.go`
- Modify: `app/backend/internal/handler/router.go`
- Test: pet handler tests and `router_test.go`.

- [ ] Write handler tests that place an authenticated user in context and verify success/error DTOs.
- [ ] Write router tests proving all pet endpoints reject missing bearer authentication.
- [ ] Run focused handler tests and verify expected failures.
- [ ] Implement handlers using `auth.AuthenticatedUserFromContext` and common response helpers.
- [ ] Add pet dependencies to `RouterDependencies` and mount the three protected chi routes.
- [ ] Run all handler tests.

### Task 6: Application dependency assembly

**Files:**
- Modify: `app/backend/internal/app/app.go`
- Modify: `app/backend/internal/app/app_test.go`

- [ ] Extend app tests to prove pet dependencies are provided to the router without creating another pool or transaction manager.
- [ ] Run app tests and verify the wiring expectation fails.
- [ ] Construct one pet repository and shared transaction manager in `app.New`, then create and inject pet services.
- [ ] Run app and full backend tests.

### Task 7: OpenAPI contract

**Files:**
- Modify: `app/backend/api/openapi.yaml`
- Modify: `app/backend/api/openapi_test.go`

- [ ] Add contract tests for the three pet paths, bearer security, and core schemas.
- [ ] Run `go test ./api` and verify missing-path failures.
- [ ] Extend the OpenAPI document with pet operations, DTO schemas, and errors.
- [ ] Run API and full backend tests.

## Chunk 3: Verification and handoff

### Task 8: Integrated verification

**Files:**
- Modify only files required by failures found through test-first fixes.

- [ ] Run `gofmt` and `goimports` on changed Go files.
- [ ] Run `go test ./...`.
- [ ] Run `go vet ./...` and `go mod verify`.
- [ ] Run the configured `golangci-lint` suite.
- [ ] Apply all migrations to a clean PostgreSQL database.
- [ ] Register/login a user, call `GET /api/pet`, seed inventory items, consume all three, and read the summary flow.
- [ ] Inspect `git diff`, confirm no duplicated pool/transaction/server/auth implementation, and confirm no Docker changes.
- [ ] Keep all work local and report the branch and verification results; do not push.
