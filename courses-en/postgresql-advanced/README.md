# PostgreSQL — Advanced (administration)

Advanced level: **Patroni HA**, **partitioning**, **security**, **major upgrade**, **troubleshooting**, **Kubernetes (CloudNativePG)**, **RDS**.

**Format:** mega-course (~90–120 lines per lesson) — scenarios, runbook labs, links to ops/security/cloud. Plan: [`postgresql-path.md`](../postgresql-path.md).

**Prerequisites:** [`postgresql-intermediate`](../postgresql-intermediate/README.md).

## Specializations

| Course | Topic |
|---|---|
| [`postgresql-security`](../postgresql-security/README.md) | SCRAM, pgaudit, compliance baseline |
| [`postgresql-performance`](../postgresql-performance/README.md) | hypopg, auto_explain |
| [`postgresql-ops`](../postgresql-ops/README.md) | on-call, pgBackRest |

## Curriculum by phase

### HA and scaling

| # | Lesson |
|---|---|
| 01 | [Patroni and automatic failover](01-patroni-ha.md) |
| 02 | [Lab: Patroni + etcd (concept)](02-lab-patroni.md) |
| 03 | [Table partitioning](03-partitioning.md) |
| 04 | [Lab: declarative partitioning](04-lab-partitioning.md) |

### Performance and extensions

| # | Lesson |
|---|---|
| 05 | [Extensions and pg_stat_statements in depth](05-extensions.md) |
| 06 | [Lab: pg_trgm, pgstattuple](06-lab-extensions.md) |

### Security

| # | Lesson |
|---|---|
| 07 | [SSL, RLS, audit](07-security.md) |
| 08 | [Lab: RLS multi-tenant](08-lab-security.md) |

### Operations

| # | Lesson |
|---|---|
| 09 | [Major upgrade: pg_upgrade](09-major-upgrade.md) |
| 10 | [Lab: upgrade 16→17 (plan)](10-lab-upgrade.md) |
| 11 | [Troubleshooting: locks, deadlocks](11-troubleshooting.md) |
| 12 | [Lab: incident analysis](12-lab-troubleshooting.md) |

### Cloud and Kubernetes

| # | Lesson |
|---|---|
| 13 | [RDS, CloudNativePG, operators](13-cloud-k8s.md) |
| 14 | [Lab: CloudNativePG on mockctl](14-lab-cloudnativepg.md) |
| 15 | [Final project: DBA playbook](15-final-project.md) |
