# 08. Lab: cluster health and shards

## Setup

```bash
cd deploy/opensearch
docker compose up -d
bash scripts/smoke.sh
```

## Task 1. Cluster health

```bash
curl -s "http://localhost:9200/_cluster/health?pretty"
curl -s "http://localhost:9200/_cluster/health?level=indices&pretty" | head -60
```

Record: `status`, `number_of_nodes`, `active_primary_shards`, `relocating_shards`, `unassigned_shards`.

**What you'll see:** on a clean stack usually **yellow** (single-node, replicas not assigned) or **green** when all indices have `replicas: 0` and are interpreted correctly — rely on `unassigned_shards: 0` for primaries.

## Task 2. Cat API

```bash
curl -s "http://localhost:9200/_cat/nodes?v"
curl -s "http://localhost:9200/_cat/indices?v&s=index"
curl -s "http://localhost:9200/_cat/shards?v" | head -30
curl -s "http://localhost:9200/_cat/allocation?v"
```

**What you'll see:** one node `opensearch`, indices `logs-app-*`, `smoke-test`; in shards — `STARTED`, the pri/rep columns.

## Task 3. Index with replica=1 on a single node

```bash
curl -s -X PUT "http://localhost:9200/lab-replica-test" -H 'Content-Type: application/json' -d '{
  "settings": { "number_of_shards": 1, "number_of_replicas": 1 }
}'
sleep 3
curl -s "http://localhost:9200/_cat/shards/lab-replica-test?v"
curl -s "http://localhost:9200/_cluster/health?pretty" | grep -E 'status|unassigned'
```

**What you'll see:** the replica shard **UNASSIGNED**, `unassigned_shards` ≥ 1, cluster **yellow**.

Explain in your report why the replica was not assigned.

## Task 4. Return the test index to green

```bash
curl -s -X PUT "http://localhost:9200/lab-replica-test/_settings" -H 'Content-Type: application/json' \
  -d '{"index":{"number_of_replicas":0}}'
curl -s "http://localhost:9200/_cat/shards/lab-replica-test?v"
```

**What you'll see:** one primary, replicas 0 — the unassigned entry disappears.

## Task 5. Load and index size

```bash
for i in $(seq 1 50); do
  bash deploy/opensearch/scripts/bulk-sample.sh 2>/dev/null || true
done
curl -s "http://localhost:9200/_cat/indices/logs-app-*?v&h=index,docs.count,store.size"
```

Compare with [07-shards-replicas.md](07-shards-replicas.md): one shard per index, growing `store.size`.

## Task 6. Tabletop: red cluster

Without running it on the stack, describe the **red** scenario:

1. Loss of a data node holding the only primary without a replica.
2. `_cluster/health` → `status: red`, search over the affected indices is partially unavailable.
3. Actions: recover the node, restore a snapshot, reindex — **not** "just restart Dashboards".

Relationship: on **Kafka** lag the indexer falls behind, but the cluster stays yellow/green — the problem is in the consumer, not shard allocation ([kafka-intermediate/18-lab-lag-drill](../kafka-intermediate/18-lab-lag-drill.md)).

## Cleanup

```bash
curl -s -X DELETE "http://localhost:9200/lab-replica-test"
```

## Summary

- `_cluster/health` and `_cat/*` are the daily tools of an SRE.
- Yellow on a single node with `replicas: 1` is expected behavior.
- Red is an incident priority.

**Next:** [09-security-overview.md](09-security-overview.md).
