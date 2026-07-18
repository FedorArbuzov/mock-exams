# 07. Лаба: Query DSL — match, bool, filter

## Цель лабы

Загрузить набор логов в индекс с mapping, выполнить запросы **`match`**, **`bool`** + **`filter`**, **`range`** по времени и статусу; сверить с [`examples/search-queries.json`](examples/search-queries.json).

## Предварительно

- Стенд: [`deploy/opensearch`](../../deploy/opensearch/README.md).
- Желательно готовый `lab-mapping` из [лабы 05](05-lab-mapping.md) или создайте заново (задание 1).

Теория: [06. Query DSL](06-query-dsl.md).

---

## Задание 1. Подготовить индекс `lab-search`

Если `lab-mapping` уже есть — добавьте документы ниже. Иначе:

```bash
curl -s -X PUT "http://localhost:9200/lab-search" \
  -H 'Content-Type: application/json' -d '{
  "settings": { "number_of_shards": 1, "number_of_replicas": 0 },
  "mappings": {
    "properties": {
      "@timestamp": { "type": "date" },
      "level": { "type": "text", "fields": { "keyword": { "type": "keyword" } } },
      "service": { "type": "keyword" },
      "message": { "type": "text" },
      "status": { "type": "integer" }
    }
  }
}'
```

Bulk трёх событий (одна строка action + одна source — NDJSON в `-d` неудобен; по одному POST):

```bash
for body in \
  '{"@timestamp":"2026-05-18T15:00:01Z","level":"info","service":"api","message":"GET /health 200","status":200}' \
  '{"@timestamp":"2026-05-18T15:00:02Z","level":"error","service":"api","message":"GET /orders 500 internal","status":500}' \
  '{"@timestamp":"2026-05-18T15:00:03Z","level":"warn","service":"worker","message":"retry payment","status":null}'
do
  curl -s -X POST "http://localhost:9200/lab-search/_doc" -H 'Content-Type: application/json' -d "$body"
done
curl -s -X POST "http://localhost:9200/lab-search/_refresh"
```

---

## Задание 2. match по message

```bash
curl -s -X GET "http://localhost:9200/lab-search/_search?pretty" \
  -H 'Content-Type: application/json' -d '{
  "query": { "match": { "message": "orders 500" } },
  "size": 5
}'
```

**Что увидите:** hit с `GET /orders 500`, `_score` > 0.

---

## Задание 3. bool + filter: только error

```bash
curl -s -X GET "http://localhost:9200/lab-search/_search?pretty" \
  -H 'Content-Type: application/json' -d '{
  "query": {
    "bool": {
      "filter": [
        { "term": { "level.keyword": "error" } }
      ]
    }
  }
}'
```

**Что увидите:** один документ level error.

---

## Задание 4. bool: must + filter

```bash
curl -s -X GET "http://localhost:9200/lab-search/_search?pretty" \
  -H 'Content-Type: application/json' -d '{
  "query": {
    "bool": {
      "must": [ { "match": { "message": "GET" } } ],
      "filter": [
        { "term": { "service": "api" } },
        { "range": { "status": { "gte": 400 } } }
      ]
    }
  },
  "_source": ["@timestamp", "level", "message", "status"]
}'
```

**Что увидите:** документ orders 500 (не health 200).

---

## Задание 5. must_not — исключить worker

```bash
curl -s -X GET "http://localhost:9200/lab-search/_search?pretty" \
  -H 'Content-Type: application/json' -d '{
  "query": {
    "bool": {
      "must": [ { "match_all": {} } ],
      "must_not": [ { "term": { "service": "worker" } } ]
    }
  }
}'
```

**Что увидите:** два документа `api`, без retry payment.

---

## Задание 6. Сортировка по времени

```bash
curl -s -X GET "http://localhost:9200/lab-search/_search?pretty" \
  -H 'Content-Type: application/json' -d '{
  "query": { "match_all": {} },
  "sort": [ { "@timestamp": "desc" } ],
  "size": 3
}'
```

**Что увидите:** первым — `15:00:03` worker, затем api.

---

## Задание 7. URI search (опционально)

```bash
curl -s "http://localhost:9200/lab-search/_search?q=level:error&pretty"
```

**Что увидите:** может отличаться от DSL (анализ поля `level` как text). Сравните с заданием 3 — осознайте риск `q=` в проде.

---

## Задание 8. Файл примеров

Откройте [`examples/search-queries.json`](examples/search-queries.json), скопируйте тело `bool_filter_level_error`, замените индекс на `lab-search`, выполните через curl.

---

## Критерии успеха

- [ ] `match` находит документ по фрагменту message
- [ ] `bool` + `filter` + `term` на `level.keyword` возвращает только error
- [ ] Комбинация `service` + `range status` отсекает 200
- [ ] `sort` по `@timestamp` desc работает
- [ ] Понятна разница между DSL и `q=` в URL

## Что унести в работу

- Расследование: **filter** по level/service/time, **must** по тексту в message
- Всегда указывайте **`_source`** для компактного ответа on-call

Следующий урок: [08. Агрегации](08-aggregations.md).
