# 13. RDS, Aurora, CloudNativePG

## Real-world scenario

A startup "moves to AWS" — they bring up Postgres on EC2 with Patroni. A year later DevOps is tired of manually patching minors, backups, and Multi-AZ. Migration to **RDS**. In parallel, the K8s team deploys the shop API in `mockctl` — a StatefulSet Postgres without an operator breaks on failover. **CloudNativePG** provides HA like a managed service inside the cluster.

This chapter is about **platform choice**: self-hosted vs managed vs operator.

## What you'll learn

- RDS vs self-hosted: limitations and pros
- Aurora at a high level
- CloudNativePG and alternatives
- When a StatefulSet without an operator isn't enough

## Amazon RDS for PostgreSQL

| | Self-hosted (Patroni) | RDS PostgreSQL |
|---|---------------------|----------------|
| Minor patches | You | Maintenance window |
| Backups / PITR | pgBackRest, WAL-G | Automated snapshots |
| Multi-AZ HA | Patroni + DCS | AWS failover (DNS) |
| Superuser | Full | `rds_superuser` restricted |
| PGDATA filesystem | Yes | No access |
| `pg_hba.conf` | File | Parameter groups (partially) |
| Extensions | Any | Allowlist |
| Cost | Infra + time | $$$, less ops |

**Parameter groups** — `shared_buffers`, `log_*`, `max_connections`.  
**Read replicas** — separate endpoints for reports.  
**Security groups** — networking instead of hba CIDR.

Related: [aws-intermediate/13-rds-private](../aws-intermediate/13-rds-private.md).

## Aurora PostgreSQL

- Storage is **separate** from compute (6 copies, auto-grow).
- Failover replica promote — seconds (usually).
- Wire protocol compatible with Postgres; **not** 100% feature parity — check the release notes.
- Serverless v2 — scale compute.

When Aurora vs RDS Postgres: high write throughput, many replicas, need a fast-failover storage layer.

## CloudNativePG (Kubernetes)

An operator from EDB for Postgres in K8s:

```yaml
apiVersion: postgresql.cnpg.io/v1
kind: Cluster
metadata:
  name: pg-cluster
  namespace: databases
spec:
  instances: 3
  storage:
    size: 10Gi
  postgresql:
    parameters:
      max_connections: "100"
  backup:
    barmanObjectStore:
      destinationPath: s3://bucket/path
      s3Credentials:
        inheritFromIAMRole: true
```

| Capability | CNPG |
|-------------|------|
| HA / failover | Auto, Patroni-like |
| Services | `-rw` (primary), `-ro` (replicas), `-r` (any) |
| Backup PITR | S3/Azure/GCS via barman |
| Pooler | PgBouncer integrated (optional) |

Related: [kuber-intermediate](../kuber-intermediate/README.md) StatefulSet, [14-lab-cloudnativepg](14-lab-cloudnativepg.md).

## Alternative operators

| Operator | Notes |
|----------|-------------|
| **Zalando Postgres Operator** | Spilo, PATRONI, acid manifest |
| **Crunchy PGO** | pgBackRest native, enterprise support |
| **StackGres** | All-in-one, extensions |

## Why not a "bare" StatefulSet

```text
StatefulSet + PVC + one Postgres
```

| Problem | Without an operator |
|----------|--------------|
| Failover | Manual promote |
| Replica join | Manual basebackup |
| Backup | Sidecar scripts |
| Version upgrade | Custom job |
| Secret rotation | Manual |

An operator encodes the runbook in a CRD.

## Platform choice

| Environment | Recommendation |
|-------|--------------|
| mock-exams learning | Docker compose [`deploy/postgres`](../../deploy/postgres/README.md) |
| K8s production app | CloudNativePG / PGO |
| AWS enterprise, little K8s | RDS / Aurora |
| Maximum control, compliance | Patroni on VMs / bare metal ([01-patroni-ha](01-patroni-ha.md)) |
| Serverless experiments | Aurora Serverless, Neon (out of scope) |

## Common mistakes

1. RDS with an expectation of full superuser — migrations with `CREATE EXTENSION` break.
2. CNPG with 1 instance "to save money" — no HA.
3. A read replica for writes — replication lag, errors.
4. Aurora "like Postgres" without checking the extension list.

## Checklist

- [ ] RDS — access to the pg_hba file? (no, parameter groups)
- [ ] CNPG — how many instances for quorum HA? (≥ 2, better 3)
- [ ] Aurora storage vs EBS for RDS
- [ ] Why not a StatefulSet without an operator
- [ ] Read endpoint — SELECT only

## Next

Lab: [14-lab-cloudnativepg.md](14-lab-cloudnativepg.md).
