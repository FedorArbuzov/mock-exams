# 09. Лаба: агрегации terms и date_histogram

## Цель лабы

На индексе с логами выполнить **terms**, **date_histogram** и **вложенную filter** aggregation; интерпретировать `buckets` в ответе JSON.

## Предварительно

- Данные в `lab-search` из [лабы 07](07-lab-search.md) **или** выполните bulk из [лабы 11](11-lab-bulk-logs.md) заранее.
- Стенд: [`deploy/opensearch/README.md`](../../deploy/opensearch/README.md).

Теория: [08. Агрегации](08-aggregations.md).  
Примеры: [`examples/search-queries.json`](examples/search-queries.json).

---

## Задание 1. terms по level

```bash
curl -s -X GET "http://localhost:9200/lab-search/_search?pretty" \
  -H 'Content-Type: application/json' -d '{
  "size": 0,
  "aggs": {
    "by_level": {
      "terms": { "field": "level.keyword", "size": 10 }
    }
  }
}'
```

**Что увидите:** `buckets` с `key` `info`, `error`, `warn` и `doc_count`.

---

## Задание 2. terms по service

```bash
curl -s -X GET "http://localhost:9200/lab-search/_search?pretty" \
  -H 'Content-Type: application/json' -d '{
  "size": 0,
  "aggs": {
    "by_service": {
      "terms": { "field": "service", "size": 10 }
    }
  }
}'
```

**Что увидите:** `api` и `worker` с подсчётом документов.

---

## Задание 3. date_histogram

```bash
curl -s -X GET "http://localhost:9200/lab-search/_search?pretty" \
  -H 'Content-Type: application/json' -d '{
  "size": 0,
  "aggs": {
    "logs_over_time": {
      "date_histogram": {
        "field": "@timestamp",
        "fixed_interval": "1h"
      }
    }
  }
}'
```

**Что увидите:** один или несколько bucket с `key_as_string` ISO и `doc_count`.

---

## Задание 4. Sub-aggregation: errors per service

```bash
curl -s -X GET "http://localhost:9200/lab-search/_search?pretty" \
  -H 'Content-Type: application/json' -d '{
  "size": 0,
  "aggs": {
    "by_service": {
      "terms": { "field": "service", "size": 10 },
      "aggs": {
        "only_errors": {
          "filter": { "term": { "level.keyword": "error" } }
        }
      }
    }
  }
}'
```

**Что увидите:** под `api` → `only_errors.doc_count` ≥ 1; у `worker` — 0 (если только warn).

---

## Задание 5. Agg + query filter

```bash
curl -s -X GET "http://localhost:9200/lab-search/_search?pretty" \
  -H 'Content-Type: application/json' -d '{
  "size": 0,
  "query": {
    "bool": {
      "filter": [ { "term": { "service": "api" } } ]
    }
  },
  "aggs": {
    "status_breakdown": {
      "terms": { "field": "status", "size": 10 }
    }
  }
}'
```

**Что увидите:** buckets только для status документов service api (200, 500).

---

## Задание 6. avg по status (опционально)

```bash
curl -s -X GET "http://localhost:9200/lab-search/_search?pretty" \
  -H 'Content-Type: application/json' -d '{
  "size": 0,
  "aggs": {
    "avg_status": { "avg": { "field": "status" } }
  }
}'
```

**Что увидите:** `value` — среднее по не-null status (null не входит).

---

## Задание 7. Dashboards (опционально)

В [localhost:5601](http://localhost:5601) → **Visualize** → Vertical bar → index `lab-search` → Terms aggregation на `service.keyword` или `service`.

---

## Критерии успеха

- [ ] `size: 0` — hits не нужны для отчёта
- [ ] `terms` по `level.keyword` возвращает осмысленные buckets
- [ ] `date_histogram` по `@timestamp` без ошибки mapping
- [ ] Вложенный `filter` agg считает errors внутри service
- [ ] Query + agg сужает множество документов

## Что унести в работу

- On-call: сначала **agg** «сколько / где», потом **search** за деталями
- Имена полей в aggs — те же **keyword**, что в filter

Следующий урок: [10. Логи и Bulk API](10-logs-bulk-api.md).
