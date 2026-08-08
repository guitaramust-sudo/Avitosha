# Авитоша

Авитоша — MVP эмоционального и визуального слоя поверх полезных действий пользователя на Авито. Проект не создаёт вторую валюту, магазин или систему наказаний: реальные действия продвигают задания, развивают виртуального питомца и постепенно обустраивают его комнату. Стартовый игровой профиль создаётся сразу во время регистрации пользователя.

## Основной цикл

```text
Действие на Авито → прогресс задания → XP и настроение → предмет комнаты
→ этап истории → WebSocket-реакция → недельный лидерборд
```

Первая история называется `FIRST_ROOM`. Пользователь последовательно:

1. смотрит пять объявлений с мебелью и получает стол;
2. добавляет объявление в избранное и получает лампу;
3. пишет продавцу и получает кресло;
4. создаёт объявление и получает растение;
5. использует Авито Доставку и получает постер.

Коробка размещается при первом знакомстве. После пяти этапов комната завершена.

## Архитектура

```text
React dashboard
  ├── HTTP /api, /api/v1
  └── WebSocket /api/v1/ws
              ↓
         API Gateway
          ├── gRPC unary ──────→ Auth Service ──→ users/sessions
          ├── gRPC unary ──────→ Game Service ──→ game/retention
          └── gRPC server stream ← Game Service event hub
                                      ↓
                                  PostgreSQL
```

- `api-gateway` — единственная публичная точка входа; он сохраняет REST/OpenAPI и WebSocket-контракты, но не обращается к PostgreSQL;
- `auth-service` владеет регистрацией, сессиями и проверкой access token;
- `game-service` владеет игровым циклом, XP, комнатой, наградами, retention и генерацией советов;
- `api/proto/avitosha/v1/services.proto` — versioned internal contract; сгенерированный Go-код хранится в репозитории;
- `realtime.Hub` находится в game-service и публикует события после commit, а gateway получает их отдельным server-streaming RPC на WebSocket-клиента;
- React Query хранит серверное состояние, а WebSocket инвалидирует game-query cache.

Сервисы используют unary gRPC для команд и запросов, стандартный gRPC Health Checking Protocol для readiness и server streaming для realtime. Deadline HTTP-запроса автоматически передаётся downstream через `context.Context`. Подробные границы, модель отказов и план дальнейшей изоляции данных описаны в [`docs/avitosha-v2-audit.md`](docs/avitosha-v2-audit.md).

После изменения protobuf сгенерируйте stubs и проверьте контракт:

```bash
cd app/backend
buf lint
buf generate
```

`POST /api/v1/actions` атомарно сохраняет действие, блокирует подходящие `user_tasks`, обновляет все награды и сохраняет доменные события. `eventId` уникален: повтор того же запроса возвращает сохранённый результат без повторной награды.

## Модель данных

Auth-инфраструктура использует `users` и `sessions`. Игровой слой использует:

- `pets` — один Авитоша на пользователя, XP, уровень, настроение и характер;
- `tasks`, `user_tasks` — шаблоны и последовательный пользовательский прогресс;
- `user_actions` — идемпотентные mock-события Авито и сохранённый результат;
- `room_items`, `user_room_items` — справочник и размещённые предметы;
- `stories`, `user_story_progress` — долгосрочная цель и текущий этап;
- `weekly_progress`, `daily_progress` — рейтинг и дневная сводка;
- `user_reward_balances`, `reward_transactions` — reward wallet, lifetime earned и auditable ledger для наград из задач, streak и daily quest;
- `reward_catalog_items` — каталог конкретных Avito-perks и их порогов;
- `user_streaks`, `daily_quest_templates`, `user_daily_quests` — retention-слой для streak, одной daily quest на день и tomorrow preview;
- `achievements`, `user_achievements` — достижения без отдельной валюты;
- `pet_activity_scores` — buyer/seller/category-счётчики характера;
- `domain_events` — события, сформированные внутри транзакции.

Новая схема создаётся миграцией `000004_rebuild_avitosha_game`. Она удаляет старые `pet_daily_states`/`inventory_items`, создаёт актуальные таблицы и добавляет seed комнаты, пяти заданий, истории и достижений.

## XP, настроение и рейтинг

| Уровень | Общий XP |
|---:|---:|
| 1 | 0–99 |
| 2 | 100–249 |
| 3 | 250–449 |
| 4 | 450–699 |
| 5 | 700+ |

XP не сбрасывается. После пятого уровня он продолжает расти. Настроения только нейтральные и позитивные: `CALM`, `CURIOUS`, `HAPPY`, `EXCITED`, `PROUD`, `SLEEPING`.

