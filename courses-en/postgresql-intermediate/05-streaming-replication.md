# 05. Streaming (physical) replication

## Real-world scenario

The primary went down at 03:00. The team brings up a "backup" — they spin up a **second** Postgres from yesterday's `pg_dump`. A loss of 24 hours of orders. The right path: a **standby** catching up WAL in real time, and a well-thought-out failover. Another day: reports load the primary — the DBA moves read-only to the replica but doesn't check **lag**; users see yesterday's stock levels.

Physical (streaming) replication copies the **WAL bytes** — a byte-for-byte copy of the cluster on the standby. This is the foundation of HA before Patroni ([advanced](../postgresql-advanced/README.md)).

## What you'll learn

- The primary → standby scheme and hot standby
- Configuring the primary: `wal_level`, replication role, `pg_hba`
- `pg_basebackup` and the `standby.signal` file
- Synchronous replication and lag
- What you can/can't do on a replica

## Primary and standby

```text
Primary (read/write)
    │  WAL stream (TCP, replication protocol)
    ▼
Standby (hot standby: read-only SELECT)
```

A standby in **recovery** mode applies WAL almost in real time. Don't confuse it with logical replication ([07-logical-replication](07-logical-replication.md)) — there you have tables and a publication.

## Configuring the primary

`postgresql.conf` (part of it requires a restart):

```ini
wal_level = replica
max_wal_senders = 10
max_replication_slots = 10
wal_keep_size = 1GB
```

Replication role:

```sql
CREATE ROLE replicator WITH REPLICATION LOGIN PASSWORD 'repl_pass';
```

`pg_hba.conf`:

```text
host  replication  replicator  10.0.0.0/24  scram-sha-256
host  replication  replicator  172.16.0.0/12  scram-sha-256
```

For a Docker network — the compose subnet. After editing: `pg_reload_conf()` for hba; restart for `wal_level`.

## Creating a standby

```bash
pg_basebackup -h primary-host -p 5432 -U replicator \
  -D /var/lib/postgresql/data \
  -Fp -Xs -P -R
```

| Flag | Meaning |
|------|-------|
| `-Fp` | plain format (tar — an alternative) |
| `-Xs` | stream WAL during the backup |
| `-P` | progress |
| `-R` | create `postgresql.auto.conf` with `primary_conninfo` + `standby.signal` |

The standby starts with `PGDATA` from the backup and connects to the primary.

On PG 12+, a **`standby.signal`** file in PGDATA means "I'm a replica." Previously — `recovery.conf`.

## Monitoring on the primary

```sql
SELECT application_name, client_addr, state, sync_state,
       sent_lsn, write_lsn, flush_lsn, replay_lsn,
       pg_wal_lsn_diff(sent_lsn, replay_lsn) AS byte_lag
FROM pg_stat_replication;
```

| state | Meaning |
|-------|-------|
| `streaming` | Normal |
| `catchup` | Catching up after connecting |
| `startup` | Starting |

**Lag** is the LSN difference. It grows with: network, replica with a slower disk, heavy reads on the replica, a long recovery conflict.

On the standby:

```sql
SELECT pg_is_in_recovery();           -- true
SELECT pg_last_wal_receive_lsn();
SELECT pg_last_wal_replay_lsn();
SELECT now() - pg_last_xact_replay_timestamp() AS replay_lag;
```

`replay_lag` is NULL if there have been no transactions yet after promote/start.

## Synchronous replication

```sql
ALTER SYSTEM SET synchronous_standby_names = 'FIRST 1 (standby1)';
```

A commit on the primary waits until the standby **flushes** WAL. Fewer losses when the primary fails (RPO≈0), higher commit latency.

| | Async | Sync |
|---|-------|------|
| RPO when the primary fails | Up to lag | ~0 |
| Write latency | Lower | Higher |
| Risk | Losing the last commits | Primary waits for a slow replica |

## Read queries on a replica

```sql
-- on the standby
SELECT count(*) FROM shop.products;   -- OK
INSERT INTO shop.products ...;        -- ERROR: read-only transaction
```

**Recovery conflicts:** a long SELECT on the replica can block WAL application (vacuum on the primary removed a row the replica is reading). Parameter `max_standby_streaming_delay`.

## Failover (preview)

Manual: `pg_ctl promote` or `SELECT pg_promote();` — the standby becomes the primary. Automation — **Patroni**, **repmgr**, managed RDS Multi-AZ ([advanced/02-lab-patroni](../postgresql-advanced/02-lab-patroni.md)).

Failover ≠ switchover: with a failover, data loss is possible with async replication.

## Common mistakes

1. `wal_level=minimal` on the primary — the replica won't connect.
2. No `replication` line in hba — connection refused.
3. Reading from a lagging replica as the source of truth for stock levels.
4. Forgot `hot_standby=on` (default on) — the replica doesn't accept SELECT.

## Checklist

- [ ] Physical vs logical replication
- [ ] hot standby — SELECT yes, INSERT no
- [ ] Causes of growing lag
- [ ] When `pg_basebackup` vs `pg_dump`
- [ ] `pg_stat_replication` — the key columns

## Next

Lab: [06-lab-streaming-replication.md](06-lab-streaming-replication.md).
