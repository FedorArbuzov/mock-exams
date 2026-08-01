# OpenSearch — Basic

Basic level: **why a search engine for logs**, **index architecture**, **mapping and analyzers**, **Query DSL**, **aggregations**, **Bulk API**, **comparison with Loki and Elasticsearch**, **mini log-investigation project**.

**Prerequisites:** basic Linux and Docker ([`linux-basic`](../linux-basic/README.md) or [`linux-intermediate`](../linux-intermediate/README.md) — `docker compose`, `curl`, browser). Useful to complete [observability-basic](../observability-basic/README.md) (metrics + intro to logs).

**Locally:** [`deploy/opensearch`](../../deploy/opensearch/README.md) — `docker compose up -d`, from the host:

| Service | URL |
|--------|-----|
| OpenSearch API | [http://localhost:9200](http://localhost:9200) |
| OpenSearch Dashboards | [http://localhost:5601](http://localhost:5601) |

On the lab stand **`DISABLE_SECURITY_PLUGIN=true`** — `curl` without TLS or password (lab only). In production — FGAC, TLS, roles.

Smoke: `bash scripts/smoke.sh` in `deploy/opensearch`. Bulk sample: `bash scripts/bulk-sample.sh`.

**Next:** [`opensearch-intermediate`](../opensearch-intermediate/README.md) (ingest pipelines, ISM). Logs in Grafana — [`observability-intermediate`](../observability-intermediate/README.md) (Loki, [03-loki](../observability-intermediate/03-loki-logql.md)).

## How to read chapters

Each lesson is a **book chapter**, not a cheat sheet. Recommended order within a pair:

1. Read the **theory** (01, 02, 04…) — do not skip “common mistakes”.
2. Open the **lab** (03, 05…) with the stand up: `docker compose up -d` in `deploy/opensearch`.
3. Complete tasks **in order**; compare the JSON response with the “what you’ll see” block.
4. If the cluster does not respond — [`deploy/opensearch/README.md`](../../deploy/opensearch/README.md) (healthy, OOM, `vm.max_map_count`).

**Theory structure:** intro (work scenario) → what you’ll learn → concepts → stand example → mistakes → in production → summary → checklist.

**Lab structure:** goal → prerequisites → tasks 1…N (why / commands / what you’ll see) → success criteria.

**Time:** about **40–50 minutes** per “theory + lab” pair; [final project](13-final-project.md) — **2–3 hours**.

**Connection cheat sheet:**

| From | Address |
|--------|--------|
| Browser (Dashboards) | [localhost:5601](http://localhost:5601) |
| API from host | `http://localhost:9200` |
| Inside Docker network | `http://opensearch:9200` |

## Curriculum

### Fundamentals (01–03)

1. [Why OpenSearch: logs, search, Loki vs DB](01-why-opensearch.md)
2. [Architecture: cluster, index, shard, document](02-architecture.md)
3. [Lab: first index and document](03-lab-first-index.md)

### Mapping (04–05)

4. [Mapping and analyzers: text vs keyword](04-mapping-analyzers.md) · 5. [Lab: mapping and text analysis](05-lab-mapping.md)

### Search (06–07)

6. [Query DSL: match, bool, filter](06-query-dsl.md) · 7. [Lab: searching logs](07-lab-search.md)

### Aggregations (08–09)

8. [Aggregations: terms, date_histogram, metrics](08-aggregations.md) · 9. [Lab: aggregations on the stand](09-lab-aggregations.md)

### Logs and bulk (10–11)

10. [Logs and Bulk API: NDJSON, refresh](10-logs-bulk-api.md) · 11. [Lab: bulk logs](11-lab-bulk-logs.md)

### Comparison and finale (12–13)

12. [OpenSearch vs Loki vs Elasticsearch](12-vs-loki-elasticsearch.md)
13. [Final project: incident investigation](13-final-project.md)

## What you should end up with

- Explain **when logs belong in OpenSearch** vs **Loki** or **SQL**.
- Create an **index**, index a document, read **`_id`** and **`_source`**.
- Distinguish **`text`** and **`keyword`** fields in mapping.
- Write **`match`**, **`bool`**, **`filter`** queries (no scoring on filters).
- Build **terms** and **date_histogram** aggregations.
- Load logs via **`_bulk`** (NDJSON) and run **`_refresh`**.
- State trade-offs for **interview questions** (Loki labels vs inverted index).

## Examples

| Path | Purpose |
|------|------------|
| [`examples/search-queries.json`](examples/search-queries.json) | request bodies for labs 07 and 09 |
| [`examples/bulk-ndjson.sample`](examples/bulk-ndjson.sample) | bulk format for lab 11 |
