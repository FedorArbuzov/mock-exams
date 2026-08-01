# 09. Lab: terms and date_histogram aggregations

## Lab goal

On an index with logs, run **terms**, **date_histogram**, and a **nested filter** aggregation; interpret `buckets` in the JSON response.

## Prerequisites

- Data in `lab-search` from [lab 07](07-lab-search.md) **or** run bulk from [lab 11](11-lab-bulk-logs.md) first.
- Stand: [`deploy/opensearch/README.md`](../../deploy/opensearch/README.md).

Theory: [08. Aggregations](08-aggregations.md).  
Examples: [`examples/search-queries.json`](examples/search-queries.json).

---

## Task 1. terms by level

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

**What you'll see:** `buckets` with keys `info`, `error`, `warn` and `doc_count`.

---

## Task 2. terms by service

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

**What you'll see:** `api` and `worker` with document counts.

---

## Task 3. date_histogram

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

**What you'll see:** one or more buckets with ISO `key_as_string` and `doc_count`.

---

## Task 4. Sub-aggregation: errors per service

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

**What you'll see:** under `api` → `only_errors.doc_count` ≥ 1; for `worker` — 0 (if only warn).

---

## Task 5. Agg + query filter

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

**What you'll see:** buckets only for status values of service api documents (200, 500).

---

## Task 6. avg on status (optional)

```bash
curl -s -X GET "http://localhost:9200/lab-search/_search?pretty" \
  -H 'Content-Type: application/json' -d '{
  "size": 0,
  "aggs": {
    "avg_status": { "avg": { "field": "status" } }
  }
}'
```

**What you'll see:** `value` — average over non-null status (nulls excluded).

---

## Task 7. Dashboards (optional)

In [localhost:5601](http://localhost:5601) → **Visualize** → Vertical bar → index `lab-search` → Terms aggregation on `service.keyword` or `service`.

---

## Success criteria

- [ ] `size: 0` — hits not needed for the report
- [ ] `terms` on `level.keyword` returns meaningful buckets
- [ ] `date_histogram` on `@timestamp` without mapping error
- [ ] Nested `filter` agg counts errors inside service
- [ ] Query + agg narrows the document set

## Takeaways for work

- On-call: first **agg** “how many / where”, then **search** for details
- Field names in aggs — the same **keyword** as in filter

Next lesson: [10. Logs and Bulk API](10-logs-bulk-api.md).
