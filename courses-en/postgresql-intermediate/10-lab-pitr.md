# 10. Lab: tabletop PITR

## Why this lab

A full PITR environment with an archive on S3 and a third volume is expensive to set up for every student. A **tabletop runbook** is what companies actually do: the on-call engineer restores step by step during a drill. Lab [09-pitr](09-pitr.md) gives the theory; here — an **executable document** for on-call.

Optional: two Docker volumes + base backup + recovery — for advanced students.

## Prerequisites

- Completed [03-wal](03-wal.md) and [09-pitr](09-pitr.md).
- Understanding of RPO/RTO.

## Task 1. Write a PITR runbook

Create a file `docs/pitr-runbook.md` (in your fork or locally). At least **15 numbered steps**, understandable to an on-call engineer without the context of this chat.

### Required sections

#### 1. Enabling archiving (production)

```ini
archive_mode = on
archive_command = 'test ! -f /mnt/wal_archive/%f && cp %p /mnt/wal_archive/%f'
```

Example for S3:

```bash
archive_command = 'aws s3 cp %p s3://company-pg-wal/prod/%f --only-show-errors'
```

Mention: monitoring `pg_stat_archiver`, an alert on `failed_count`.

#### 2. Base backup schedule

```bash
# cron: daily at 02:00 UTC
0 2 * * * pgbackrest --stanza=prod backup
# or
0 2 * * * pg_basebackup -D /backups/base/$(date +\%Y\%m\%d) -Ft -z -P
```

Retention: how many base backups to keep (7 daily, 4 weekly).

#### 3. Incident scenario

```text
14:00 UTC — an erroneous DROP TABLE shop.orders CASCADE on the prod primary
13:55 UTC — the last known good state (before the call with the PM)
```

Goal: a new instance with data as of **13:55 UTC**, without touching the broken primary until the investigation.

#### 4. Recovery commands (outline)

```text
1. Record the incident: UTC time, LSN if available
2. Stop application traffic (maintenance mode)
3. Bring up an isolated host / container for recovery
4. Clear PGDATA
5. Restore the last base backup BEFORE 14:00
6. Create recovery.signal
7. postgresql.conf:
   restore_command = 'aws s3 cp s3://company-pg-wal/prod/%f %p'
   recovery_target_time = '2026-06-25 13:55:00+00'
   recovery_target_action = promote
8. start Postgres, watch the replay log
9. pg_is_in_recovery() → false after promote
10. Verify: SELECT count(*) FROM shop.orders; sanity checks
11. Change the endpoint in the application / DNS
12. Old primary — isolate, don't start
13. Postmortem, schedule a restore test in the calendar
```

#### 5. RPO / RTO for your example

| | Value | Rationale |
|---|----------|-------------|
| RPO | e.g. 1 min | WAL archive continuous |
| RTO | e.g. 45 min | base restore 25 min + replay 15 min + verify |

#### 6. Quarterly drill

- Restore into `staging-recovery` once a quarter.
- `pg_verifybackup` (pgBackRest) or a checklist of row counts.
- Update the runbook based on the results.

## Task 2. Verify checklist after restore

In the runbook, add a table of checks:

| Check | Command |
|----------|---------|
| Not in recovery | `SELECT pg_is_in_recovery();` |
| Time | `SELECT now();` — close to the target |
| Critical table | `SELECT count(*) FROM shop.orders;` |
| Roles | `\du` |
| Extensions | `\dx` |
| Replication | decide: a new replica from this primary |

## Task 3. Optional — a mini PITR in Docker

For advanced students:

1. `archive_mode=on`, archive into the `/wal_archive` volume.
2. `pg_basebackup` into `/backup/base`.
3. INSERT a marker, `pg_switch_wal`, archive.
4. A "bad" DELETE.
5. A new container: base + recovery to a timestamp before the DELETE.
6. The marker is in place, the DELETE is gone.

Document the differences from production (single node, local paths).

## If something went wrong (runbook quality)

| Problem in the runbook | Fix |
|--------------------|-------------|
| Steps without UTC | Explicit `+00` / `Europe/Berlin` |
| No isolation of the old primary | Split-brain risk |
| No verify | "Brought up an empty DB" |
| No contacts / escalation | Add on-call |

## Success criteria

- [ ] Runbook ≥ 15 steps
- [ ] RPO and RTO specified
- [ ] There's a `recovery_target_time` with a timezone
- [ ] Test restore / pg_verifybackup mentioned
- [ ] A DROP TABLE scenario with times before/after

## Next

VACUUM: [11-vacuum-bloat.md](11-vacuum-bloat.md).
