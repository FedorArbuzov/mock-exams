# 07. Shards, replicas, and routing

## Inside an index: Lucene shards

A logical OpenSearch **index** is a set of **primary shards** (each one a separate Lucene index on disk). A document lands in a shard by the hash of `_routing` (by default `_id`):

```text
shard_num = hash(_routing) % number_of_primary_shards
```

After an index is created, **`number_of_shards` does not change** without reindex/split/shrink (heavy operations). So you plan shards **before** the first production traffic.

## How many shards for logs

A rule of thumb (not dogma): one primary shard — **20–50 GB** of data under search load; for time-series sometimes **fewer** shards and **more** indices (daily).

| Situation | Recommendation for a lab / small cluster |
|----------|-------------------------------------|
| Single-node, training logs | `number_of_shards: 1` |
| Terabytes per day | Several shards **or** rollover to new indices |
| Too many tiny shards | Overhead on cluster state and merges |

On the stack the template sets **1 shard** — enough for `bulk-sample` and Discover.

## Replicas

A **replica shard** is a copy of a primary on **another** node. It provides:

- reads at `green` (search distribution);
- fault tolerance when a node fails.

| `number_of_replicas` | Single-node |
|----------------------|-------------|
| `0` | The index may be **yellow** (no replicas) — **normal** for a lab |
| `1` | You need **≥2** data nodes, otherwise the replica is **unassigned** → yellow |

In [`deploy/opensearch/docker-compose.yml`](../../deploy/opensearch/docker-compose.yml) there is one node — in the template and smoke tests, **replicas: 0**.

## Cluster states

| Status | Meaning |
|--------|----------|
| **green** | All primaries and replicas assigned |
| **yellow** | All primaries present, not all replicas (or replicas=0 on a single node — often yellow) |
| **red** | At least one primary is **unassigned** — loss or unavailability of shard data |

`active_shards_percent_as_number` in `_cluster/health` is a quick KPI.

## Allocation and disk

When the disk fills to the watermark (`flood_stage`), the cluster puts a **read-only block** on indices — see troubleshooting in [deploy/opensearch/README.md](../../deploy/opensearch/README.md). This is not an "ISM bug" but protection against corruption.

Linux host: `vm.max_map_count` for the OpenSearch JVM — in the stack README.

## Kafka and ingest load

Kafka producers scale by partition; the **indexer** into OpenSearch must keep up with bulking. Bottlenecks:

- too many tiny bulks;
- heavy Grok ingest on the coordinator;
- a too-aggressive refresh_interval (`1s` vs `30s`).

Kafka lag metrics — [kafka-intermediate/17-monitoring](../kafka-intermediate/17-monitoring.md); index sizes — `_cat/indices` and ISM.

## Multi-node (overview)

In Kubernetes, OpenSearch often runs as a StatefulSet ([kuber-intermediate/01-statefulset](../kuber-intermediate/01-statefulset.md)): stable pod names, a PVC per shard. Zone awareness: `awareness.attributes: zone` and `routing.allocation.awareness.attributes` — replicas in different AZs.

## Checklist

- [ ] You explain the difference between **primary** and **replica**.
- [ ] You understand why `replicas: 0` on a single node.
- [ ] You know that red = loss of a primary, not "just yellow".

**Next:** [08. Lab: cluster health](08-lab-cluster-health.md).
