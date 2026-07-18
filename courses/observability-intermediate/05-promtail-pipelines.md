# 05. Promtail: pipelines и обогащение логов

## Роль Promtail

**Promtail** — агент сбора логов (аналог Promtail/Fluent Bit/Vector у Loki). На стенде он:

1. Обнаруживает контейнеры через **Docker service discovery** (`docker_sd_configs`).
2. Читает stdout/stderr контейнеров.
3. Прогоняет строки через **pipeline stages**.
4. Отправляет batches в Loki (`clients.url: http://loki:3100/loki/api/v1/push`).

Без pipeline в Loki попадают «сырые» строки; labels — только из relabel (имя контейнера, stream).

## Структура конфига

```yaml
server:
  http_listen_port: 9080

positions:
  filename: /tmp/positions.yaml   # курсор чтения — не терять место при рестарте

clients:
  - url: http://loki:3100/loki/api/v1/push

scrape_configs:
  - job_name: docker
    docker_sd_configs: [...]
    relabel_configs: [...]      # labels до pipeline
    pipeline_stages: [...]      # разбор строки
```

Текущий минимум — `deploy/observability/config/promtail.yml` (только relabel, без `pipeline_stages`).

## Pipeline stages (основные)

| Stage | Назначение |
|-------|------------|
| `docker` | Распаковка JSON-обёртки Docker log driver |
| `json` | Парсинг JSON в extracted fields |
| `logfmt` | Парсинг `key=value` |
| `regex` | Извлечение полей регэкспом |
| `labels` | Продвижение полей в **indexed labels** (осторожно с кардинальностью!) |
| `timestamp` | Парсинг времени из строки |
| `drop` | Отбрасывание шума |
| `output` | Финальный текст строки |

Порядок важен: сначала распаковка, потом parse, потом labels.

## Пример: JSON-лог приложения

Допустим, demo-app пишет:

```json
{"level":"info","msg":"request","status":200,"path":"/health"}
```

Pipeline:

```yaml
pipeline_stages:
  - json:
      expressions:
        level: level
        status: status
        path: path
  - labels:
      level:
      status:
  - drop:
      expression: ".*health.*"
      drop_counter_reason: health_noise
```

Теперь в LogQL:

```logql
{container="mock-demo-app", level="error"}
sum(rate({container="mock-demo-app", status="500"}[5m]))
```

**Важно:** каждый уникальный `path` как label — взрыв кардинальности. В labels выносите **низкую** кардинальность: `level`, `status_class` (`2xx`/`5xx`), не полный URL.

## relabel_configs vs pipeline

| | relabel | pipeline |
|---|---------|----------|
| Когда | На metadata target (до чтения файла) | На каждой строке лога |
| Типично | `container`, `namespace` | `level`, `trace_id` |
| Аналог | Prometheus relabel | Обработка содержимого |

## Позиции и надёжность

`positions.yaml` хранит offset. При удалении тома Loki/Promtail возможен **повтор** или **пропуск** — для учебного стенда нормально; в production — persistent volume для positions.

## Безопасность labels

Правило: **не индексировать** высококардинальные поля (`user_id`, `request_id` как label). Используйте line filter:

```logql
{container="app"} |= "request_id=abc-123"
```

Или structured metadata (новые версии Loki) — за рамками intermediate.

## Kafka и Connect

Логи Kafka часто текстовые (multiline stack trace). Stages:

- `multiline` — склеить traceback;
- `regex` — вытащить `ERROR`;
- `labels: {component="kafka"}`.

Метрики lag — по-прежнему Prometheus ([17-monitoring](../kafka-intermediate/17-monitoring.md)); логи — **контекст** инцидента.

## Чек-лист

- [ ] Различаете relabel и pipeline stages.
- [ ] Понимаете риск кардинальности в `labels` stage.
- [ ] Знаете, зачем `positions` и `drop`.

**Дальше:** [06. Лаба: Promtail](06-lab-promtail.md).
