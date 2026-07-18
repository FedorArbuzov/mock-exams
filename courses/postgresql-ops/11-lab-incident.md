# 11. Лаба: synthetic incident

## Зачем эта лаба

Заполнить **настоящий** incident report по сценарию «диск / WAL / archive» — навык on-call, не теория.

## Предусловия

- [`templates/incident-report.md`](templates/incident-report.md)
- [examples/runbooks/disk-full.md](examples/runbooks/disk-full.md)

## Сценарий: «диск забит WAL»

**Легенда:** `archive_command` падает 6 часов, `pg_wal` растёт, disk 96%, INSERT fail.

## Задание 1. Диагностика (hands-on)

```sql
SELECT pg_size_pretty(pg_database_size('course'));
SELECT * FROM pg_stat_archiver;

SELECT count(*) AS wal_files FROM pg_ls_waldir();  -- superuser

SELECT pid, state, wait_event_type, left(query, 60),
       now() - query_start AS duration
FROM pg_stat_activity
WHERE datname = 'course' AND pid <> pg_backend_pid()
ORDER BY duration DESC NULLS LAST;
```

```bash
docker exec mock-postgres df -h /var/lib/postgresql/data
docker exec mock-postgres du -sh /var/lib/postgresql/data/pg_wal
docker logs mock-postgres 2>&1 | tail -100
```

Запишите фактические цифры (даже если disk не полон — симулируйте в report).

## Задание 2. Три SQL из runbook disk-full

Из [disk-full.md](examples/runbooks/disk-full.md) примените и зафиксируйте output:

1. `pg_database_size`
2. `pg_ls_waldir` / размер pg_wal
3. `pg_stat_archiver`

## Задание 3. Mitigation (tabletop)

Что бы вы сделали **без** `rm pg_wal/*`:

1. Fix `archive_command` / WAL-G / pgBackRest push
2. Expand disk (EBS, volume)
3. `max_wal_size` — временно, не решение
4. Investigate replication slot holding WAL

## Задание 4. Incident report

Скопируйте [`templates/incident-report.md`](templates/incident-report.md) → `incidents/2026-06-wal-disk.md`:

| Секция | Заполнить |
|--------|-----------|
| Timeline UTC | T+0 alert, T+15 diagnosis, T+45 mitigated |
| Impact | API write errors, duration |
| Root cause | archive_command fail (hypothesis) |
| Mitigation | fix archive, expand disk |
| Prevention | alert 80% disk, alert archiver failed_count |
| Action items | quarterly restore drill, fix IaC |

## Задание 5. Escalation

Когда бы вы позвали senior (пороги из runbook)?

## Критерии успеха

- [ ] Incident report полностью заполнен
- [ ] 3 SQL из disk-full применены
- [ ] Mitigation без удаления WAL вручную
- [ ] Prevention action items ≥ 2

## Дальше

Monitoring: [12-monitoring-ops.md](12-monitoring-ops.md).
