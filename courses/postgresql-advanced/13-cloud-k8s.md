# 13. RDS, Aurora, CloudNativePG

## Сценарий с работы

Стартап «переезжает в AWS» — поднимают Postgres в EC2 с Patroni. Через год DevOps устал патчить minor, бэкапы и Multi-AZ вручную. Миграция на **RDS**. Параллельно команда K8s ставит shop API в `mockctl` — StatefulSet Postgres без operator ломается на failover. **CloudNativePG** даёт HA как managed service внутри кластера.

Эта глава — **выбор платформы**: self-hosted vs managed vs operator.

## Что вы узнаете

- RDS vs self-hosted: ограничения и плюсы
- Aurora на высоком уровне
- CloudNativePG и альтернативы
- Когда StatefulSet без operator недостаточен

## Amazon RDS for PostgreSQL

| | Self-hosted (Patroni) | RDS PostgreSQL |
|---|---------------------|----------------|
| Minor patches | Вы | Maintenance window |
| Backups / PITR | pgBackRest, WAL-G | Automated snapshots |
| Multi-AZ HA | Patroni + DCS | AWS failover (DNS) |
| Superuser | Полный | `rds_superuser` ограничен |
| Файловая система PGDATA | Да | Нет доступа |
| `pg_hba.conf` | Файл | Parameter groups (частично) |
| Extensions | Любые | Allowlist |
| Цена | Infra + время | $$$, меньше ops |

**Parameter groups** — `shared_buffers`, `log_*`, `max_connections`.  
**Read replicas** — отдельные endpoints для отчётов.  
**Security groups** — сеть вместо hba CIDR.

Связь: [aws-intermediate/13-rds-private](../aws-intermediate/13-rds-private.md).

## Aurora PostgreSQL

- Storage **отдельно** от compute (6 копий, auto-grow).
- Failover replica promote — секунды (обычно).
- Wire protocol совместим с Postgres; **не** 100% feature parity — проверять release notes.
- Serverless v2 — scale compute.

Когда Aurora vs RDS Postgres: высокий write throughput, много replicas, нужен fast failover storage layer.

## CloudNativePG (Kubernetes)

Operator от EDB для Postgres в K8s:

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

| Возможность | CNPG |
|-------------|------|
| HA / failover | Авто, Patroni-like |
| Services | `-rw` (primary), `-ro` (replicas), `-r` (any) |
| Backup PITR | S3/Azure/GCS via barman |
| Pooler | PgBouncer integrated (опционально) |

Связь: [kuber-intermediate](../kuber-intermediate/README.md) StatefulSet, [14-lab-cloudnativepg](14-lab-cloudnativepg.md).

## Альтернативные operators

| Operator | Особенности |
|----------|-------------|
| **Zalando Postgres Operator** | Spilo, PATRONI, acid manifest |
| **Crunchy PGO** | pgBackRest native, enterprise support |
| **StackGres** | All-in-one, extensions |

## Почему не «голый» StatefulSet

```text
StatefulSet + PVC + один Postgres
```

| Проблема | Без operator |
|----------|--------------|
| Failover | Ручной promote |
| Replica join | Ручной basebackup |
| Backup | Sidecar scripts |
| Version upgrade | Custom job |
| Secret rotation | Вручную |

Operator кодирует runbook в CRD.

## Выбор платформы

| Среда | Рекомендация |
|-------|--------------|
| Учёба mock-exams | Docker compose [`deploy/postgres`](../../deploy/postgres/README.md) |
| K8s production app | CloudNativePG / PGO |
| AWS enterprise, мало K8s | RDS / Aurora |
| Максимальный контроль, compliance | Patroni on VMs / bare metal ([01-patroni-ha](01-patroni-ha.md)) |
| Serverless experiments | Aurora Serverless, Neon (вне курса) |

## Типичные ошибки

1. RDS с ожиданием полного superuser — ломаются миграции с `CREATE EXTENSION`.
2. CNPG с 1 instance «для экономии» — нет HA.
3. Read replica для write — replication lag, ошибки.
4. Aurora «как Postgres» без проверки extension list.

## Чек-лист

- [ ] RDS — доступ к pg_hba файлу? (нет, parameter groups)
- [ ] CNPG — сколько instances для quorum HA? (≥ 2, лучше 3)
- [ ] Aurora storage vs EBS для RDS
- [ ] Почему не StatefulSet без operator
- [ ] Read endpoint — только SELECT

## Дальше

Лаба: [14-lab-cloudnativepg.md](14-lab-cloudnativepg.md).
