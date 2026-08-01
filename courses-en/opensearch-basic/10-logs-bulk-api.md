# 10. Logs and Bulk API: NDJSON, refresh

## Intro: “one POST for a thousand lines”

A log agent sends **thousands of events per second**. A separate HTTP `POST /_doc` per line means latency and load on the cluster. **Bulk API** packs operations into one body in **NDJSON** format (newline-delimited JSON): action line, source line, repeat. After an evening bulk, the engineer runs **`_refresh`** and sees documents in Discover. This chapter is log ingest the way the stand’s [`scripts/bulk-sample.sh`](../../deploy/opensearch/scripts/bulk-sample.sh) works.

## What you'll learn

- **`_bulk`** format: `index`, `create`, `update`, `delete`.
- **Content-Type** and `--data-binary` in curl.
- **`refresh`** parameters, explicit **`POST /index/_refresh`**.
- Naming log indexes **`logs-app-YYYYMMDD`**.

## One document vs bulk

| | POST /index/_doc | POST /_bulk |
|---|------------------|-------------|
| Volume | 1 document | thousands per request |
| Overhead | high | low |
| Response | one `_id` | `items[]`, `errors` flag |
| Labs | mapping, search | realistic logs |

## NDJSON format

Each operation is **two lines** (minimum for index):

```text
{"index":{"_index":"logs-app-20260518","_id":"optional-id"}}
{"@timestamp":"2026-05-18T10:00:01Z","level":"info","message":"..."}
```

Rules:

- One JSON record = **one line**, terminated by `\n`.
- The last line also needs `\n`.
- Do not pretty-print a bulk body as one multi-line JSON.

Sample in the repo: [`examples/bulk-ndjson.sample`](examples/bulk-ndjson.sample).

## curl

```bash
curl -sf -X POST "http://localhost:9200/_bulk" \
  -H 'Content-Type: application/x-ndjson' \
  --data-binary @examples/bulk-ndjson.sample
```

`--data-binary` preserves newlines; without it bulk breaks.

Ready script on the stand:

```bash
cd deploy/opensearch
bash scripts/bulk-sample.sh
```

Variables: `OS` (default `http://localhost:9200`), `IDX` (default `logs-app-$(date +%Y%m%d)`).

## Bulk response

```json
{
  "errors": false,
  "items": [
    { "index": { "_index": "...", "_id": "...", "status": 201, "result": "created" } }
  ]
}
```

| status | Meaning |
|--------|----------|
| 201 | created |
| 200 | updated (retry with same _id) |
| 409 | version conflict |

When `errors: true` — inspect `items[].index.error` (mapping conflict, disk full).

## Refresh and visibility

After bulk, documents may **not be immediately** in search. Options:

| Method | When |
|--------|-------|
| `POST /index/_refresh` | labs, tests |
| `?refresh=wait_for` on bulk | wait in the same request |
| default periodic refresh | ~1s in background |

```bash
curl -sf -X POST "http://localhost:9200/logs-app-20260518/_refresh"
```

Do **not** set `refresh=true` on every production bulk — load on the cluster.

## Mapping before bulk

For predictable fields, create the index **before** the first line (see [04. Mapping](04-mapping-analyzers.md)) or use a template. Script `bulk-sample.sh` writes to a **new** daily index — dynamic mapping works for training fields `level`, `service`, `message`, `status`, `bytes`.

## Indexing nginx-style logs

Typical fields (as in bulk-sample):

| Field | Type (recommendation) |
|------|---------------------|
| `@timestamp` | date |
| `level` | text + keyword |
| `service` | keyword |
| `message` | text |
| `status` | integer |
| `bytes` | long |

**Ingest** pipelines (grok, rename) — [opensearch-intermediate](../opensearch-intermediate/README.md).

## Search after bulk

```bash
curl -s "http://localhost:9200/logs-app-*/_search?q=level:error&pretty"
curl -s -X GET "http://localhost:9200/logs-app-*/_search" \
  -H 'Content-Type: application/json' -d '{"size":5,"sort":[{"@timestamp":"desc"}]}'
```

Wildcard `logs-app-*` — all daily indexes (careful with performance on huge clusters; in production — **alias**).

## Common mistakes

| Mistake | Symptom | Fix |
|--------|---------|-------------|
| One JSON instead of NDJSON | 400 parse error | two lines per document |
| Forgot trailing `\n` | partial parse | trailing newline |
| `Content-Type: application/json` | sometimes OK, risky | `application/x-ndjson` |
| Huge bulk file | timeout | batches 5–15 MB |
| Index out of space | 429 / cluster_block | disk watermark, ISM |

## In production

- **Bulk thread pool** — monitor `rejected` count.
- **Ingest node** + pipeline instead of preprocessing on the agent (where appropriate).
- **Data streams** (Elasticsearch 7.9+, OpenSearch analogs) — simplify rollover.
- Agents: **Fluent Bit** `opensearch` output, **Vector** `elasticsearch` sink.
- HTTP **compression** for large bodies (intermediate).

## Interview notes

- Bulk is **not** one big transaction: some items can fail.
- **Idempotent** ingest: stable `_id` (line hash) against duplicates.
- **Near real-time** — refresh, not fsync.
- Loki accepts **streams**, not bulk NDJSON — different ingest model.

## Summary

Bulk API is the standard for loading logs: **NDJSON**, action line + source line, batches via curl or an agent. After a training bulk — **`_refresh`** and search on `logs-app-*`. Next lab repeats the stand script and extends the data.

## Checklist

- How many NDJSON lines per indexed document?
- Why `--data-binary`?
- What does `bulk-sample.sh` do on the stand?
- Why not refresh=true on every bulk in production?

Next lesson: [11. Lab: bulk logs](11-lab-bulk-logs.md).
