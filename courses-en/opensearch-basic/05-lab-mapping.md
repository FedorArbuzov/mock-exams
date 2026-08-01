# 05. Lab: mapping, text vs keyword

## Lab goal

Create an index with **explicit mapping**, compare **`_analyze`**, index documents, and confirm that **`term`** works on `keyword` and **`match`** on `text`.

## Prerequisites

- Stand is up ([`deploy/opensearch`](../../deploy/opensearch/README.md)).
- [Lab 03](03-lab-first-index.md) completed.

Theory: [04. Mapping and analyzers](04-mapping-analyzers.md).

---

## Task 1. Index `lab-mapping`

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

**What you'll see:** `level` with `keyword` subfield, `service` as `keyword`.

---

## Task 2. Analyze: standard vs keyword

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

**What you'll see:** standard — several lowercase tokens; keyword — one token whole.

---

## Task 3. Documents

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

## Task 4. term on text — expected failure

```bash
curl -s -X GET "http://localhost:9200/lab-mapping/_search?pretty" \
  -H 'Content-Type: application/json' -d '{
  "query": { "term": { "level": "ERROR" } }
}'
```

**What you'll see:** often **0 hits** (analyzer made `error`, case did not match).

---

## Task 5. term on keyword — success

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

**What you'll see:** hits with `level` ERROR and both checkout documents respectively.

---

## Task 6. match on message

```bash
curl -s -X GET "http://localhost:9200/lab-mapping/_search?pretty" \
  -H 'Content-Type: application/json' -d '{
  "query": { "match": { "message": "timeout bank" } }
}'
```

**What you'll see:** document with `payment timeout upstream=bank`.

---

## Task 7. range on status

```bash
curl -s -X GET "http://localhost:9200/lab-mapping/_search?pretty" \
  -H 'Content-Type: application/json' -d '{
  "query": { "range": { "status": { "gte": 500 } } }
}'
```

**What you'll see:** one hit with `status` 500.

---

## Success criteria

- [ ] Mapping has `text` + `fields.keyword` for `level`
- [ ] `_analyze` shows the difference standard vs keyword
- [ ] `term` on `level` without `.keyword` does not find ERROR (on purpose)
- [ ] `term` on `level.keyword` finds ERROR
- [ ] `match` finds the document by words in `message`

## Takeaways for work

- Filters and aggregations on enum fields — **`keyword`**
- Full text on `message` — **`match`**
- In Dashboards, filters are often built on **keyword** fields

Next lesson: [06. Query DSL](06-query-dsl.md).
