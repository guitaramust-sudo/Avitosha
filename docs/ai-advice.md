# Советы Авитоши: backend и frontend

## Контракт

```http
GET /api/v1/tasks/{task_id}/advice
Authorization: Bearer <access_token>
```

```json
{
  "taskId": "uuid",
  "text": "Сравни фотографии, состояние товара и условия доставки.",
  "generatedByAi": true
}
```

Если ProxyAPI не настроен или недоступен, backend возвращает безопасный локальный совет с `generatedByAi: false`.

## Backend

- `internal/usecase/game_advice.go` собирает контекст задания, проверяет ответ и формирует fallback.
- `internal/ai/proxyapi.go` вызывает `POST /openrouter/v1/chat/completions` в OpenAI Chat Completions-формате.
- Модель создаёт только текст. Прогресс, XP, награды и баланс рассчитываются обычной игровой логикой без участия ИИ.
- В модель не отправляются email, access token, тексты сообщений и другие персональные данные.

Настройки окружения:

```dotenv
PROXYAPI_API_KEY=<ключ ProxyAPI>
PROXYAPI_BASE_URL=https://api.proxyapi.ru/openrouter/v1
PROXYAPI_MODEL=qwen/qwen-2.5-7b-instruct
PROXYAPI_TIMEOUT=4s
```

## Frontend

- `getTaskAdvice` загружает совет отдельно от основного дашборда.
- `useTaskAdvice` кеширует результат на пять минут.
- Блок «Совет Авитоши» находится в окне деталей задания.
- Метка «ИИ» показывается только при `generatedByAi: true`.
- Кеш совета обновляется после изменения задания, питомца или его имени.

## Как включить Qwen

1. Создать аккаунт в [ProxyAPI](https://proxyapi.ru/), пополнить баланс и выпустить API-ключ.
2. Скопировать `.env.example` в `.env` и записать ключ в `PROXYAPI_API_KEY`. Файл `.env` с секретом не коммитить.
3. Запустить проект:

   ```bash
   docker compose up --build
   ```

4. Авторизоваться, открыть любое задание и проверить наличие метки «ИИ» рядом с советом.

Для другой доступной Qwen-модели достаточно изменить `PROXYAPI_MODEL` и перезапустить backend. Отдельный ключ OpenRouter не нужен: запрос проходит через [OpenRouter endpoint ProxyAPI](https://proxyapi.ru/docs/openrouter).
