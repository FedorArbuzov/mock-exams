# 09. PITR: point-in-time recovery

## Real-world scenario

14:02 — `DROP TABLE orders CASCADE` in the wrong session. The last `pg_dump` was at 03:00. A logical dump won't bring back "the state as of 13:55." **PITR** restores the cluster to an arbitrary moment between the base backup and now, provided there's a **continuous WAL chain** in the archive.

This is the production DR standard together with pgBackRest/WAL-G ([ops](../postgresql-ops/README.md)). `pg_dump` remains for moving schema; PITR is for **RPO in minutes**.

## What you'll learn

- PITR components: base backup + WAL archive + recovery target
- The recovery process on PG 12+
- RPO and RTO in business terms
- The difference from pg_dump and when to use which
- Ops-level tools

## Components

```text
1. Base backup (pg_basebackup, pgBackRest)
        +
2. WAL archive (archive_command → S3/NFS)
        +
3. Recovery: replay WAL up to recovery_target_time
        →
   Cluster at moment T (or just before DROP)
```

Without (2), PITR is **impossible** — only the moment the base backup finished.

## recovery and signal files

PostgreSQL 12+: during recovery, PGDATA holds a **`recovery.signal`** (or `standby.signal` for a replica). Parameters in `postgresql.conf` / `postgresql.auto.conf`:

```ini
restore_command = 'cp /wal_archive/%f %p'
recovery_target_time = '2026-06-25 13:55:00+00'
recovery_target_action = promote
recovery_target_inclusive = false
```

| Parameter | Meaning |
|----------|-------|
| `restore_command` | How to fetch a WAL segment from the archive |
| `recovery_target_time` | Stop at a timestamp (UTC!) |
| `recovery_target_xid` | Alternative — by transaction ID |
| `recovery_target_action = promote` | Become primary after reaching the target |
| `recovery_target_inclusive` | Whether to include transactions exactly on the boundary |

The old `recovery.conf` format — before PG 12; in 16 everything is a GUC + signal file.

## Process (runbook outline)

```text
1. Stop Postgres (or bring up a new instance with a clean PGDATA)
2. Clear / replace PGDATA with the contents of the base backup
3. Create recovery.signal
4. Configure restore_command and recovery_target_*
5. start — Postgres replays WAL from the archive
6. When the target is reached — promote (if action=promote)
7. Verify: pg_is_in_recovery() = false, the data is in place
8. Switch the application (DNS, connection string)
```

**Test restore** — into a separate instance, not on top of the production PGDATA.

## RPO and RTO

| Metric | Question | Example |
|---------|--------|--------|
| **RPO** (Recovery Point Objective) | How much data can we lose? | Archive WAL every minute → RPO ≈ 1 min |
| **RTO** (Recovery Time Objective) | How fast can we bring the service back? | Base restore 30 min + replay 20 min |

| Strategy | Typical RPO |
|-----------|--------------|
| Nightly pg_dump | Up to 24 hours |
| pg_dump hourly | Up to 1 hour |
| PITR + continuous archive | Seconds–minutes |
| Sync replica + failover | ~0 for writes |

## pg_dump vs PITR

| | pg_dump | PITR |
|---|---------|------|
| Granularity | DB / schema | The whole cluster (PGDATA) |
| Point in time | End of dump | Any moment in the WAL chain |
| Restore time for a large DB | Slow | Replay proportional to WAL |
| Cross-version | More flexible | Usually the same major |

The ideal: **pg_dump** for logical portability + **PITR** for disaster recovery.

## pgBackRest / Barman / WAL-G

Wrappers: scheduled backup, retention, parallel restore, verify. In mock-exams: [ops/02-pgbackrest](../postgresql-ops/02-pgbackrest.md), [ops/04-wal-g](../postgresql-ops/04-wal-g.md).

```bash
pgbackrest --stanza=main backup
pgbackrest --stanza=main restore --type=time --target="2026-06-25 13:55:00"
```

## Common mistakes

1. Base backup without a quarterly restore test — "we have a backup," but PITR doesn't work.
2. `recovery_target_time` in local timezone without an offset — off by hours.
3. Archive gap — a WAL file is lost, recovery stops.
4. Promoting a test instance with the same system identifier into the network — split-brain.

## Checklist

- [ ] Base backup without a WAL archive — PITR? (no)
- [ ] Timezone in `recovery_target_time`
- [ ] RPO vs RTO in your own words
- [ ] pg_dump vs PITR — when to use which
- [ ] `recovery.signal` vs a normal start

## Next

Lab runbook: [10-lab-pitr.md](10-lab-pitr.md).

**Going deeper:** [postgresql-ops](../postgresql-ops/README.md).
