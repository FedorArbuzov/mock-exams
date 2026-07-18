# 13. Финальный проект: Ops Playbook

## Сценарий с работы

Admin-трек (basic→advanced) дал знания. Performance — tuning. **Ops Playbook** — документ, по которому дежурный в 3 ночи восстанавливает сервис, не читая 47 уроков заново.

## Цель

Единый **Ops Playbook** (~10+ страниц markdown) для production PostgreSQL 16 shop API.

## Предусловия

- Курсы ops 01–12
- [intermediate/17-final-project](../postgresql-intermediate/17-final-project.md) — можно влить HA/PITR секции

## Структура

```text
docs/postgres-ops-playbook/
├── README.md
├── 01-backup-strategy.md
├── 02-pitr-restore.md
├── 03-blue-green.md
├── 04-oncall-runbooks/
│   ├── replication-lag.md
│   ├── disk-full.md
│   └── connections.md
├── 05-monitoring.md
├── 06-zero-downtime-migrations.md
└── incidents/
    └── example-postmortem.md
```

## Раздел 1. Backup strategy

- Инструмент: **pgBackRest** или **WAL-G** (выберите один)
- RPO/RTO с обоснованием
- Retention (full/diff/WAL)
- Off-site S3/MinIO, encryption
- **Restore drill:** quarterly, owner, last date, duration
- Ссылка на [03-lab-pgbackrest](03-lab-pgbackrest.md) / [05-lab-wal-g](05-lab-wal-g.md)

## Раздел 2. PITR

Шаги восстановления на время T (из [intermediate/09-pitr](../postgresql-intermediate/09-pitr.md)):

1. Isolate host
2. Stop Postgres
3. Restore base + WAL / pgbackrest restore --type=time
4. recovery_target_time + promote
5. Verify + app cutover

## Раздел 3. Blue/green

Диаграмма + checklist из [07-lab-blue-green](07-lab-blue-green.md).  
Сценарий: PG 16→17 **или** DC migration.

## Раздел 4. On-call (минимум 3 runbook)

Каждый: **Symptoms → Diagnosis → Mitigation → Escalation**

| Runbook | Источник |
|---------|----------|
| Replication lag | [examples](examples/runbooks/replication-lag.md) + дополните |
| Disk full / WAL | [examples](examples/runbooks/disk-full.md) |
| Connection exhaustion | создайте |

+ escalation matrix (P2/P1, кого звать).

## Раздел 5. Monitoring

Из [12-monitoring-ops](12-monitoring-ops.md):

- Таблица метрик и порогов
- Sketch on-call dashboard (ASCII или mermaid)
- Alert → runbook links

## Раздел 6. Zero-downtime

Один **реальный** expand/contract для shop schema ([08-zero-downtime](08-zero-downtime.md)):

```text
Example: ADD orders.status, backfill, deploy v2/v3, DROP legacy
```

Упомяните `CREATE INDEX CONCURRENTLY`.

## Раздел 7. Postmortem

Один заполненный report из [11-lab-incident](11-lab-incident.md).

## Критерии приёмки

| Уровень | Критерии |
|---------|----------|
| Pass | 6 разделов, 3 runbooks, restore drill scheduled |
| Strong | Escalation matrix, dashboard mock, blue/green 10+ steps |
| Gap | Только bullet list без команд |

## Связи

- [aws-intermediate RDS](../aws-intermediate/README.md)
- [postgresql-advanced DBA playbook](../postgresql-advanced/15-final-project.md)
- [sre/12-disaster-recovery](../sre/12-disaster-recovery.md)

## Самопроверка

- [ ] Дежурный найдёт PITR за 2 минуты
- [ ] Каждый alert имеет runbook
- [ ] Restore drill в календаре
- [ ] Контакты escalation заполнены

---

**postgresql-ops завершён.**
