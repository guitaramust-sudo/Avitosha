# Профилирование производительности

Дата замеров: 8 августа 2026 года. Окружение: Apple M2, Darwin arm64, Go benchmark с `GOMAXPROCS=8`, production-сборка Vite.

## Backend: сериализация событий

Профилировался горячий путь ответа `POST /api/v1/actions`: преобразование результата с восемью типичными доменными событиями в JSON.

CPU-профиль показал лишний цикл `json.RawMessage → map[string]any → JSON`. Он создавал большое количество временных map, строк и interface-значений. Сериализация заменена на проверяемое объединение исходного JSON payload с обязательным envelope события без промежуточного map.

| Метрика | До | После | Изменение |
|---|---:|---:|---:|
| Время | 26 428 ns/op | 18 480 ns/op | −30,1% |
| Память | 11 798 B/op | 6 149 B/op | −47,9% |
| Аллокации | 272 allocs/op | 44 allocs/op | −83,8% |

Формат HTTP и WebSocket событий не изменился. Тесты дополнительно проверяют flatten payload, приоритет серверных `id`/`type` и безопасную обработку повреждённого payload.

Повторный запуск benchmark и профилей:

```bash
cd app/backend
go test ./internal/handler \
  -run '^$' \
  -bench '^BenchmarkMarshalActionResultDTO$' \
  -benchmem \
  -cpuprofile cpu.out \
  -memprofile mem.out
go tool pprof -top cpu.out
```

## Frontend: production bundle

Добавлена воспроизводимая команда:

```bash
cd app/frontend
npm run profile:bundle
```

Она создаёт production build, группирует ресурсы по типу и выводит десять самых тяжёлых файлов.

По CSS-аудиту используются только обычные начертания Nunito Sans 400/500, 600 и 700. Из production bundle исключены неиспользуемые light, extra-light, extra-bold, black и italic-файлы; исходные файлы в репозитории сохранены.

| Метрика | До | После | Изменение |
|---|---:|---:|---:|
| Размер каталога `dist` | 26 664 KiB | 25 648 KiB | −1 016 KiB / −3,8% |
| Font payload | 1 293 568 B | 275 168 B | −78,7% |
| Font-файлы в bundle | 14 | 3 | −11 файлов |

Главное оставшееся узкое место — изображения: около 24 132 KiB, или 94,7% ресурсов production bundle. Следующий самостоятельный этап оптимизации должен включать WebP/AVIF, responsive sizes и отдельную визуальную проверку качества.
