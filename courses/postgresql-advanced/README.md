# PostgreSQL — Advanced (администрирование)

Продвинутый уровень: **Patroni HA**, **партиционирование**, **безопасность**, **major upgrade**, **troubleshooting**, **Kubernetes (CloudNativePG)**, **RDS**.

**Формат:** мегакурс (~90–120 строк на урок) — сценарии, runbook-лабы, связь с ops/security/cloud. План: [`postgresql-path.md`](../postgresql-path.md).

**Предварительно:** [`postgresql-intermediate`](../postgresql-intermediate/README.md).

## Специализации

| Курс | Тема |
|---|---|
| [`postgresql-security`](../postgresql-security/README.md) | SCRAM, pgaudit, compliance baseline |
| [`postgresql-performance`](../postgresql-performance/README.md) | hypopg, auto_explain |
| [`postgresql-ops`](../postgresql-ops/README.md) | on-call, pgBackRest |

## Программа по фазам

### HA и масштабирование

| # | Урок |
|---|---|
| 01 | [Patroni и автоматический failover](01-patroni-ha.md) |
| 02 | [Лаба: Patroni + etcd (концепт)](02-lab-patroni.md) |
| 03 | [Партиционирование таблиц](03-partitioning.md) |
| 04 | [Лаба: declarative partitioning](04-lab-partitioning.md) |

### Performance и расширения

| # | Урок |
|---|---|
| 05 | [Расширения и pg_stat_statements углублённо](05-extensions.md) |
| 06 | [Лаба: pg_trgm, pgstattuple](06-lab-extensions.md) |

### Security

| # | Урок |
|---|---|
| 07 | [SSL, RLS, аудит](07-security.md) |
| 08 | [Лаба: RLS multi-tenant](08-lab-security.md) |

### Operations

| # | Урок |
|---|---|
| 09 | [Major upgrade: pg_upgrade](09-major-upgrade.md) |
| 10 | [Лаба: upgrade 16→17 (план)](10-lab-upgrade.md) |
| 11 | [Troubleshooting: locks, deadlocks](11-troubleshooting.md) |
| 12 | [Лаба: разбор инцидента](12-lab-troubleshooting.md) |

### Cloud и Kubernetes

| # | Урок |
|---|---|
| 13 | [RDS, CloudNativePG, операторы](13-cloud-k8s.md) |
| 14 | [Лаба: CloudNativePG на mockctl](14-lab-cloudnativepg.md) |
| 15 | [Финальный проект: DBA playbook](15-final-project.md) |
