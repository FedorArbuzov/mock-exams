# 15. Финальный проект: DBA Playbook

## Сценарий с работы

Три курса PostgreSQL (basic → intermediate → advanced) — десятки лаб и runbook'ов. В production нужен **один** документ: «как мы эксплуатируем Postgres для shop API». Этот проект собирает architecture, daily checks, failover, upgrade, security и on-call в `docs/postgres-dba-playbook/`.

Это capstone **advanced** и всей admin-ветки (~47 уроков).

## Цель

Единый операционный playbook для PostgreSQL на платформе mock-exams: self-hosted, RDS или CNPG — выберите один сценарий и опишите последовательно.

## Предусловия

- [intermediate/17-final-project](../postgresql-intermediate/17-final-project.md) — HA-ready docs (можно влить)
- Лабы: Patroni [02](02-lab-patroni.md), PITR [intermediate/10](../postgresql-intermediate/10-lab-pitr.md), upgrade [10](10-lab-upgrade.md), incident [12](12-lab-troubleshooting.md)

## Структура сдачи

```text
docs/postgres-dba-playbook/
├── README.md                 — оглавление, владелец, review date
├── 01-architecture.md
├── 02-daily-checks.md
├── 03-backup-restore.md
├── 04-failover.md
├── 05-major-upgrade.md       — ссылка на pg-upgrade doc
├── 06-security.md
├── 07-incidents/
│   ├── blocking-migration.md
│   ├── disk-full-pg-wal.md
│   └── replication-lag.md
├── 08-oncall-cheatsheet.md
└── 09-app-integration.md
```

## Раздел 1: Architecture

- Диаграмма: app → PgBouncer → primary (+ replica / RDS Multi-AZ / CNPG)
- Версия PG, регион, RPO/RTO
- Ссылки на [01-patroni-ha](01-patroni-ha.md) или [13-cloud-k8s](13-cloud-k8s.md)

## Раздел 2: Daily checks

SQL + пороги (утро DBA):

| Проверка | Запрос / метрика | Порог |
|----------|------------------|-------|
| Connections | `count(*)` activity / max | < 80% |
| Replication lag | `pg_stat_replication` | < 100MB или 30s |
| Dead tuples top | `pg_stat_user_tables` | dead_ratio < 0.2 |
| Disk PGDATA | node exporter | < 85% |
| Archiver | `pg_stat_archiver.failed_count` | 0 |
| Long idle txn | activity `idle in transaction` | 0 > 5min |
| Backup last success | cron / pgBackRest | < 24h |

## Раздел 3: Backup / restore

- Nightly `pg_dump -Fc` scope
- WAL archive / RDS snapshots
- Ссылка на PITR runbook ([intermediate/10](../postgresql-intermediate/10-lab-pitr.md))
- Quarterly restore test calendar

## Раздел 4: Failover

- Patroni: `patronictl failover` outline **или** RDS Multi-AZ **или** CNPG switchover
- DNS / connection string change
- Post-failover: rebuild old primary as replica

## Раздел 5: Major upgrade

Вставьте или ссылку на [10-lab-upgrade](10-lab-upgrade.md) `pg-upgrade-16-to-17.md`.

## Раздел 6: Security

Матрица ролей ([basic/05-roles](../postgresql-basic/05-roles-privileges.md))  
RLS tenant ([08-lab-security](08-lab-security.md))  
TLS `verify-full`  
Ссылка на [postgresql-security](../postgresql-security/README.md) roadmap

## Раздел 7: Incidents

Три шаблона из лаб — заполненный **хотя бы один** реальный из [12-lab-troubleshooting](12-lab-troubleshooting.md):

- Timeline, impact, root cause, resolution, prevention

Остальные два — skeleton с командами.

## Раздел 8: On-call cheatsheet

**15 команд** copy-paste с одной строкой «когда»:

1. blocked/blocking query ([11-troubleshooting](11-troubleshooting.md))
2. top pg_stat_statements
3. replication lag
4. terminate idle in transaction
5. pg_database_size
6. pg_stat_archiver
7. replication slots retained WAL
8. cancel long query
9. list locks on table
10. check `pg_is_in_recovery`
11. connection count by app
12. last autovacuum table
13. checkpoint log grep hint
14. failover DNS step
15. emergency read-only mode (если применимо)

## Раздел 9: App integration

- `DATABASE_URL` пример (pooler port 6432)
- Pool size formula: `pods × pool_size < max_connections`
- Migrations: GitLab CI, Flyway ([developer/02-flyway](../postgresql-developer/02-flyway.md))
- `SET app.tenant_id` для RLS
- Health check: `SELECT 1` vs проверка replica lag для read path

## Интеграция с курсами mock-exams

| Курс | Связь |
|------|-------|
| [fastapi](../fastapi/README.md) | SQLAlchemy pool, deploy :8090 |
| [gitlab-intermediate](../gitlab-intermediate/README.md) | CI migrate job |
| [kuber-advanced](../kuber-advanced/README.md) | postgres_exporter |
| [postgresql-ops](../postgresql-ops/README.md) | pgBackRest deep dive |

## Сдача

- Git repo / папка с playbook
- **Один** postmortem из simulated incident ([12](12-lab-troubleshooting.md))
- README с датой review (ежеквартально)

## Критерии оценки

| Уровень | Критерии |
|---------|----------|
| Pass | 9 разделов, on-call 15 команд, 1 postmortem |
| Strong | Daily checks автоматизируемы; failover tested или tabletop ≥ 15 шагов |
| Gap | Только оглавление без SQL |

## Самопроверка

- [ ] Новый DBA может найти PITR за 2 минуты
- [ ] Failover path согласован с architecture diagram
- [ ] Security не «мы используем Postgres»
- [ ] App team знает pool size и migration window

## Дальше

Специализации:

- [postgresql-security](../postgresql-security/README.md)
- [postgresql-performance](../postgresql-performance/README.md)
- [postgresql-ops](../postgresql-ops/README.md)
- [postgresql-developer](../postgresql-developer/README.md)

---

**postgresql-advanced завершён.**

Полный admin-трек: **basic → intermediate → advanced** (47 уроков).