Неделя начинается в понедельник:

```text
score = earned_xp + completed_tasks * 20 + completed_stages * 50
```

Рейтинг не зависит от потраченных денег или стоимости сделок.

## Характер

Каждое действие увеличивает buyer/seller или категорийный score. При пяти действиях открывается ведущий характер:

- `EXPLORER` — исследователь;
- `ENTREPRENEUR` — предприниматель;
- `MECHANIC` — механик;
- `TRAVELER` — путешественник;
- `ARCHITECT` — архитектор;
- `CRAFTSPERSON` — мастер.

API возвращает название, описание, icon key, progress и небольшую визуальную деталь. Отдельные модели питомца для каждого характера в MVP не создаются.

## HTTP API

Игровые endpoints принимают короткоживущий JWT:

```http
Authorization: Bearer <access_token>
```

Для mock-интеграции также поддерживается временная граница:

```http
X-User-ID: <existing-user-uuid>
```

| Метод | Endpoint | Назначение |
|---|---|---|
| GET | `/healthz` | liveness |
| GET | `/health/ready` | PostgreSQL readiness |
| GET | `/api/v1/pet` | питомец, XP, настроение, характер и текущая история |
| GET | `/api/v1/tasks` | назначенные задания и награды |
| GET | `/api/v1/tasks/{task_id}` | одно задание |
| GET | `/api/v1/tasks/{task_id}/advice` | короткий персональный совет Авитоши по заданию |
| POST | `/api/v1/actions` | mock-событие Авито |
| GET | `/api/v1/room` | открытые и заблокированные предметы |
| GET | `/api/v1/story` | прогресс `FIRST_ROOM` и следующая цель |
| GET | `/api/v1/daily-summary` | дневной агрегат + retention block (`streak`, `dailyQuest`, `tomorrow`) |
| GET | `/api/v1/leaderboard?period=weekly&limit=10` | недельный топ и позиция пользователя |
| GET | `/api/v1/achievements` | открытые и будущие достижения |
| GET | `/api/v1/rewards/balance` | raw reward balances и lifetime earned totals |
| GET | `/api/v1/rewards/wallet` | видимый reward wallet, каталог бонусов, ближайший unlock и progress до него |
| GET | `/api/v1/ws` | realtime-события |

Полный контракт доступен в `app/backend/api/openapi.yaml` и через `/swagger/`.

### Советы Авитоши через ProxyAPI

Backend отправляет в модель только имя и состояние питомца, характер, описание текущего задания, его прогресс и заранее известные награды. Email, тексты сообщений, access token и другие пользовательские данные в запрос не входят. ИИ формирует только текст совета и не участвует в расчёте прогресса, XP, бонусов или баланса.

Для включения генерации задайте `PROXYAPI_API_KEY`. По умолчанию используется OpenRouter endpoint ProxyAPI и модель `qwen/qwen-2.5-7b-instruct`; URL, модель и таймаут меняются через `PROXYAPI_BASE_URL`, `PROXYAPI_MODEL` и `PROXYAPI_TIMEOUT`. Если ключ не задан, провайдер недоступен или ответ не прошёл проверку, endpoint возвращает безопасный локальный совет с `generatedByAi: false`.

Краткая памятка для backend и frontend: [`docs/ai-advice.md`](docs/ai-advice.md).

### Пример действия

```bash
curl -X POST http://localhost:8080/api/v1/actions \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  -H 'Content-Type: application/json' \
  -d '{
    "eventId": "4a5bbd12-7235-4b47-a225-8dbc7d831ac3",
    "type": "AD_VIEWED",
    "entityId": "advert-123",
    "category": "FURNITURE",
    "occurredAt": "2026-08-05T12:00:00Z",
    "metadata": {"source": "demo"}
  }'
```

Поддерживаются `AD_VIEWED`, `AD_FAVORITED`, `MESSAGE_SENT`, `AD_CREATED`, `DELIVERY_USED`, `REVIEW_LEFT`, `BOOKING_CREATED`.

## WebSocket

Соединение открывается по `/api/v1/ws`. Для CLI можно передать `X-User-ID` или `Authorization`; browser-клиент передаёт короткоживущий access token в query-параметре `access_token`, потому что стандартный WebSocket API не позволяет задать Authorization header.

События:

