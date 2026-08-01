# 13. Final project: investigating an incident from logs

## Intro: put basic together in one loop

Separately you can do mapping, bool search, aggregations, and bulk. The **finale** is a coherent **mini on-call** on [`deploy/opensearch`](../../deploy/opensearch/README.md): load logs, find the root of a 5xx spike, build aggregations, write a report. No new services — only API **localhost:9200**, Dashboards **5601**, `curl`, and stand scripts.

## What you'll learn (course outcome)

- Run an **investigation** from symptom to hypothesis using logs.
- Combine **bulk**, **search**, **aggs** in one scenario.
- Document a **timeline** and queries for handoff to the next shift.

## Requirements

| # | Requirement | Criterion |
|---|------------|----------|
| 1 | Stand | `docker compose up -d`, `smoke.sh` OK |
| 2 | Data | `bulk-sample.sh` + **≥ 10** of your own bulk events (errors, warn, different services) |
| 3 | Mapping | explicit index `logs-incident-*` **or** justified dynamic + `.keyword` |
| 4 | Search | at least 3 saved Query DSL queries (bool + filter + match) |
| 5 | Aggregations | `terms` by service + `date_histogram` or filter sub-agg |
| 6 | Dashboards | index pattern + **Discover** saved search or screenshot |
| 7 | Document | `PROJECT.md` per template below |
| 8 | Comparison (optional) | 1 paragraph: same scenario in **Loki** — [03-loki](../observability-intermediate/03-loki-logql.md) |

---

## Scenario

**14:00** — monitoring (assume Prometheus) showed a 5xx rise on `api`. Logs go to OpenSearch index `logs-app-*`. Your job: **when it started**, **how many** errors per `service`, **one example** message line for escalation to engineering.

---

## Phase 1. Prepare the stand

```bash
cd deploy/opensearch
docker compose up -d
bash scripts/smoke.sh
bash scripts/bulk-sample.sh
```

Verify:

```bash
curl -s http://localhost:9200/_cluster/health?pretty
curl -s "http://localhost:9200/_cat/indices/logs-*?v"
```

---

## Phase 2. Extend the data

Create bulk NDJSON (≥ 10 documents) with fields:

- `@timestamp` — spread within **1 hour**
- `level` — at least **3 error** on `service: api`
- `status` — 500 on errors
- `message` — unique phrases for `match`

Index: `logs-incident-20260518` (or today’s date).

```bash
curl -sf -X POST "http://localhost:9200/_bulk" \
  -H 'Content-Type: application/x-ndjson' \
  --data-binary @YOUR-BULK.ndjson
curl -sf -X POST "http://localhost:9200/logs-incident-*/_refresh"
```

Format sample: [`examples/bulk-ndjson.sample`](examples/bulk-ndjson.sample).

---

## Phase 3. Investigation (required queries)

### 3.1 Symptom — all errors in an hour

```json
{
  "query": {
    "bool": {
      "filter": [
        { "term": { "level.keyword": "error" } },
        { "range": { "@timestamp": { "gte": "2026-05-18T13:00:00Z", "lte": "2026-05-18T15:00:00Z" } } }
      ]
    }
  },
  "sort": [{ "@timestamp": "asc" }],
  "size": 20
}
```

Record the **time of the first** error in `PROJECT.md`.

### 3.2 Slice by service

Use [`examples/search-queries.json`](examples/search-queries.json) → `agg_terms_with_sub_metric`.

### 3.3 Full text

`match` on `message` with a keyword from your scenario (e.g. `orders` or `timeout`).

Save three queries in `PROJECT-queries.json`.

---

## Phase 4. Dashboards

1. Index pattern: `logs-incident-*` or `logs-*`.
2. **Discover**: filter `level: error`, columns `@timestamp`, `service`, `message`, `status`.
3. (Bonus) **Visualization** — Terms on `service.keyword`.

---

## Phase 5. Runbook (template)

In `PROJECT.md` section **Runbook: spike 5xx in logs**:

1. **Symptom:** 5xx rise / alert `HighErrorRate` (assumed).
2. **Check:** `_cluster/health`, `_cat/indices` — not red, not read-only.
3. **Search:** bool filter `level:error` + range `@timestamp`.
4. **Analytics:** terms by `service`, find the leader.
5. **Detail:** match on `message`, copy `_id` and `_source` into the ticket.
6. **Escalate:** if > N errors/min — engineering + [link to trace/metrics].

---

## PROJECT.md template

```markdown
# OpenSearch Basic — Final Project

## Author / date

## Stand
- compose, Docker RAM
- security: DISABLE_SECURITY_PLUGIN (lab only)

## Data
- Indexes: logs-app-*, logs-incident-*
- Document count ( _count )

## Timeline UTC
- First error: ...
- Peak (from agg): ...

## Queries (PROJECT-queries.json)
| # | Goal | Brief result |
|---|------|-------------------|
| 1 | all errors in window | N hits |
| 2 | terms by service | api: X errors |
| 3 | match message | sample _source |

## Aggregations
- Finding: which service is at fault, doc_count

## Dashboards
- Index pattern, saved search / screenshot

## Runbook
- (paste section)

## Loki comparison (optional)
- Which LogQL selector would replace the bool filter

## Conclusions
- 3 bullets: takeaways for work
```

---

## Grading criteria (self-check)

- [ ] Bulk and refresh completed without `errors: true`
- [ ] Time of first error and sample message found
- [ ] `terms` agg shows the dominant `service`
- [ ] Three DSL queries saved and reproducible
- [ ] Runbook is readable without verbal explanation
- [ ] Link to [`deploy/opensearch/README.md`](../../deploy/opensearch/README.md) is clear

## Next

- [`opensearch-intermediate`](../opensearch-intermediate/README.md) — ingest pipeline, ISM
- [`observability-intermediate`](../observability-intermediate/README.md) — Loki, correlation with metrics
- [`observability-basic`](../observability-basic/README.md) — RED and metric alerts

Congratulations on completing **OpenSearch — Basic**.
