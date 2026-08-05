# Pet Core Integration Design

**Date:** 2026-08-05

## Goal

Integrate the completed Avitosha pet core into the team repository without duplicating PostgreSQL pooling, transaction management, application bootstrap, routing, authentication, logging, health checks, or graceful shutdown.

## Source of truth

The integration branch starts from repository `master` at commit `e11798d2`. The existing team infrastructure remains authoritative. The standalone implementation in `C:\avitosha\app\backend` is a behavior and test source, not a second application skeleton.

## Retained pet functionality

- one pet per authenticated user, created with the name `Авитоша`;
- daily UTC state with `SATIETY`, `MOOD`, and `CURIOSITY`, each starting at 50;
- `FOOD`, `TOY`, and `BOOK` inventory items with a +40 capped effect;
- states `CURIOUS`, `HUNGRY`, `BORED`, `CONTENT`, `HAPPY`, and `ECSTATIC`;
- daily XP rewards and five growth levels;
- transactional item consumption with row locking;
- previous-day summary and domain events;
- unit, handler, repository, migration, and integration tests.

## Shared infrastructure

The following team components must be reused unchanged wherever possible:

- `postgres.NewPool` for the single application `pgxpool.Pool`;
- `postgres.TxManager.WithinTx` for all pet transactions;
- `executorFromContext` so repository methods automatically use the active transaction;
- `app.New` and `App.Run` for dependency assembly, database ping, logging, signals, and graceful shutdown;
- `handler.NewRouter` and chi middleware for routing, recovery, request logging, CORS, and JWT authentication;
- the existing response/error conventions and OpenAPI document.

Standalone pet files that duplicate those responsibilities (`store.go`, `transaction.go`, standalone router/config/bootstrap, trusted `X-User-ID`, and `/healthz`) are not transferred.

## Domain and use-case boundaries

Pet models remain in `internal/model`. Pure rules remain in `internal/usecase` and have no HTTP or PostgreSQL dependencies.

Use cases depend on repository interfaces plus the existing `usecase.TxManager`. Every transactional callback receives a transaction-bound context and passes that context to all repository calls. This keeps transaction ownership in the common manager and SQL ownership in the pet repository.

## PostgreSQL repository

`PetRepository` is constructed from the shared `*pgxpool.Pool`, stored behind the existing `QueryExecutor`, and selects `executorFromContext(ctx, fallback)` for every query. `FOR UPDATE` protects the pet, daily state, and inventory item during care operations. Updates check affected row counts where a concurrent state change could matter.

The repository keeps the current race-safe `INSERT ... ON CONFLICT DO NOTHING` followed by a locked read for lazy creation of pets and daily states.

## Schema and migrations

The pet schema is introduced using the repository's `golang-migrate` convention:

- `000003_create_pet_core.up.sql`;
- `000003_create_pet_core.down.sql`.

The migration creates `pets`, `pet_daily_states`, and `inventory_items`. The earlier standalone `starting_growth_xp` alteration is folded into the initial table definition because the team schema has not shipped a pet table yet. `pets.user_id` and `inventory_items.user_id` reference `users(id)` with `ON DELETE CASCADE`. Constraints retain the domain ranges, allowed enums, uniqueness, idempotency, and timestamp invariants.

## HTTP and authentication

Pet routes are mounted in the existing chi router and protected by `BearerAuth`. Handlers obtain `model.AuthenticatedUser` from the request context and use its `UserID`. The temporary trusted `X-User-ID` path is removed.

Routes follow the repository's current unversioned API convention:

- `GET /api/pet`;
- `POST /api/pet/items/{item_id}/use`;
- `GET /api/pet/daily-summary`.

The handlers reuse the common JSON error writer and expose pet-specific stable error codes. The shared OpenAPI contract documents bearer security, schemas, success responses, and expected errors.

## Application assembly

`app.New` creates one `PetRepository`, reuses the one `TxManager`, creates the three pet services, and passes them into `handler.RouterDependencies`. No extra pool, server, logger, signal handler, or shutdown flow is introduced.

## Testing

Implementation follows test-first integration:

1. pure rule and service tests establish domain behavior;
2. repository tests establish SQL and transaction-context behavior;
3. migration tests establish schema content and reversible filenames;
4. handler/router tests establish JWT protection and HTTP contracts;
5. application tests establish dependency wiring;
6. the complete suite, lint, and a real PostgreSQL migration/smoke flow verify integration.

## Non-goals

- no push or pull request in this phase;
- no new Docker or compose implementation;
- no reward-source service that grants inventory items from external actions;
- no frontend changes;
- no unrelated refactoring of the auth module.

