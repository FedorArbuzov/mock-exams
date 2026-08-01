# 07. Lab: Query DSL — match, bool, filter

## Lab goal

Load a set of logs into an index with mapping, run **`match`**, **`bool`** + **`filter`**, **`range`** by time and status; compare with [`examples/search-queries.json`](examples/search-queries.json).

## Prerequisites

- Stand: [`deploy/opensearch`](../../deploy/opensearch/README.md).
- Preferably a ready `lab-mapping` from [lab 05](05-lab-mapping.md), or create it again (task 1).

Theory: [06. Query DSL](06-query-dsl.md).

---

## Task 1. Prepare index `lab-search`

If `lab-mapping` already exists — add the documents below. Otherwise:

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

Bulk of three events (one action line + one source — NDJSON in `-d` is awkward; one POST each):

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

## Task 2. match on message

```bash
curl -s -X GET "http://localhost:9200/lab-search/_search?pretty" \
  -H 'Content-Type: application/json' -d '{
  "query": { "match": { "message": "orders 500" } },
  "size": 5
}'
```

**What you'll see:** hit with `GET /orders 500`, `_score` > 0.

---

## Task 3. bool + filter: errors only

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

**What you'll see:** one document with level error.

---

## Task 4. bool: must + filter

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

**What you'll see:** orders 500 document (not health 200).

---

## Task 5. must_not — exclude worker

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

**What you'll see:** two `api` documents, no retry payment.

---

## Task 6. Sort by time

```bash
curl -s -X GET "http://localhost:9200/lab-search/_search?pretty" \
  -H 'Content-Type: application/json' -d '{
  "query": { "match_all": {} },
  "sort": [ { "@timestamp": "desc" } ],
  "size": 3
}'
```

**What you'll see:** first — `15:00:03` worker, then api.

---

## Task 7. URI search (optional)

```bash
curl -s "http://localhost:9200/lab-search/_search?q=level:error&pretty"
```

**What you'll see:** may differ from DSL (field `level` analyzed as text). Compare with task 3 — understand the risk of `q=` in production.

---

## Task 8. Examples file

Open [`examples/search-queries.json`](examples/search-queries.json), copy the `bool_filter_level_error` body, replace the index with `lab-search`, run via curl.

---

## Success criteria

- [ ] `match` finds a document by a message fragment
- [ ] `bool` + `filter` + `term` on `level.keyword` returns only error
- [ ] Combined `service` + `range status` excludes 200
- [ ] `sort` by `@timestamp` desc works
- [ ] Difference between DSL and `q=` in the URL is clear

## Takeaways for work

- Investigation: **filter** by level/service/time, **must** by text in message
- Always set **`_source`** for a compact on-call response

Next lesson: [08. Aggregations](08-aggregations.md).
