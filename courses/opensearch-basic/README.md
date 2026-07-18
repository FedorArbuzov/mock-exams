# OpenSearch — Basic

Базовый уровень: **зачем поисковый движок для логов**, **архитектура индекса**, **mapping и analyzers**, **Query DSL**, **агрегации**, **Bulk API**, **сравнение с Loki и Elasticsearch**, **мини-проект расследования логов**.

**Предварительно:** базовый Linux и Docker ([`linux-basic`](../linux-basic/README.md) или [`linux-intermediate`](../linux-intermediate/README.md) — `docker compose`, `curl`, браузер). Полезно пройти [observability-basic](../observability-basic/README.md) (метрики + введение в логи).

**Локально:** [`deploy/opensearch`](../../deploy/opensearch/README.md) — `docker compose up -d`, с хоста:

| Сервис | URL |
|--------|-----|
| OpenSearch API | [http://localhost:9200](http://localhost:9200) |
| OpenSearch Dashboards | [http://localhost:5601](http://localhost:5601) |

На стенде **`DISABLE_SECURITY_PLUGIN=true`** — `curl` без TLS и пароля (только лаб). В продакшене — FGAC, TLS, роли.

Smoke: `bash scripts/smoke.sh` в `deploy/opensearch`. Bulk-образец: `bash scripts/bulk-sample.sh`.

**Дальше:** [`opensearch-intermediate`](../opensearch-intermediate/README.md) (ingest pipelines, ISM). Логи в Grafana — [`observability-intermediate`](../observability-intermediate/README.md) (Loki, [03-loki](../observability-intermediate/03-loki-logql.md)).

## Как читать главы

Каждый урок — **глава книги**, не шпаргалка. Рекомендуемый порядок внутри пары:

1. Прочитайте **теорию** (01, 02, 04…) — не пропускайте «типичные ошибки».
2. Откройте **лабу** (03, 05…) с поднятым стендом `docker compose up -d` в `deploy/opensearch`.
3. Выполняйте задания **по номерам**; сверяйте JSON-ответ с блоком «что увидите».
4. Если кластер не отвечает — [`deploy/opensearch/README.md`](../../deploy/opensearch/README.md) (healthy, OOM, `vm.max_map_count`).

**Структура теории:** введение (сценарий с работы) → что узнаете → концепции → пример на стенде → ошибки → в проде → резюме → чек-лист.

**Структура лабы:** цель → предварительно → задания 1…N (зачем / команды / что увидите) → критерии успеха.

**Время:** около **40–50 минут** на пару «теория + лаба»; [финальный проект](13-final-project.md) — **2–3 часа**.

**Шпаргалка подключения:**

| Откуда | Адрес |
|--------|--------|
| Браузер (Dashboards) | [localhost:5601](http://localhost:5601) |
| API с хоста | `http://localhost:9200` |
| Внутри Docker-сети | `http://opensearch:9200` |

## Программа

### Основы (01–03)

1. [Зачем OpenSearch: логи, поиск, Loki vs DB](01-why-opensearch.md)
2. [Архитектура: cluster, index, shard, document](02-architecture.md)
3. [Лаба: первый индекс и документ](03-lab-first-index.md)

### Mapping (04–05)

4. [Mapping и analyzers: text vs keyword](04-mapping-analyzers.md) · 5. [Лаба: mapping и анализ текста](05-lab-mapping.md)

### Поиск (06–07)

6. [Query DSL: match, bool, filter](06-query-dsl.md) · 7. [Лаба: поиск по логам](07-lab-search.md)

### Агрегации (08–09)

8. [Агрегации: terms, date_histogram, metrics](08-aggregations.md) · 9. [Лаба: агрегации на стенде](09-lab-aggregations.md)

### Логи и bulk (10–11)

10. [Логи и Bulk API: NDJSON, refresh](10-logs-bulk-api.md) · 11. [Лаба: bulk-логи](11-lab-bulk-logs.md)

### Сравнение и финал (12–13)

12. [OpenSearch vs Loki vs Elasticsearch](12-vs-loki-elasticsearch.md)
13. [Финальный проект: расследование инцидента](13-final-project.md)

## Что должно получиться

- Объясняете, **когда логи в OpenSearch**, а когда в **Loki** или **SQL**.
- Создаёте **индекс**, индексируете документ, читаете **`_id`** и **`_source`**.
- Различаете поля **`text`** и **`keyword`** в mapping.
- Пишете запросы **`match`**, **`bool`**, **`filter`** (без scoring на фильтрах).
- Строите **terms** и **date_histogram** агрегации.
- Загружаете логи через **`_bulk`** (NDJSON) и делаете **`_refresh`**.
- Формулируете trade-offs для **собеседования** (Loki labels vs inverted index).

## Примеры

| Путь | Назначение |
|------|------------|
| [`examples/search-queries.json`](examples/search-queries.json) | тела запросов для лаб 07 и 09 |
| [`examples/bulk-ndjson.sample`](examples/bulk-ndjson.sample) | формат bulk для лаб 11 |
