# 05. Лаба: mapping, text vs keyword

## Цель лабы

Создать индекс с **явным mapping**, сравнить **`_analyze`**, проиндексировать документы и убедиться, что **`term`** работает на `keyword`, а **`match`** — на `text`.

## Предварительно

- Стенд поднят ([`deploy/opensearch`](../../deploy/opensearch/README.md)).
- Пройдена [лаба 03](03-lab-first-index.md).

Теория: [04. Mapping и analyzers](04-mapping-analyzers.md).

---

## Задание 1. Индекс `lab-mapping`

```bash
curl -s -X PUT "http://localhost:9200/lab-mapping" \
  -H 'Content-Type: application/json' -d '{
  "settings": { "number_of_shards": 1, "number_of_replicas": 0 },
  "mappings": {
    "properties": {
      "@timestamp": { "type": "date" },
      "level": {
        "type": "text",
        "fields": { "keyword": { "type": "keyword" } }
      },
      "service": { "type": "keyword" },
      "message": { "type": "text" },
      "status": { "type": "integer" }
    }
  }
}'
```

```bash
curl -s "http://localhost:9200/lab-mapping/_mapping?pretty" | head -40
```

**Что увидите:** `level` с подполем `keyword`, `service` как `keyword`.

---

## Задание 2. Analyze: standard vs keyword

```bash
curl -s -X POST "http://localhost:9200/_analyze" \
  -H 'Content-Type: application/json' -d '{
  "analyzer": "standard",
  "text": "ERROR payment timeout"
}'

curl -s -X POST "http://localhost:9200/_analyze" \
  -H 'Content-Type: application/json' -d '{
  "tokenizer": "keyword",
  "text": "ERROR payment timeout"
}'
```

**Что увидите:** standard — несколько токенов в нижнем регистре; keyword — один токен целиком.

---

## Задание 3. Документы

```bash
curl -s -X POST "http://localhost:9200/lab-mapping/_doc" \
  -H 'Content-Type: application/json' -d '{
  "@timestamp": "2026-05-18T14:00:00Z",
  "level": "ERROR",
  "service": "checkout",
  "message": "payment timeout upstream=bank",
  "status": 500
}'

curl -s -X POST "http://localhost:9200/lab-mapping/_doc" \
  -H 'Content-Type: application/json' -d '{
  "@timestamp": "2026-05-18T14:00:05Z",
  "level": "info",
  "service": "checkout",
  "message": "payment ok",
  "status": 200
}'

curl -s -X POST "http://localhost:9200/lab-mapping/_refresh"
```

---

## Задание 4. term на text — ожидаемый провал

```bash
curl -s -X GET "http://localhost:9200/lab-mapping/_search?pretty" \
  -H 'Content-Type: application/json' -d '{
  "query": { "term": { "level": "ERROR" } }
}'
```

**Что увидите:** часто **0 hits** (analyzer привёл к `error`, регистр не совпал).

---

## Задание 5. term на keyword — успех

```bash
curl -s -X GET "http://localhost:9200/lab-mapping/_search?pretty" \
  -H 'Content-Type: application/json' -d '{
  "query": { "term": { "level.keyword": "ERROR" } }
}'
```

```bash
curl -s -X GET "http://localhost:9200/lab-mapping/_search?pretty" \
  -H 'Content-Type: application/json' -d '{
  "query": { "term": { "service": "checkout" } }
}'
```

**Что увидите:** hits с `level` ERROR и оба документа checkout соответственно.

---

## Задание 6. match на message

```bash
curl -s -X GET "http://localhost:9200/lab-mapping/_search?pretty" \
  -H 'Content-Type: application/json' -d '{
  "query": { "match": { "message": "timeout bank" } }
}'
```

**Что увидите:** документ с `payment timeout upstream=bank`.

---

## Задание 7. range на status

```bash
curl -s -X GET "http://localhost:9200/lab-mapping/_search?pretty" \
  -H 'Content-Type: application/json' -d '{
  "query": { "range": { "status": { "gte": 500 } } }
}'
```

**Что увидите:** один hit со `status` 500.

---

## Критерии успеха

- [ ] Mapping содержит `text` + `fields.keyword` для `level`
- [ ] `_analyze` показывает разницу standard vs keyword
- [ ] `term` на `level` без `.keyword` не находит ERROR (осознанно)
- [ ] `term` на `level.keyword` находит ERROR
- [ ] `match` находит документ по словам в `message`

## Что унести в работу

- Фильтры и aggregations по enum-полям — **`keyword`**
- Полнотекст по `message` — **`match`**
- В Dashboards фильтры часто строятся по **keyword** полям

Следующий урок: [06. Query DSL](06-query-dsl.md).
