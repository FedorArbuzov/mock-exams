# 13. Финальный проект: расследование инцидента по логам

## Введение: собрать basic в один контур

Отдельно вы умеете mapping, bool search, aggregations и bulk. **Финал** — связный **mini on-call** на [`deploy/opensearch`](../../deploy/opensearch/README.md): загрузить логи, найти корень всплеска 5xx, построить агрегации, оформить отчёт. Без новых сервисов — только API **localhost:9200**, Dashboards **5601**, `curl` и скрипты стенда.

## Что вы узнаете (итог курса)

- Провести **расследование** от симптома к гипотезе по логам.
- Скомбинировать **bulk**, **search**, **aggs** в одном сценарии.
- Задокументировать **timeline** и запросы для передачи смене.

## Требования

| # | Требование | Критерий |
|---|------------|----------|
| 1 | Стенд | `docker compose up -d`, `smoke.sh` OK |
| 2 | Данные | `bulk-sample.sh` + **≥ 10** своих событий bulk (ошибки, warn, разные service) |
| 3 | Mapping | явный индекс `logs-incident-*` **или** обоснование dynamic + `.keyword` |
| 4 | Поиск | минимум 3 сохранённых Query DSL (bool + filter + match) |
| 5 | Агрегации | `terms` по service + `date_histogram` или filter sub-agg |
| 6 | Dashboards | index pattern + **Discover** saved search или скрин |
| 7 | Документ | `PROJECT.md` по шаблону ниже |
| 8 | Сравнение (опционально) | 1 абзац: тот же сценарий в **Loki** — [03-loki](../observability-intermediate/03-loki-logql.md) |

---

## Сценарий

**14:00** — мониторинг (условно Prometheus) показал рост 5xx на `api`. Логи пишутся в OpenSearch индекс `logs-app-*`. Ваша задача: **когда началось**, **сколько** ошибок по `service`, **пример** одной строки message для эскалации в разработку.

---

## Фаза 1. Подготовка стенда

```bash
cd deploy/opensearch
docker compose up -d
bash scripts/smoke.sh
bash scripts/bulk-sample.sh
```

Проверьте:

```bash
curl -s http://localhost:9200/_cluster/health?pretty
curl -s "http://localhost:9200/_cat/indices/logs-*?v"
```

---

## Фаза 2. Расширить данные

Создайте bulk NDJSON (≥ 10 документов) с полями:

- `@timestamp` — разброс в пределах **1 часа**
- `level` — минимум **3 error** на `service: api`
- `status` — 500 на ошибках
- `message` — уникальные фразы для `match`

Индекс: `logs-incident-20260518` (или сегодняшняя дата).

```bash
curl -sf -X POST "http://localhost:9200/_bulk" \
  -H 'Content-Type: application/x-ndjson' \
  --data-binary @YOUR-BULK.ndjson
curl -sf -X POST "http://localhost:9200/logs-incident-*/_refresh"
```

Образец формата: [`examples/bulk-ndjson.sample`](examples/bulk-ndjson.sample).

---

## Фаза 3. Расследование (обязательные запросы)

### 3.1 Симптом — все error за час

```json
{
  "query": {
    "bool": {
      "filter": [
        { "term": { "level.keyword": "error" } },
        { "range": { "@timestamp": { "gte": "2026-05-18T13:00:00Z", "lte": "2026-05-18T15:00:00Z" } } }
      ]
    }
  },
  "sort": [{ "@timestamp": "asc" }],
  "size": 20
}
```

Зафиксируйте **время первой** error в `PROJECT.md`.

### 3.2 Разрез по service

Используйте [`examples/search-queries.json`](examples/search-queries.json) → `agg_terms_with_sub_metric`.

### 3.3 Полнотекст

`match` на `message` с ключевым словом из вашего сценария (например `orders` или `timeout`).

Сохраните три запроса в `PROJECT-queries.json`.

---

## Фаза 4. Dashboards

1. Index pattern: `logs-incident-*` или `logs-*`.
2. **Discover**: фильтр `level: error`, колонки `@timestamp`, `service`, `message`, `status`.
3. (Бонус) **Visualization** — Terms по `service.keyword`.

---

## Фаза 5. Runbook (шаблон)

В `PROJECT.md` секция **Runbook: spike 5xx in logs**:

1. **Симптом:** рост 5xx / алерт `HighErrorRate` (условный).
2. **Проверка:** `_cluster/health`, `_cat/indices` — не red, не read-only.
3. **Поиск:** bool filter `level:error` + range `@timestamp`.
4. **Аналитика:** terms по `service`, найти лидера.
5. **Деталь:** match по `message`, скопировать `_id` и `_source` в тикет.
6. **Эскалация:** если > N ошибок/мин — разработка + [ссылка на trace/metrics].

---

## Шаблон PROJECT.md

```markdown
# OpenSearch Basic — Final Project

## Автор / дата

## Стенд
- compose, RAM Docker
- security: DISABLE_SECURITY_PLUGIN (lab only)

## Данные
- Индексы: logs-app-*, logs-incident-*
- Число документов ( _count )

## Timeline UTC
- Первая error: ...
- Пик (по agg): ...

## Запросы (PROJECT-queries.json)
| # | Цель | Краткий результат |
|---|------|-------------------|
| 1 | все error в окне | N hits |
| 2 | terms by service | api: X errors |
| 3 | match message | пример _source |

## Aggregations
- Вывод: какой service виноват, сколько doc_count

## Dashboards
- Index pattern, saved search / скрин

## Runbook
- (вставьте секцию)

## Loki comparison (optional)
- Какой selector в LogQL заменил бы bool filter

## Выводы
- 3 bullets: что унесли в работу
```

---

## Критерии оценки (самопроверка)

- [ ] Bulk и refresh выполнены без `errors: true`
- [ ] Найдено время первой error и пример message
- [ ] `terms` agg показывает доминирующий `service`
- [ ] Три DSL-запроса сохранены и воспроизводимы
- [ ] Runbook читабелен без устных пояснений
- [ ] Понятна ссылка на [`deploy/opensearch/README.md`](../../deploy/opensearch/README.md)

## Дальше

- [`opensearch-intermediate`](../opensearch-intermediate/README.md) — ingest pipeline, ISM
- [`observability-intermediate`](../observability-intermediate/README.md) — Loki, корреляция с метриками
- [`observability-basic`](../observability-basic/README.md) — RED и алерты по метрикам

Поздравляем с завершением **OpenSearch — Basic**.
