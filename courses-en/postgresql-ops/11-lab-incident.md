# 11. Lab: synthetic incident

## Why this lab

Filling out a **real** incident report for a "disk / WAL / archive" scenario is an on-call skill, not theory.

## Prerequisites

- [`templates/incident-report.md`](templates/incident-report.md)
- [examples/runbooks/disk-full.md](examples/runbooks/disk-full.md)

## Scenario: "disk filled by WAL"

**Premise:** `archive_command` has been failing for 6 hours, `pg_wal` is growing, disk is at 96%, INSERTs fail.

## Task 1. Diagnosis (hands-on)

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

Record the actual figures (even if the disk isn't full — simulate it in the report).

## Task 2. Three SQL queries from the disk-full runbook

From [disk-full.md](examples/runbooks/disk-full.md), apply and capture the output:

1. `pg_database_size`
2. `pg_ls_waldir` / size of pg_wal
3. `pg_stat_archiver`

## Task 3. Mitigation (tabletop)

What you would do **without** `rm pg_wal/*`:

1. Fix `archive_command` / WAL-G / pgBackRest push
2. Expand disk (EBS, volume)
3. `max_wal_size` — temporary, not a fix
4. Investigate a replication slot holding WAL

## Task 4. Incident report

Copy [`templates/incident-report.md`](templates/incident-report.md) → `incidents/2026-06-wal-disk.md`:

| Section | Fill in |
|--------|-----------|
| Timeline UTC | T+0 alert, T+15 diagnosis, T+45 mitigated |
| Impact | API write errors, duration |
| Root cause | archive_command fail (hypothesis) |
| Mitigation | fix archive, expand disk |
| Prevention | alert 80% disk, alert archiver failed_count |
| Action items | quarterly restore drill, fix IaC |

## Task 5. Escalation

When would you call in a senior (thresholds from the runbook)?

## Success criteria

- [ ] Incident report fully filled out
- [ ] 3 SQL queries from disk-full applied
- [ ] Mitigation without manually deleting WAL
- [ ] Prevention action items ≥ 2

## Next

Monitoring: [12-monitoring-ops.md](12-monitoring-ops.md).
