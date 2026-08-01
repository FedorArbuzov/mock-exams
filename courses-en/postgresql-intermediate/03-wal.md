# 03. WAL and durability

## Real-world scenario

The server lost power during a peak of orders. After startup Postgres "came back to life" — the last transactions are either in place or rolled back entirely, but there's no "half-written" money. That's **WAL**. Another incident: the disk is 100% full, the `pg_wal` folder is 200 GB. The cause — a lagging replica + a replication slot with no consumer, so WAL isn't recycled.

In [basic/11-transactions-mvcc](../postgresql-basic/11-transactions-mvcc.md) you saw MVCC; WAL is the **durability** layer and the foundation of replication/PITR.

## What you'll learn

- Write order: WAL → data pages
- `synchronous_commit` and the latency/durability trade-off
- `wal_level` and replication requirements
- WAL archiving for PITR
- Why `pg_wal` bloats and how to diagnose it

## Write-Ahead Log

The rule: **the log first, then the data**.

```text
INSERT/UPDATE/DELETE
    → write to the WAL buffer
    → fsync WAL to disk (on commit, if synchronous_commit=on)
    → change data pages in shared_buffers
    → later — flush to disk (background writer / checkpoint)
```

On a crash, Postgres **replays** WAL from the last consistent checkpoint and restores committed transactions.

| Without WAL | With WAL |
|---------|-------|
| A page on disk could be updated before commit | Commit = a WAL write |
| Crash → torn pages, corruption | Crash → replay |

## synchronous_commit

```sql
SHOW synchronous_commit;
SET synchronous_commit = off;  -- only deliberately, per session
```

| Value | Durability | Latency |
|----------|------------|---------|
| `on` (default) | Commit after WAL flush | OLTP standard |
| `off` | WAL may not make it to disk in time | Higher RPS, risk of losing ~the last seconds on a crash |
| `remote_write` / `remote_apply` | Wait for standby ([05-streaming-replication](05-streaming-replication.md)) | HA, higher commit latency |

For staging, sometimes `off` on a bulk load; for money — `on` or a synchronous replica.

## wal_level

```sql
SHOW wal_level;
```

| Level | Replication | Archive / PITR |
|---------|------------|----------------|
| `minimal` | No streaming | Limited |
| `replica` | Physical standby, slots | Yes |
| `logical` | + logical decoding | Yes |

For a streaming replica — at least **`replica`**. For [logical replication](07-logical-replication.md) — **`logical`**. Changing the level means a **restart** of the primary.

## WAL archiving

PITR ([09-pitr](09-pitr.md)) requires a continuous WAL chain **outside** PGDATA:

```ini
archive_mode = on
archive_command = 'test ! -f /wal_archive/%f && cp %p /wal_archive/%f'
```

In the cloud: `aws s3 cp`, `rclone`, WAL-G ([ops/04-wal-g](../postgresql-ops/04-wal-g.md)).

```sql
SELECT * FROM pg_stat_archiver;
```

`failed_count` > 0 — urgent: without archive, PITR breaks and `pg_wal` may grow.

## The size of pg_wal — why it grows

```bash
docker exec mock-postgres du -sh /var/lib/postgresql/data/pg_wal
```

Causes:

1. **Replication slot** — the consumer lagged or died; WAL is retained.
2. **Archive command fails** — segments don't make it to the archive.
3. **Long transaction** — hinders recycling (rarely bloats pg_wal directly, but affects vacuum/xmin).
4. **Checkpoint can't keep up** — during a write spike.

Diagnosing slots:

```sql
SELECT slot_name, active, wal_status,
       pg_size_pretty(pg_wal_lsn_diff(pg_current_wal_lsn(), restart_lsn)) AS retained
FROM pg_replication_slots;
```

`retained` gigabytes with `active = false` is the classic "forgot to drop the slot" incident.

## LSN — a logical position in WAL

```sql
SELECT pg_current_wal_lsn();
SELECT pg_walfile_name(pg_current_wal_lsn());
```

LSN (Log Sequence Number) is an address in the WAL stream. On the primary and replica you compare `sent_lsn` vs `replay_lsn` for lag ([05-streaming-replication](05-streaming-replication.md)).

## Common mistakes

1. `archive_mode=on`, but `archive_command` always fails — a false sense of security.
2. Created a logical slot and forgot the subscription — WAL piles up.
3. `synchronous_commit=off` in production "for speed" without agreeing on RPO.
4. Copying PGDATA instead of base backup + WAL archive.

## Checklist

- [ ] Why WAL is needed if data files exist
- [ ] What `wal_level replica` is for
- [ ] A replication slot without a consumer — the risk
- [ ] `archive_mode` and the link to PITR
- [ ] Where to look at `pg_stat_archiver` and slots

## Next

Lab: [04-lab-wal.md](04-lab-wal.md).
