# 03. Lab: first index, document, and _id

## Lab goal

Bring up the OpenSearch stand, create an **index** with explicit settings, index a **document** via `POST` and `PUT`, read by **`_id`**, see metadata in the `_search` response.

## Prerequisites

- Docker, **2+ GB RAM** for the OpenSearch container.
- From the repo root:

```bash
cd deploy/opensearch
docker compose up -d
docker compose ps
bash scripts/smoke.sh
```

Details: [`deploy/opensearch/README.md`](../../deploy/opensearch/README.md).  
Theory: [02. Architecture](02-architecture.md).

---

## Task 1. Health and version

**Why:** confirm the API is reachable without auth.

```bash
curl -s http://localhost:9200/_cluster/health?pretty
curl -s http://localhost:9200/ | head -20
```

**What you'll see:** `"status" : "green"` or `"yellow"`; in the root response — `version.number` (2.x).

---

## Task 2. Create index `lab-first`

**Why:** set **1 shard, 0 replicas** for single-node.

```bash
curl -s -X PUT "http://localhost:9200/lab-first" \
  -H 'Content-Type: application/json' -d '{
  "settings": {
    "number_of_shards": 1,
    "number_of_replicas": 0
  }
}'
```

Verification:

```bash
curl -s -I http://localhost:9200/lab-first
curl -s "http://localhost:9200/_cat/indices/lab-first?v"
```

**What you'll see:** `acknowledged: true`; in cat — one index `lab-first`, `health` green.

---

## Task 3. POST — auto-generated _id

**Why:** typical ingest path without a known id upfront.

```bash
curl -s -X POST "http://localhost:9200/lab-first/_doc" \
  -H 'Content-Type: application/json' -d '{
  "@timestamp": "2026-05-18T12:00:00Z",
  "level": "info",
  "message": "lab started"
}'
```

Save **`_id`** and **`_version`** from the response.

**What you'll see:** `"result" : "created"`, a random `_id` (e.g. a base64-like string).

---

## Task 4. PUT — fixed _id

**Why:** idempotent write by business key.

```bash
curl -s -X PUT "http://localhost:9200/lab-first/_doc/event-001" \
  -H 'Content-Type: application/json' -d '{
  "@timestamp": "2026-05-18T12:01:00Z",
  "level": "warn",
  "message": "disk 80%"
}'

curl -s "http://localhost:9200/lab-first/_doc/event-001?pretty"
```

Repeat the same `PUT` with a different `message`.

**What you'll see:** second call — `"result" : "updated"`, `_version` increased; `_source` updated.

---

## Task 5. GET and _search

```bash
curl -s -X POST "http://localhost:9200/lab-first/_refresh"

curl -s -X GET "http://localhost:9200/lab-first/_search?pretty" \
  -H 'Content-Type: application/json' -d '{"query":{"match_all":{}},"size":10}'
```

**What you'll see:** `hits.total` ≥ 2; each hit has `_index`, `_id`, `_score`, `_source`.

---

## Task 6. Dashboards (optional)

1. Open [http://localhost:5601](http://localhost:5601).
2. **Management → Index Patterns** → Create `lab-first`, time field `@timestamp` (if prompted).
3. **Discover** — confirm documents are visible.

---

## Task 7. Delete a document

```bash
curl -s -X DELETE "http://localhost:9200/lab-first/_doc/event-001"
curl -s "http://localhost:9200/lab-first/_doc/event-001?pretty"
```

**What you'll see:** `"found" : false` on GET.

---

## Success criteria

- [ ] `_cluster/health` responds without an auth error
- [ ] Index `lab-first` created with 1 shard / 0 replicas
- [ ] POST returned `_id`, GET by that id finds the document
- [ ] PUT with explicit `_id` updates `_version`
- [ ] `_search` with `match_all` returns remaining documents

## Takeaways for work

- **POST** — auto `_id`; **PUT** — your `_id` for upsert
- After writes in tests — **`_refresh`** or wait ~1s
- Hit metadata: **`_index`**, **`_id`**, **`_source`**

Next lesson: [04. Mapping and analyzers](04-mapping-analyzers.md).
