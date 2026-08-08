# Авитоша v2: аудит и целевая архитектура

## Удаляется

- ежедневные потребности `SATIETY`, `MOOD`, `CURIOSITY` и таблица `pet_daily_states`;
- расходуемые предметы `FOOD`, `TOY`, `BOOK`, `inventory_items` и endpoint их применения;
- XP-награды за состояния `HAPPY`/`ECSTATIC` и ежедневный reset-сценарий;
- статические данные комнаты и достижений на frontend.

## Переиспользуется

- регистрация, JWT/refresh-сессии и таблицы `users`/`sessions`;
- PostgreSQL, pgx, общий `TxManager`, конфигурация и graceful shutdown;
- HTTP middleware, единый формат ошибок, OpenAPI и health checks;
- React, Redux Toolkit, TanStack Query и существующая визуальная оболочка комнаты.

## Добавляется

- задания, пользовательский прогресс и идемпотентные mock-события Авито;
- XP, уровни и позитивные настроения питомца;
- фиксированная комната, последовательная история `FIRST_ROOM` и предметы-награды;
- недельный score, ежедневная сводка, достижения и характер питомца;
- сохраняемые доменные события и in-memory WebSocket hub с публикацией после commit;
- HTTP API `/api/v1`, end-to-end сценарий, seed и smoke-проверка;
- frontend-данные из API и realtime-реакции вместо статических заглушек.

## Транзакционная граница

`POST /api/v1/actions` выполняет проверку `eventId`, создание игрового профиля,
обновление задания, награды, комнаты, сюжета, статистики, достижений и сохранение
событий в одной PostgreSQL-транзакции. WebSocket-публикация выполняется только
после успешного commit.

## Микросервисная архитектура

Монолит разделён по бизнес-владению, а не по техническим слоям:

```text
Internet
   │ REST / WebSocket
   ▼
API Gateway (stateless)
   ├── AuthService gRPC ───────→ auth-service ──→ users, sessions
   └── GameService gRPC ───────→ game-service ──→ game + retention tables
          ▲                            │
          └──── server stream ─────────┘ domain events after commit
```

### Ответственность сервисов

| Процесс | Владеет | Не делает |
|---|---|---|
| `api-gateway` | HTTP/OpenAPI, cookies, CORS, transport validation, WebSocket upgrade | SQL, JWT cryptography, игровые правила |
| `auth-service` | users, sessions, bcrypt, выдача и проверка JWT | игровой профиль и награды |
| `game-service` | pet/tasks/story/room/rewards/retention, ProxyAPI, domain events | пароли и refresh-сессии |

Публичный API не изменён. Gateway реализует существующие handler-интерфейсы gRPC-клиентами, поэтому frontend не знает о разбиении. Внутренний versioned-контракт находится в `app/backend/api/proto/avitosha/v1/services.proto`. Генерируемые `services.pb.go` и `services_grpc.pb.go` коммитятся, чтобы сборка контейнера не зависела от установленного `protoc`.

### gRPC-контракты

- unary RPC используются для auth-команд и всех game query/command;
- `SubscribeEvents` — server-streaming RPC: на каждый WebSocket gateway открывает поток для конкретного `user_id`;
- readiness gateway проверяет оба downstream через стандартный gRPC Health Checking Protocol;
- HTTP deadline/cancellation проходит в gRPC и далее в pgx через общий `context.Context`;
- доменные ошибки переводятся в стабильные gRPC status/reason, а на gateway восстанавливаются в прежние HTTP status/code;
- UUID и время проверяются на стороне gRPC-сервера до вызова use case.

Сейчас сложные игровые read models передаются в отдельных RPC через `payload_json`. Это осознанный anti-corruption этап миграции: маршруты и входные команды уже строго типизированы protobuf, но существующие насыщенные агрегаты не дублируются одновременно в DTO, protobuf и domain model. Следующий совместимый этап — заменять envelope на protobuf-сообщения по одному RPC; номера полей нельзя переиспользовать, удалённые поля следует помечать `reserved`.

### Согласованность и модель отказов

`POST /api/v1/actions` полностью выполняется внутри game-service и одной его PostgreSQL-транзакции. gRPC не пересекает транзакционную границу. События попадают в hub только после commit и затем передаются gateway stream-ом.

Создание профиля больше не вызывается из auth-транзакции. `EnsureProfile` ленивый и идемпотентный: первый игровой запрос создаёт pet/story/initial room item. Это исключает dual write `auth DB + game DB` и ситуацию, когда game commit прошёл, а регистрация откатилась. Если продукту понадобится профиль сразу после регистрации без первого запроса, следует добавить transactional outbox в auth-service и идемпотентного consumer в game-service, а не синхронный gRPC внутри SQL-транзакции.

Gateway stateless и может масштабироваться горизонтально. Game hub пока process-local, поэтому game-service запускается в одной реплике. Для нескольких реплик domain events должны публиковаться через durable broker; WebSocket stream после разрыва сейчас переподключается самим клиентом через обычную стратегию frontend reconnect, без replay. Для гарантированного replay нужны event sequence/cursor и брокер.

### Данные и эксплуатация

На текущем migration-step auth-service и game-service используют один PostgreSQL instance и одну базу, но обращаются только к своим таблицам. Это table-level ownership, а не окончательный database-per-service. Следующий безопасный этап:

1. разделить миграции на `migrations/auth` и `migrations/game`;
2. выдать отдельные DB roles с запретом cross-domain SQL;
3. перенести схемы/БД независимо, не меняя gRPC API;
4. убрать общий Go module только после стабилизации protobuf и observability.

Для production также нужны TLS/mTLS между сервисами, unary/stream interceptors с trace/request ID, метрики latency/error code, retry только для идемпотентных query, circuit breaking на gateway и лимиты размера сообщений. Команды (`Register`, `Refresh`, `ProcessAction`) автоматически ретраить нельзя; `ProcessAction` допускает клиентский retry только благодаря глобальному `eventId`.

### Локальный deployment

Compose запускает `api-gateway`, `auth-service`, `game-service`, PostgreSQL, migrations и frontend. Публичные порты есть только у gateway/frontend/PostgreSQL; gRPC-порты 9091/9092 остаются внутри Compose-сети. Gateway считается ready, только когда оба downstream отвечают `SERVING`.

## Миграционная стратегия

Auth-миграции `000001` и `000002` сохраняются. Новая миграция `000004` удаляет
устаревшие pet-таблицы из `000003` и создаёт актуальную доменную схему. Такой
подход работает как на чистой БД, так и поверх уже применённой версии MVP.
