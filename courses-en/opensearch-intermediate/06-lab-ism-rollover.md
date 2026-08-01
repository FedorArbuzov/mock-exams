# 06. Lab: ISM — policy, accelerated deletion, rollover overview

## Setup

```bash
cd deploy/opensearch && docker compose up -d
curl -s http://localhost:9200/_cluster/health?pretty | grep status
```

The template `logs-app` from [02-lab-templates.md](02-lab-templates.md) is recommended.

## Task 1. Create an ISM policy

```bash
curl -s -X PUT "http://localhost:9200/_plugins/_ism/policies/lab-logs-delete" \
  -H 'Content-Type: application/json' \
  -d @deploy/opensearch/examples/ism-logs-policy.json
```

Verification:

```bash
curl -s "http://localhost:9200/_plugins/_ism/policies/lab-logs-delete?pretty" | head -40
```

**What you'll see:** policy id `lab-logs-delete`, states `hot` and `delete`, a template on `logs-app-*`.

> The policy name in the URL (`lab-logs-delete`) may differ from the internal `_id` in the response — rely on the API response.

## Task 2. An index "older than the policy"

For a quick check, create the policy **`lab-logs-fast`** — a copy of the reference with `min_index_age: "1m"`:

```bash
curl -s -X PUT "http://localhost:9200/_plugins/_ism/policies/lab-logs-fast" \
  -H 'Content-Type: application/json' \
  -d '{
  "policy": {
    "description": "Lab: delete after 1 minute",
    "default_state": "hot",
    "states": [
      {
        "name": "hot",
        "actions": [],
        "transitions": [{ "state_name": "delete", "conditions": { "min_index_age": "1m" } }]
      },
      { "name": "delete", "actions": [{ "delete": {} }], "transitions": [] }
    ],
    "ism_template": [{ "index_patterns": ["logs-lab-fast-*"], "priority": 110 }]
  }
}'
```

Create an index and a document:

```bash
curl -s -X PUT "http://localhost:9200/logs-lab-fast-001" \
  -H 'Content-Type: application/json' \
  -d '{"settings":{"number_of_shards":1,"number_of_replicas":0}}'
curl -s -X POST "http://localhost:9200/logs-lab-fast-001/_doc" \
  -H 'Content-Type: application/json' \
  -d '{"@timestamp":"2026-05-18T12:00:00Z","message":"ism test"}'
```

After 2–5 minutes:

```bash
curl -s "http://localhost:9200/_plugins/_ism/explain/logs-lab-fast-001?pretty"
curl -s -o /dev/null -w "%{http_code}" "http://localhost:9200/logs-lab-fast-001"
```

**What you'll see:** in `explain` — the transition to `delete`; HTTP **404** on the index (deleted).

## Task 3. Reference 7d policy on `logs-app-*`

```bash
bash deploy/opensearch/scripts/bulk-sample.sh
IDX=$(date +%Y%m%d)
curl -s "http://localhost:9200/_plugins/_ism/explain/logs-app-${IDX}?pretty"
```

**What you'll see:** the index in state `hot`, policy `lab-logs-delete` (or the one attached via template), a transition with `min_index_age: "7d"`.

Don't wait 7 days on the lab — a screenshot of `explain` is enough.

## Task 4. Tabletop: rollover (without running it on single-node)

Describe the **rollover** scenario in 5–8 sentences:

1. Alias `logs-app-write` → index `logs-app-000001`.
2. Rollover condition: `max_primary_shard_size: 10gb` or `max_age: 1d`.
3. After rollover, writes go to `logs-app-000002`.
4. ISM transitions `000001` to warm/delete.

Useful APIs (for reference, not required on the stack):

```text
POST logs-app-write/_rollover
PUT  _index_template/...  →  "rollover_alias": "logs-app-write"
```

Relationship to Kafka: on a burst of logs, **rollover** fires before the calendar day — see [kafka-intermediate/21-capacity](../kafka-intermediate/21-capacity.md).

## Task 5. Dashboards Index Management

**OpenSearch Dashboards → Index Management → Indices** — find `logs-app-*`, the **State** / **Managed by policy** column.

## Cleanup

```bash
curl -s -X DELETE "http://localhost:9200/_plugins/_ism/policies/lab-logs-fast"
curl -s -X DELETE "http://localhost:9200/_plugins/_ism/policies/lab-logs-delete"
```

(Deleting a policy does not restore already deleted indices.)

## Summary

- ISM automates **delete** (and other actions) by index age.
- `ism_template` links a policy to `logs-app-*`.
- Rollover is a separate mechanism for a **write alias**, complementing ISM in prod.

**Next:** [07-shards-replicas.md](07-shards-replicas.md).
