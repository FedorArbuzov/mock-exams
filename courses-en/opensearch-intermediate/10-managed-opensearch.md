# 10. Amazon OpenSearch Service (managed)

## Why managed if we have Docker

Self-hosted OpenSearch ([`deploy/opensearch`](../../deploy/opensearch/README.md)) gives full control and zero cost on a laptop. **Amazon OpenSearch Service** (formerly Elasticsearch Service) takes on:

- provisioning data nodes and (optionally) a dedicated master;
- patching the engine version;
- multi-AZ and automated snapshots to S3;
- integration with **IAM**, **VPC**, **CloudWatch**, **KMS**.

You pay for instance hours, storage (EBS), and outbound traffic — see the calculator and [aws-advanced/25-cost-optimization](../aws-advanced/25-cost-optimization.md).

## Domain architecture

```text
                    ┌─────────────────────────────┐
  App / Lambda      │  VPC domain endpoint        │
  (private subnet)──►  HTTPS :443                 │
                    │  FGAC / IAM optional        │
                    └─────────────┬───────────────┘
                                  │
                    ┌─────────────▼───────────────┐
                    │  Data nodes (r6g, etc.)     │
                    │  EBS gp3                    │
                    └─────────────┬───────────────┘
                                  │ automated snapshot
                    ┌─────────────▼───────────────┐
                    │  S3 (service-linked)        │
                    └─────────────────────────────┘
```

| Decision at creation | Recommendation |
|----------------------|--------------|
| **VPC vs public** | Production: **VPC only**, no public access |
| **Dedicated master** | Clusters from ~6 data nodes or heavy search |
| **Zone awareness** | `3 AZ` for production |
| **Instance type** | Memory-optimized (r6g) for an indexing/search mix |
| **UltraWarm / Cold** | Old indices are cheaper (analog of a warm tier) |

An overview of managed DBs on AWS — [aws-basic/07-databases](../aws-basic/07-databases.md) (the OpenSearch row for full-text).

## Network and access

- The domain in a **private subnet**; applications in the same VPC or via **VPC peering / Transit Gateway** ([aws-advanced/07-transit-gateway](../aws-advanced/07-transit-gateway.md)).
- An **Interface VPC endpoint** to call the API without going out to the internet — conceptually next to PrivateLink ([aws-advanced/09-route53-privatelink](../aws-advanced/09-route53-privatelink.md)).
- Security group: ingress **only** from the applications' SG and a bastion; not `0.0.0.0/0`.

## Security in the cloud

| Layer | Practice |
|------|----------|
| Transport | HTTPS enforced |
| Auth | **Fine-grained access control** + a master user in Secrets Manager **or** IAM SigV4 for programmatic access |
| Encryption at rest | KMS CMK ([aws-advanced/19-kms-advanced](../aws-advanced/19-kms-advanced.md)) |
| Encryption in transit | TLS 1.2+ |
| Audit | CloudTrail for the domain management API; OpenSearch audit logs in CloudWatch Logs |

Compare with [09-security-overview.md](09-security-overview.md): the same FGAC roles, but the master user is not in the repository's `.env`.

## Ingest on AWS

| Source | Path |
|----------|------|
| CloudWatch Logs subscription | Lambda → bulk OpenSearch |
| Kinesis Data Firehose | Managed delivery, buffering, retry |
| MSK / self-hosted Kafka | Lambda, Flink, or a **Kafka Connect** OpenSearch sink |
| S3 | S3 event → Lambda |

The "Kafka as a buffer" pattern — [kafka-intermediate](../kafka-intermediate/README.md); Firehose — a managed alternative without your own consumer group.

## ISM and templates

The API is **compatible** with the local stack: the same `_index_template`, `_plugins/_ism/policies`. Policies from [examples/ism-policy-snippet.json](examples/ism-policy-snippet.json) port over, accounting for **real** retention (30/90 days) and a **snapshot** state before delete.

## Observability of a managed domain

- **CloudWatch metrics:** `ClusterStatus.red`, `FreeStorageSpace`, `CPUUtilization`, `JVMMemoryPressure`.
- **Alerts** — SNS → PagerDuty (like Alertmanager in [observability-intermediate/09-alertmanager-routing](../observability-intermediate/09-alertmanager-routing.md)).
- **Logs** of OpenSearch itself — in CloudWatch Logs; do not confuse with the indexed application logs.

Separation: domain **metrics** in CloudWatch, **application logs** — in OpenSearch indices or in parallel to S3 for compliance.

## When Loki, when OpenSearch

| Criterion | OpenSearch Service | Loki (+ Prometheus) |
|----------|-------------------|---------------------|
| Full text, complex DSL | Strong point | Weaker |
| A single stack with AWS | Native | Standalone Helm |
| Cost at high volume | Higher with poor ISM/shard design | Lower with label discipline |
| Team knows Kibana/Dashboards | Yes | Grafana |

More details — [observability-intermediate/03-loki-logql](../observability-intermediate/03-loki-logql.md).

## Migration lab → AWS (overview)

1. Bring up a 2.x domain, enable FGAC.
2. `PUT _index_template` and ISM from the repository.
3. Switch the ingest endpoint (Firehose / Connect).
4. Reindex historical data if needed (`_reindex` remote → local).
5. Dashboards saved objects export/import.

## Checklist

- [ ] You understand the managed vs self-hosted trade-off.
- [ ] You named three network/security requirements for a VPC domain.
- [ ] You connected Kafka/Firehose ingest to the kafka-intermediate course.

**Next:** [11-final-project.md](11-final-project.md).
