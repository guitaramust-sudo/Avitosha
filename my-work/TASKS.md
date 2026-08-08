# Мои задачи и код

## Выполнено

- Спроектировал доменную модель «Авитоши v2»: питомец, задания, действия, комната, история, XP, настроение, характер, достижения и рейтинг.
- Реализовал PostgreSQL-схему, миграции, репозитории и атомарную обработку игрового прогресса в одной транзакции.
- Добавил идемпотентность действий по `eventId`, защиту от гонок и тесты конкурентной обработки.
- Реализовал REST API `/api/v1`, OpenAPI, единые ошибки, health/readiness и полный smoke-сценарий.
- Добавил WebSocket-события после commit и подключил frontend dashboard к игровому API и realtime-обновлениям.
- Реализовал daily summary, weekly leaderboard, характер питомца, безопасное переименование, reward balance и начисление наград.
- Добавил советы питомца через ProxyAPI с безопасным локальным fallback без передачи приватных данных.
- Выполнил профилирование сериализации событий: ускорение примерно на 30%, снижение памяти на 47,9% и аллокаций на 83,8%.
- Настроил локальный запуск, Docker Compose, seed/migrations и воспроизводимые backend/frontend-проверки.
- Разделил backend на `api-gateway`, `auth-service` и `game-service`; реализовал protobuf/gRPC-контракты, health checks, deadlines, отображение ошибок и server-streaming событий в WebSocket.
- Убрал распределённый dual write при регистрации: игровой профиль создаётся лениво и идемпотентно первым игровым запросом.
- Проверил микросервисный стек в Docker: сборка образов, миграции, readiness, полный HTTP/gRPC smoke и realtime WebSocket → gRPC stream.

## Основной написанный код

- `app/backend/internal/model`, `usecase`, `repository/postgres` — домен, бизнес-правила и хранение.
- `app/backend/internal/handler`, `realtime` — REST/OpenAPI/WebSocket transport.
- `app/backend/internal/ai` — интеграция ProxyAPI и fallback.
- `app/backend/api/proto`, `internal/transport/grpc`, `internal/client/grpc`, `internal/rpc` — внутренний gRPC API.
- `app/backend/cmd/api`, `cmd/auth`, `cmd/game`, `internal/app/microservices.go` — три запускаемых сервиса и их wiring.
- `app/frontend/src/api`, `hooks`, `store` — подключение frontend к game API и realtime-синхронизация.
- `compose.yaml`, backend Dockerfile, миграции, smoke-скрипты и архитектурная документация — локальная инфраструктура и проверка.
