# 03. Ingest pipelines: Grok и Set

## Где живёт преобразование

Документ можно обогатить **в приложении**, **в агенте** (Fluent Bit, Filebeat), **в Kafka Connect SMT** или **в OpenSearch ingest pipeline**. Pipeline выполняется на **координаторе** при `index`, `bulk`, `update` — до записи в Lucene.

```mermaid
flowchart LR
  APP[Producer / bulk] --> ING[Ingest node]
  ING --> IDX[Index shard]
```

На single-node стенде [`deploy/opensearch`](../../deploy/opensearch/README.md) одна нода совмещает роли; в кластере выделяют dedicated ingest nodes при высокой нагрузке на Grok.

## Структура pipeline

```json
{
  "description": "...",
  "processors": [ ... ],
  "on_failure": [ ... ]
}
```

| Элемент | Назначение |
|---------|------------|
| `processors` | Цепочка шагов по порядку |
| `on_failure` | Что делать при ошибке шага (tag, set, drop) |
| `description` | Документация для операторов |

Регистрация: `PUT _ingest/pipeline/<name>`. Применение: `?pipeline=<name>` на bulk/index или **default pipeline** в index template.

## Processor: Grok

**Grok** разбирает **одно текстовое поле** по паттернам в стиле logstash (на базе регулярных выражений с именованными группами).

Эталон на стенде — [`deploy/opensearch/examples/ingest-pipeline-nginx.json`](../../deploy/opensearch/examples/ingest-pipeline-nginx.json):

```json
{
  "grok": {
    "field": "message",
    "patterns": ["%{WORD:method} %{URIPATHPARAM:path} %{NUMBER:status:int}"]
  }
}
```

Строка `GET /health 200` в поле `message` порождает поля `method`, `path`, `status` (с приведением типа `:int`).

Встроенные паттерны (`WORD`, `URIPATHPARAM`, `NUMBER`, …) покрывают типовые логи; для своего формата добавляют **custom patterns** в cluster state (редко на первом этапе — проще нормализовать лог в приложении в JSON).

**Ограничения Grok:**

- CPU-затратен на высоком QPS; тяжёлые regex — узкое место.
- Один неверный паттерн — failed processor; нужен `on_failure` или fallback pipeline.
- Порядок нескольких `patterns` в массиве — «первый совпавший выигрывает».

## Processor: Set

**Set** записывает значение в поле (константа, из другого поля, из metadata):

```json
{
  "set": {
    "field": "parsed",
    "value": true
  }
}
```

В примере nginx-pipeline флаг `parsed: true` удобен в Discover: «сколько строк разобрал pipeline». Другие варианты:

- `override: false` — не перезаписывать существующее;
- `copy_from` — скопировать из другого поля;
- `if` — условие (Painless в ingest, синтаксис см. документацию OpenSearch).

## Соседние processors (обзор)

| Processor | Когда |
|-----------|--------|
| `json` | `message` уже JSON-строка |
| `date` | Парсинг timestamp из текста |
| `remove` / `rename` | Убрать шум, PII |
| `lowercase` | Нормализация keyword |
| `fail` | Намеренно отклонить документ (quarantine) |

Для JSON-логов приложения чаще достаточно `json` + `date`, без Grok — см. сравнение с Promtail pipeline в [observability-intermediate/05-promtail-pipelines](../observability-intermediate/05-promtail-pipelines.md).

## Пайплайн из Kafka

Типовая схема из [kafka-basic/12-patterns](../kafka-basic/12-patterns.md):

```text
services → topic logs.raw → consumer group "indexer" → bulk → OpenSearch
```

**Kafka Connect** OpenSearch sink может указывать ingest pipeline в конфиге connector; трансформации до Kafka — **SMT** ([kafka-intermediate/15-kafka-connect](../kafka-intermediate/15-kafka-connect.md)). Дублирование Grok и в Connect, и в OpenSearch — антипаттерн: выберите **одно** место нормализации.

## Проверка результата ingest

В Dev Tools или `curl`:

- `GET /_ingest/pipeline/nginx-parse` — определение;
- `POST /_ingest/pipeline/nginx-parse/_simulate` — прогон без записи;
- в документе после index — поле `_ingest` с `timestamp` и списком processors (если не отключено).

## Ошибки и отладка

| Симптом | Причина |
|---------|---------|
| `illegal_argument_exception` Grok | Паттерн не совпал с `message` |
| Поля нет в mapping | Template не содержал поле; dynamic mapping добавил иначе |
| Pipeline не вызван | Забыли `?pipeline=` или default в template |

## Чек-лист

- [ ] Объясняете разницу обогащения в **агенте** vs **ingest pipeline**.
- [ ] Читаете пример Grok + Set в `ingest-pipeline-nginx.json`.
- [ ] Знаете, зачем `on_failure` в продакшене.

**Дальше:** [04. Лаба: ingest pipeline](04-lab-ingest-pipeline.md).
