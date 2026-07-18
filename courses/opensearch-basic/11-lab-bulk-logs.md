# 11. Лаба: Bulk API и логи со стенда

## Цель лабы

Загрузить логи через **`scripts/bulk-sample.sh`**, проверить индекс в `_cat/indices`, выполнить поиск и агрегацию; самостоятельно отправить **bulk** из [`examples/bulk-ndjson.sample`](examples/bulk-ndjson.sample).

## Предварительно

```bash
cd deploy/opensearch
docker compose up -d
bash scripts/smoke.sh
```

Документация: [`deploy/opensearch/README.md`](../../deploy/opensearch/README.md).  
Теория: [10. Логи и Bulk API](10-logs-bulk-api.md).

---

## Задание 1. Запуск bulk-sample.sh

```bash
cd deploy/opensearch
bash scripts/bulk-sample.sh
```

Скрипт:

- шлёт **3 документа** в индекс `logs-app-YYYYMMDD`;
- вызывает **`_refresh`**.

Запомните имя индекса из вывода (`Loaded 3 docs into ...`).

**Что увидите:** `Loaded 3 docs into logs-app-...` без ошибок curl.

---

## Задание 2. Проверка индекса

```bash
curl -s "http://localhost:9200/_cat/indices/logs-app-*?v"
curl -s "http://localhost:9200/logs-app-*/_count?pretty"
```

**Что увидите:** `docs.count` ≥ 3, store size > 0.

---

## Задание 3. URI-поиск ошибок

```bash
curl -s "http://localhost:9200/logs-app-*/_search?q=level:error&pretty"
```

**Что увидите:** hit с `GET /orders 500` (из скрипта).

---

## Задание 4. DSL search + sort

```bash
IDX=logs-app-$(date +%Y%m%d)   # подставьте свой индекс с датой

curl -s -X GET "http://localhost:9200/${IDX}/_search?pretty" \
  -H 'Content-Type: application/json' -d '{
  "size": 10,
  "sort": [ { "@timestamp": "desc" } ],
  "query": {
    "bool": {
      "filter": [ { "term": { "service": "api" } } ]
    }
  }
}'
```

**Что увидите:** документы service `api` (health и orders).

---

## Задание 5. Агрегация по level

```bash
curl -s -X GET "http://localhost:9200/logs-app-*/_search?pretty" \
  -H 'Content-Type: application/json' -d '{
  "size": 0,
  "aggs": {
    "levels": { "terms": { "field": "level.keyword", "size": 10 } }
  }
}'
```

Если `level.keyword` отсутствует (чистый dynamic text), используйте:

```json
"field": "level"
```

и сравните результат с [лабой 05](05-lab-mapping.md) — зачем нужен keyword.

**Что увидите:** buckets `info`, `error`, `warn`.

---

## Задание 6. Свой bulk из примера

1. Скопируйте [`examples/bulk-ndjson.sample`](examples/bulk-ndjson.sample) в `/tmp/my-bulk.ndjson`.
2. Замените `logs-app-EXAMPLE` на `logs-app-lab-manual`.
3. Выполните:

```bash
curl -sf -X POST "http://localhost:9200/_bulk" \
  -H 'Content-Type: application/x-ndjson' \
  --data-binary @/tmp/my-bulk.ndjson

curl -sf -X POST "http://localhost:9200/logs-app-lab-manual/_refresh"
curl -s "http://localhost:9200/logs-app-lab-manual/_count?pretty"
```

**Что увидите:** `count` 3, `errors: false` в ответе bulk.

---

## Задание 7. Dashboards Discover

1. [http://localhost:5601](http://localhost:5601) → **Discover**.
2. Create index pattern `logs-app-*`, time field `@timestamp`.
3. Фильтр `level: error` — одна строка orders 500.

---

## Задание 8. Дополнительные строки (опционально)

Добавьте в bulk ещё 10 строк (error/warn) через heredoc в стиле скрипта `bulk-sample.sh` — проверьте, что `doc_count` вырос.

---

## Критерии успеха

- [ ] `bulk-sample.sh` завершился без ошибки
- [ ] `_search?q=level:error` находит orders 500
- [ ] Ручной bulk из `bulk-ndjson.sample` создал индекс `logs-app-lab-manual`
- [ ] `terms` agg по level показывает три уровня
- [ ] Понятна роль `_refresh` после bulk

## Что унести в работу

- Ежедневный индекс `logs-app-YYYYMMDD` + wildcard поиск
- Для CI/smoke — тот же `bulk-sample.sh`, что в deploy

Следующий урок: [12. vs Loki и Elasticsearch](12-vs-loki-elasticsearch.md).
