# Диаграммы Авитоши

Набор схем для технической документации и финальной презентации. GitHub отображает блоки Mermaid прямо на странице. Для слайдов диаграмму можно открыть в [Mermaid Live Editor](https://mermaid.live/), экспортировать в SVG и вставить без потери качества.

## Общая архитектура

```mermaid
flowchart LR
    browser["React-приложение"]
    caddy["Caddy HTTPS"]
    gateway["Go API Gateway"]
    auth["Auth Service"]
    game["Game Service"]
    postgres[("PostgreSQL")]
    minio["MinIO S3 API"]
    photos[("MinIO Volume")]
    proxy["ProxyAPI"]

    browser <-->|"HTTPS и WebSocket"| caddy
    caddy -->|"API и WS"| gateway
    caddy -->|"/storage"| minio
    gateway -->|"gRPC"| auth
    gateway -->|"gRPC unary и stream"| game
    auth -->|"пользователи и сессии"| postgres
    game -->|"игра, маркетплейс, retention"| postgres
    minio -->|"фотографии"| photos
    game -.->|"AI-советы"| proxy

    classDef edge fill:#E7F3FF,stroke:#0B63CE,color:#102A43
    classDef service fill:#FFF4E5,stroke:#D46B08,color:#4A2A00
    classDef data fill:#EAF7ED,stroke:#27864B,color:#153E25
    classDef external fill:#F5EAFE,stroke:#7A3DB8,color:#35165A
    class browser,caddy edge
    class gateway,auth,game,minio service
    class postgres,photos data
    class proxy external
```

API Gateway — единственная точка входа в backend. Он не обращается к PostgreSQL напрямую: авторизационные данные принадлежат Auth Service, а игровая логика, объявления, дейлики и награды — Game Service.

## Авторизация и безопасное обновление сессии

```mermaid
sequenceDiagram
    autonumber
    participant User as Пользователь
    participant Frontend as React frontend
    participant Gateway as API Gateway
    participant Auth as Auth Service
    participant DB as PostgreSQL

    User->>Frontend: Вводит email и пароль
    Frontend->>Gateway: POST /api/auth/login
    Gateway->>Auth: Login по gRPC
    Auth->>DB: Проверка пользователя и создание сессии
    DB-->>Auth: Пользователь и refresh-сессия
    Auth-->>Gateway: Access token и refresh token
    Gateway-->>Frontend: Access token и HttpOnly refresh cookie
    Frontend->>Gateway: Защищённый запрос с Bearer token
    Gateway->>Auth: AuthenticateAccessToken по gRPC
    Auth-->>Gateway: Идентификатор пользователя
    Gateway-->>Frontend: Персональные данные аккаунта
    Frontend->>Gateway: POST /api/auth/refresh с cookie
    Gateway->>Auth: Ротация refresh token
    Auth->>DB: Отзыв старой и создание новой сессии
    Auth-->>Gateway: Новая пара токенов
    Gateway-->>Frontend: Новый access token и новая HttpOnly cookie
```

Пароль хранится как bcrypt-хеш. Access token короткоживущий, а refresh token хранится в базе только как SHA-256-хеш и ротируется при обновлении сессии.

## Ежедневные задания и награды

```mermaid
sequenceDiagram
    autonumber
    participant User as Пользователь
    participant Frontend as React frontend
    participant Gateway as API Gateway
    participant Game as Game Service
    participant DB as PostgreSQL

    User->>Frontend: Выполняет полезное действие
    Frontend->>Gateway: POST /api/v1/actions с eventId
    Gateway->>Game: ProcessAction по gRPC
    Game->>DB: Транзакция и проверка уникальности eventId
    DB-->>Game: Набор дня и текущий прогресс
    Game->>DB: Прогресс, XP, бонусы и streak
    DB-->>Game: Commit
    Game-->>Gateway: Результат действия
    Gateway-->>Frontend: Новый прогресс и награды
    Game-->>Gateway: События через gRPC stream
    Gateway-->>Frontend: WebSocket-события
    Frontend->>Gateway: GET /api/v1/daily-summary
    Gateway->>Game: GetDailySummary по gRPC
    Game-->>Gateway: 5 заданий, цель, streak и завтра
    Gateway-->>Frontend: Актуальная дневная сводка
```

### Логика обработки одного действия

```mermaid
flowchart TD
    start(["Получено действие с eventId"])
    duplicate{"eventId уже обработан?"}
    saved["Вернуть сохранённый результат"]
    load["Загрузить набор дня: 2 BUYER, 2 SELLER, 1 UNIVERSAL"]
    progress["Продвинуть максимум одно задание каждой подходящей роли"]
    quest{"Новое задание завершено?"}
    questReward["Начислить XP задания один раз"]
    goal{"Выполнены любые 2 из 5?"}
    goalReward["Начислить XP и Avito-бонус дня, продлить streak"]
    shield{"Это каждый 7-й успешный день?"}
    addShield["Выдать один щит streak"]
    balanced{"Закрыты задания BUYER и SELLER?"}
    balancedReward["Начислить бонус за сбалансированный день"]
    commit["Атомарно сохранить результат и события"]
    notify["Отправить WebSocket-события после commit"]
    finish(["Вернуть результат"])

    start --> duplicate
    duplicate -->|"да"| saved --> finish
    duplicate -->|"нет"| load --> progress --> quest
    quest -->|"да"| questReward --> goal
    quest -->|"нет"| goal
    goal -->|"да, награда ещё не получена"| goalReward --> shield
    goal -->|"нет"| balanced
    shield -->|"да"| addShield --> balanced
    shield -->|"нет"| balanced
    balanced -->|"да, бонус ещё не получен"| balancedReward --> commit
    balanced -->|"нет"| commit
    commit --> notify --> finish

    classDef action fill:#E7F3FF,stroke:#0B63CE,color:#102A43
    classDef decision fill:#FFF4E5,stroke:#D46B08,color:#4A2A00
    classDef reward fill:#EAF7ED,stroke:#27864B,color:#153E25
    class start,finish action
    class duplicate,quest,goal,shield,balanced decision
    class questReward,goalReward,addShield,balancedReward reward
```

Набор закрепляется до следующей полуночи по Москве. После закрытия общей цели пользователь может продолжать выполнять оставшиеся задания и получать их собственный XP.

## Загрузка фотографии объявления в MinIO

```mermaid
sequenceDiagram
    autonumber
    participant Frontend as React frontend
    participant Gateway as API Gateway
    participant Caddy as Caddy или Vite proxy
    participant MinIO as MinIO
    participant Game as Game Service
    participant DB as PostgreSQL

    Frontend->>Gateway: POST /api/v1/uploads/listing-photos
    Gateway-->>Frontend: 201 signed form, /storage URL и publicUrl
    Frontend->>Caddy: POST multipart/form-data на /storage
    Caddy->>MinIO: Передача подписанной S3-формы
    MinIO->>MinIO: Проверка SigV4, MIME, размера и срока
    MinIO-->>Caddy: 204 No Content
    Caddy-->>Frontend: 204 No Content
    Frontend->>Gateway: POST /api/v1/listings с publicUrl
    Gateway->>Game: CreateListing по gRPC
    Game->>DB: Сохранить объявление и относительный URL
    DB-->>Game: Созданное объявление
    Game-->>Gateway: Результат
    Gateway-->>Frontend: 201 Created
```

Секрет MinIO не попадает во frontend. Backend подписывает короткоживущую форму, браузер загружает файл прямо в Object Storage, а в объявлении сохраняется стабильный относительный адрес `/storage/avitosha-photos/...`.

## Production-деплой

```mermaid
flowchart TB
    user["Браузер пользователя"]
    dns["avitosha.timurgilyazov.ru"]

    subgraph vm ["Production VM: Docker Compose"]
        caddy["Caddy: TLS и reverse proxy"]

        subgraph edge ["edge network"]
            frontend["Nginx + React"]
            gateway["API Gateway"]
        end

        subgraph backend ["internal backend network"]
            auth["Auth Service"]
            game["Game Service"]
            postgres[("PostgreSQL")]
        end

        subgraph storage ["internal storage network"]
            minio["MinIO"]
            minioData[("minio_data volume")]
        end

        postgresData[("postgres_data volume")]
    end

    proxy["ProxyAPI"]
    acme["ACME certificate authority"]

    user -->|"HTTPS 443"| dns --> caddy
    caddy -->|"страница и assets"| frontend
    caddy -->|"/api, /swagger, /health"| gateway
    caddy -->|"/storage"| minio
    gateway -->|"gRPC 9091"| auth
    gateway -->|"gRPC 9092"| game
    auth --> postgres
    game --> postgres
    postgres --> postgresData
    minio --> minioData
    game -.->|"исходящий HTTPS"| proxy
    caddy -.->|"сертификат и renewal"| acme

    classDef public fill:#E7F3FF,stroke:#0B63CE,color:#102A43
    classDef service fill:#FFF4E5,stroke:#D46B08,color:#4A2A00
    classDef data fill:#EAF7ED,stroke:#27864B,color:#153E25
    classDef external fill:#F5EAFE,stroke:#7A3DB8,color:#35165A
    class user,dns,caddy public
    class frontend,gateway,auth,game,minio service
    class postgres,postgresData,minioData data
    class proxy,acme external
```

Снаружи опубликованы только порты `80/443`. PostgreSQL, gRPC-сервисы и MinIO работают во внутренних Docker-сетях; данные PostgreSQL и фотографии сохраняются в именованных volumes при пересоздании контейнеров.

## Что показывать на защите

1. Общая архитектура — при объяснении границ сервисов и зоны ответственности backend.
2. Авторизация — во время регистрации, входа и повторного открытия личного кабинета.
3. Дейлики — вместе с демонстрацией набора 2+2+1, цели «любые 2» и streak.
4. MinIO — при создании объявления с фотографией и объяснении безопасной загрузки.
5. Production-деплой — перед открытием приложения по публичной ссылке.
