# OpenSearch — Intermediate

Intermediate course on **OpenSearch 2.x**: **index templates**, **ingest pipelines** (Grok, Set), **Index State Management (ISM)**, **shards and replicas**, **cluster health**, an overview of **security (FGAC, TLS)**, **Amazon OpenSearch Service**, and a **final project** in the style of an ELK pipeline.

Format — "book-style" chapters: theory → hands-on lab on the local stack [`deploy/opensearch`](../../deploy/opensearch/README.md).

## Who this is for

- You understand what an **index**, **document**, **mapping**, and basic **search DSL** are (the level of [opensearch-basic](../opensearch-basic/README.md) or an equivalent from the Elastic/OpenSearch documentation).
- You can work with `curl` and Docker Compose.
- Useful in parallel: [kafka-intermediate](../kafka-intermediate/README.md) (log stream, Connect) and [observability-intermediate](../observability-intermediate/README.md) (metrics vs logs, Loki).

## Stack

```bash
cd deploy/opensearch
docker compose up -d
docker compose ps
```

| Service | URL |
|--------|-----|
| OpenSearch API | http://localhost:9200 |
| OpenSearch Dashboards | http://localhost:5601 |

On the training stack **`DISABLE_SECURITY_PLUGIN=true`** — the API runs without TLS or a password. This is unacceptable in production; see [09-security-overview.md](09-security-overview.md).

**Resources:** Docker **2+ GB RAM**; the first cluster start takes 40–90 s to become `healthy`.

```bash
bash deploy/opensearch/scripts/smoke.sh
bash deploy/opensearch/scripts/bulk-sample.sh
```

## Related courses and stacks

| Course / stack | Why |
|--------------|-------|
| [kafka-intermediate](../kafka-intermediate/README.md) | The **log aggregation** pattern: topic → consumer/indexer → OpenSearch ([kafka-basic/12-patterns](../kafka-basic/12-patterns.md)); Connect — [15-kafka-connect](../kafka-intermediate/15-kafka-connect.md). |
| [observability-intermediate](../observability-intermediate/README.md) | **Metrics** (Prometheus) and **logs** (Loki) — separating the pillars; Loki vs ELK comparison — [03-loki-logql](../observability-intermediate/03-loki-logql.md). |
| [observability-basic/11-logs-preview](../observability-basic/11-logs-preview.md) | Why centralize logs before choosing a stack. |
| [aws-basic/07-databases](../aws-basic/07-databases.md) | Managed OpenSearch on AWS. |
| [aws-advanced](../aws-advanced/README.md) | VPC, PrivateLink, KMS — for an isolated OpenSearch domain in the cloud. |

## Curriculum

| № | Theory | Lab |
|---|--------|------|
| 01 | [Index templates and mappings](01-index-templates.md) | [02](02-lab-templates.md) |
| 03 | [Ingest pipelines: Grok, Set](03-ingest-pipelines.md) | [04](04-lab-ingest-pipeline.md) |
| 05 | [ISM: index lifecycle](05-index-lifecycle-ism.md) | [06](06-lab-ism-rollover.md) |
| 07 | [Shards, replicas, routing](07-shards-replicas.md) | [08](08-lab-cluster-health.md) |
| 09 | [Security: FGAC, TLS](09-security-overview.md) | tabletop |
| 10 | [Managed: Amazon OpenSearch Service](10-managed-opensearch.md) | — |
| 11 | [Final project: ingest + dashboard + ISM](11-final-project.md) | — |

## Examples in the repository

| Path | Purpose |
|------|------------|
| [examples/index-template-logs.json](examples/index-template-logs.json) | Template for `logs-app-*` |
| [examples/ism-policy-snippet.json](examples/ism-policy-snippet.json) | Shortened ISM policy |
| [`deploy/opensearch/examples/ingest-pipeline-nginx.json`](../../deploy/opensearch/examples/ingest-pipeline-nginx.json) | Pipeline: Grok on the `message` field |
| [`deploy/opensearch/examples/ism-logs-policy.json`](../../deploy/opensearch/examples/ism-logs-policy.json) | ISM: hot → delete after 7d |

## Time estimate

| Block | Hours |
|------|------|
| Templates + ingest (01–04) | 4–5 |
| ISM + cluster (05–08) | 4–5 |
| Security + managed (09–10) | 2–3 |
| Final project (11) | 3–5 |
| **Total** | **~13–18 h** |

## Graduate checklist

- [ ] You create an **index template** with mapping and settings; you understand `priority` and `index_patterns`.
- [ ] You register an **ingest pipeline**, apply **Grok** and **Set**, and check `_ingest`.
- [ ] You write an **ISM policy** (states, transitions, `ism_template`) and explain how it differs from "manual" index deletion.
- [ ] You read **`_cluster/health`**, **`_cat/shards`**, and connect yellow/red to replicas and disk.
- [ ] You describe **FGAC**, TLS, and Dashboards roles (without disabling security in prod).
- [ ] You build an **end-to-end pipeline**: raw logs → ingest → search in Dashboards → ISM.

## Next

- Going deeper into the cluster (multi-node, snapshot, cross-cluster) — a separate advanced track.
- An alternative for logs on the same observability stack — Loki + Promtail ([observability-intermediate](../observability-intermediate/README.md)).