- `TASK_PROGRESS_UPDATED`, `TASK_COMPLETED`;
- `XP_EARNED`, `PET_LEVEL_UP`, `PET_MOOD_CHANGED`;
- `AVITO_REWARD_EARNED`, `REWARD_CATALOG_UNLOCKED`;
- `DAILY_QUEST_UPDATED`, `DAILY_QUEST_COMPLETED`, `STREAK_UPDATED`;
- `ROOM_ITEM_UNLOCKED`;
- `STORY_STAGE_COMPLETED`, `STORY_COMPLETED`;
- `LEADERBOARD_SCORE_UPDATED`;
- `ACHIEVEMENT_UNLOCKED`, `PET_CHARACTER_UNLOCKED`.

Hub хранится в памяти процесса, имеет ограниченные клиентские буферы и отключает медленного клиента, не блокируя основной use case. В production его нужно заменить брокером/pub-sub и не передавать access token в URL.

## Локальный запуск через Docker Compose

Требуются Docker и Docker Compose.

```bash
docker compose up --build
```

Команда использует безопасные локальные значения по умолчанию. При необходимости их можно переопределить через `.env`, взяв `.env.example` за шаблон.

После запуска:

- frontend: <http://localhost:3000>;
- API gateway: <http://localhost:8080>;
- Swagger: <http://localhost:8080/swagger/>;
- PostgreSQL на host: `localhost:5433`.

Внутренние `auth-service:9091` и `game-service:9092` доступны только в Compose-сети. Миграции и seed применяет отдельный сервис `migrate` до старта доменных сервисов.

## Запуск без Compose

Backend без Compose (в трёх терминалах):

```bash
cd app/backend
set -a
. ../../.env
set +a
GRPC_ADDR=:9091 go run ./cmd/auth
GRPC_ADDR=:9092 go run ./cmd/game
AUTH_GRPC_ADDR=127.0.0.1:9091 GAME_GRPC_ADDR=127.0.0.1:9092 go run ./cmd/api
```

Frontend:

```bash
cd app/frontend
npm ci
VITE_API_PROXY_TARGET=http://127.0.0.1:8080 npm run dev
```

## Smoke-сценарий

После запуска стека установите `curl`, `jq`, `uuidgen` и выполните:

```bash
./app/backend/scripts/smoke-game.sh
```

Скрипт регистрирует нового пользователя, лениво создаёт стартовый профиль Авитоши первым игровым запросом, пять раз отправляет `AD_VIEWED`, затем проверяет задание, 30 XP, `DESK`, этап истории, дневную сводку, weekly score 100 и 12 бонусов: 10 за задание плюс 2 за первый день streak.

## Тестирование

Backend:

```bash
cd app/backend
go test ./...
go vet ./...
go mod verify
golangci-lint run
```

PostgreSQL integration-тесты выполняются при наличии безопасной тестовой БД:

```bash
TEST_DATABASE_URL=postgres://postgres:postgres@localhost:5433/avitosha_test?sslmode=disable go test ./internal/repository/postgres
```

Имя БД обязано содержать `test`. Тесты очищают её содержимое.

Frontend:

```bash
cd app/frontend
npm test
npm run lint
npm run format:check
npm run build
```

## Профилирование и производительность

Для backend добавлен benchmark горячего пути сериализации игровых событий и команды снятия CPU/memory profile. После удаления промежуточного преобразования `json.RawMessage → map[string]any` типичный ответ с восемью событиями сериализуется примерно на 30% быстрее, использует на 47,9% меньше памяти и создаёт на 83,8% меньше аллокаций. Формат HTTP и WebSocket сообщений сохранён.

Для frontend команда `npm run profile:bundle` строит production bundle, группирует ресурсы и показывает самые тяжёлые файлы. Удаление 11 неиспользуемых начертаний из production bundle снизило font payload на 78,7%, а общий размер `dist` — на 1 016 KiB. Следующим узким местом остаются изображения комнаты.

Методика, команды и полные результаты: [`docs/performance-profile.md`](docs/performance-profile.md).

## Ограничения MVP

- действия Авито поступают через публичный mock endpoint, а не из production event bus;
- `X-User-ID` допустим только для демонстрации и должен быть удалён при реальной интеграции;
- in-memory hub game-service не разделяет события между несколькими репликами game-service; перед горизонтальным масштабированием нужен Redis Streams, NATS JetStream или Kafka;
- события сохраняются в БД, но доставка WebSocket не является durable outbox;
- история и позиции мебели фиксированы; редактора комнаты нет;
- реализована одна сюжетная линия и один питомец на пользователя;
- нет отдельной валюты, магазина, голода, болезней, наказаний, PvP и платежей.

В production реальные сервисы Авито должны подписывать или публиковать события с глобальным `eventId`; backend Авитоши должен принимать их через доверенный internal transport, сохраняя ту же идемпотентную транзакционную обработку.
