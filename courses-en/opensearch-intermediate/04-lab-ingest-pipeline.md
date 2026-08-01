# 04. Lab: ingest pipeline (Grok + Set)

## Setup

The stack is running, and the template from [02-lab-templates.md](02-lab-templates.md) is installed (recommended).

```bash
cd deploy/opensearch && docker compose ps
```

## Task 1. Register the pipeline

```bash
curl -s -X PUT "http://localhost:9200/_ingest/pipeline/nginx-parse" \
  -H 'Content-Type: application/json' \
  -d @deploy/opensearch/examples/ingest-pipeline-nginx.json
```

Verification:

```bash
curl -s "http://localhost:9200/_ingest/pipeline/nginx-parse?pretty"
```

**What you'll see:** two processors — `grok` on `message`, then `set` on the `parsed: true` field.

## Task 2. Simulate without writing to an index

```bash
curl -s -X POST "http://localhost:9200/_ingest/pipeline/nginx-parse/_simulate" \
  -H 'Content-Type: application/json' \
  -d '{
  "docs": [
    { "_source": { "message": "GET /health 200" } },
    { "_source": { "message": "not matching pattern" } }
  ]
}' | head -c 3000
```

**What you'll see:** the first doc with the fields `method`, `path`, `status`, `parsed`; the second — a Grok error (in your report, describe the `error` in the simulate response).

## Task 3. Bulk with a pipeline

```bash
IDX="logs-app-$(date +%Y%m%d)"
curl -s -X POST "http://localhost:9200/_bulk?pipeline=nginx-parse" \
  -H 'Content-Type: application/x-ndjson' --data-binary @- <<EOF
{"index":{"_index":"$IDX"}}
{"@timestamp":"2026-05-18T11:00:01Z","level":"info","service":"api","message":"GET /health 200"}
{"index":{"_index":"$IDX"}}
{"@timestamp":"2026-05-18T11:00:02Z","level":"error","service":"api","message":"POST /orders 500"}
EOF

curl -s -X POST "http://localhost:9200/$IDX/_refresh"
curl -s "http://localhost:9200/$IDX/_search" -H 'Content-Type: application/json' -d '{
  "query": { "term": { "parsed": true } },
  "_source": ["message","method","path","status","parsed"]
}' | head -c 2500
```

**What you'll see:** `method`, `path`, `status` extracted from `message`; `parsed: true` for successfully parsed lines.

## Task 4. Conflict: status already in the document

Add a document where `status` is already in the JSON, while Grok also writes to `status`:

```bash
curl -s -X POST "http://localhost:9200/_bulk?pipeline=nginx-parse" \
  -H 'Content-Type: application/x-ndjson' --data-binary @- <<EOF
{"index":{"_index":"$IDX"}}
{"@timestamp":"2026-05-18T11:00:03Z","level":"warn","service":"api","message":"GET /pay 402","status":999}
EOF
```

Open `_source` in Discover. **Question for the report:** which `status` value remained and why (processor order, override)?

## Task 5. Default pipeline in the template (optional)

Update the template by adding to `settings`:

```json
"index.default_pipeline": "nginx-parse"
```

Recreate a **new** daily index (a different date in the name, or delete the old one) and index **without** `?pipeline=` — the pipeline should apply automatically.

## Task 6. Dashboards

In **Discover** on the pattern `logs-app-*`:

- filter `parsed: true`;
- columns `method`, `path`, `status`;
- a saved search "Parsed nginx lines".

## Deliberate failure (optional)

Add `on_failure` to the pipeline:

```json
"on_failure": [
  {
    "set": {
      "field": "parse_error",
      "value": true
    }
  }
]
```

Index a line with a non-matching `message`. **What you'll see:** the document is stored with `parse_error` instead of being lost entirely.

## Summary

- Grok extracts structure from the text `message`.
- Set marks a successful parse or an error.
- The pipeline is attached via a query parameter or as the default in the template.

**Next:** the index lifecycle — [05-index-lifecycle-ism.md](05-index-lifecycle-ism.md).
