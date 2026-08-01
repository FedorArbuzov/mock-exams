# 02. Lab: index template for `logs-app-*`

## Setup

```bash
cd deploy/opensearch
docker compose up -d
bash scripts/smoke.sh
```

API: `http://localhost:9200`. If needed, reset the data: `docker compose down -v` and `up -d` again.

## Task 1. Install the composable template

From the repository root:

```bash
curl -s -X PUT "http://localhost:9200/_index_template/logs-app" \
  -H 'Content-Type: application/json' \
  -d @courses/opensearch-intermediate/examples/index-template-logs.json
```

Verification:

```bash
curl -s "http://localhost:9200/_index_template/logs-app?pretty"
```

**What you'll see:** the template `logs-app` with `index_patterns: ["logs-app-*"]`, `priority: 200`, mappings for `@timestamp`, `level`, `service`, …

## Task 2. Create an index via bulk

```bash
bash deploy/opensearch/scripts/bulk-sample.sh
IDX=$(date +%Y%m%d)
curl -s "http://localhost:9200/logs-app-${IDX}/_mapping?pretty"
```

**What you'll see:** field types match the template (`level` — `keyword`, `@timestamp` — `date`), not just the guessed dynamic types.

Compare with a control index **without** a template:

```bash
curl -s -X PUT "http://localhost:9200/raw-no-template" -H 'Content-Type: application/json' \
  -d '{"settings":{"number_of_shards":1,"number_of_replicas":0}}'
curl -s -X POST "http://localhost:9200/raw-no-template/_doc" -H 'Content-Type: application/json' \
  -d '{"@timestamp":"2026-05-18T10:00:00Z","level":"info","message":"GET /health 200"}'
curl -s "http://localhost:9200/raw-no-template/_mapping?pretty"
```

Note in your report: for `message` and `level` the mapping may differ from `logs-app-*`.

## Task 3. Search and filter by keyword

```bash
curl -s "http://localhost:9200/logs-app-*/_search" -H 'Content-Type: application/json' -d '{
  "size": 5,
  "query": { "bool": {
    "filter": [
      { "term": { "level": "error" } }
    ]
  }},
  "sort": [{ "@timestamp": "desc" }]
}' | head -c 2000
```

**What you'll see:** a document with `GET /orders 500` and `level: error` from bulk-sample.

## Task 4. Alias (optional)

Create an alias to write to the "current" daily index:

```bash
TODAY="logs-app-$(date +%Y%m%d)"
curl -s -X POST "http://localhost:9200/_aliases" -H 'Content-Type: application/json' -d "{
  \"actions\": [
    { \"add\": { \"index\": \"$TODAY\", \"alias\": \"logs-app-write\" } }
  ]
}"
curl -s "http://localhost:9200/_cat/aliases?v"
```

In production, ingest (Logstash, Fluent Bit, Kafka Connect sink) often writes to the **alias** `logs-app-write`, while ISM transitions old backing indices — here it is enough to understand the idea.

## Task 5. Dashboards (visual check)

1. Open http://localhost:5601  
2. **Management → Dashboards Management → Index patterns** (or Stack Management → Index patterns).  
3. Create the pattern `logs-app-*`, time field — `@timestamp`.  
4. **Discover** — make sure the fields `level`, `service`, `status` are visible as filterable.

## Cleanup (optional)

```bash
curl -s -X DELETE "http://localhost:9200/logs-app-*"
curl -s -X DELETE "http://localhost:9200/raw-no-template"
curl -s -X DELETE "http://localhost:9200/_index_template/logs-app"
```

## Lab summary

- A template sets the schema contract **before** the first document.
- The daily index `logs-app-YYYYMMDD` pairs with ISM ([06-lab-ism-rollover.md](06-lab-ism-rollover.md)).
- The next step is enriching fields in an **ingest pipeline** ([04-lab-ingest-pipeline.md](04-lab-ingest-pipeline.md)).
