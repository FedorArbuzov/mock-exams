# 11. Lab: Bulk API and logs from the stand

## Lab goal

Load logs via **`scripts/bulk-sample.sh`**, check the index in `_cat/indices`, run search and aggregation; send a **bulk** yourself from [`examples/bulk-ndjson.sample`](examples/bulk-ndjson.sample).

## Prerequisites

```bash
cd deploy/opensearch
docker compose up -d
bash scripts/smoke.sh
```

Docs: [`deploy/opensearch/README.md`](../../deploy/opensearch/README.md).  
Theory: [10. Logs and Bulk API](10-logs-bulk-api.md).

---

## Task 1. Run bulk-sample.sh

```bash
cd deploy/opensearch
bash scripts/bulk-sample.sh
```

The script:

- sends **3 documents** to index `logs-app-YYYYMMDD`;
- calls **`_refresh`**.

Note the index name from the output (`Loaded 3 docs into ...`).

**What you'll see:** `Loaded 3 docs into logs-app-...` with no curl errors.

---

## Task 2. Verify the index

```bash
curl -s "http://localhost:9200/_cat/indices/logs-app-*?v"
curl -s "http://localhost:9200/logs-app-*/_count?pretty"
```

**What you'll see:** `docs.count` ≥ 3, store size > 0.

---

## Task 3. URI search for errors

```bash
curl -s "http://localhost:9200/logs-app-*/_search?q=level:error&pretty"
```

**What you'll see:** hit with `GET /orders 500` (from the script).

---

## Task 4. DSL search + sort

```bash
IDX=logs-app-$(date +%Y%m%d)   # substitute your dated index

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

**What you'll see:** documents with service `api` (health and orders).

---

## Task 5. Aggregation by level

```bash
curl -s -X GET "http://localhost:9200/logs-app-*/_search?pretty" \
  -H 'Content-Type: application/json' -d '{
  "size": 0,
  "aggs": {
    "levels": { "terms": { "field": "level.keyword", "size": 10 } }
  }
}'
```

If `level.keyword` is missing (pure dynamic text), use:

```json
"field": "level"
```

and compare the result with [lab 05](05-lab-mapping.md) — why keyword is needed.

**What you'll see:** buckets `info`, `error`, `warn`.

---

## Task 6. Your own bulk from the sample

1. Copy [`examples/bulk-ndjson.sample`](examples/bulk-ndjson.sample) to `/tmp/my-bulk.ndjson`.
2. Replace `logs-app-EXAMPLE` with `logs-app-lab-manual`.
3. Run:

```bash
curl -sf -X POST "http://localhost:9200/_bulk" \
  -H 'Content-Type: application/x-ndjson' \
  --data-binary @/tmp/my-bulk.ndjson

curl -sf -X POST "http://localhost:9200/logs-app-lab-manual/_refresh"
curl -s "http://localhost:9200/logs-app-lab-manual/_count?pretty"
```

**What you'll see:** `count` 3, `errors: false` in the bulk response.

---

## Task 7. Dashboards Discover

1. [http://localhost:5601](http://localhost:5601) → **Discover**.
2. Create index pattern `logs-app-*`, time field `@timestamp`.
3. Filter `level: error` — one orders 500 line.

---

## Task 8. Extra lines (optional)

Add 10 more lines to bulk (error/warn) via heredoc in the style of `bulk-sample.sh` — confirm `doc_count` grew.

---

## Success criteria

- [ ] `bulk-sample.sh` finished without error
- [ ] `_search?q=level:error` finds orders 500
- [ ] Manual bulk from `bulk-ndjson.sample` created index `logs-app-lab-manual`
- [ ] `terms` agg on level shows three levels
- [ ] Role of `_refresh` after bulk is clear

## Takeaways for work

- Daily index `logs-app-YYYYMMDD` + wildcard search
- For CI/smoke — the same `bulk-sample.sh` as in deploy

Next lesson: [12. vs Loki and Elasticsearch](12-vs-loki-elasticsearch.md).
