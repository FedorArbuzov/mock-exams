# 02. Lab: memory and checkpoints

## Why this lab

The parameters from [01-configuration](01-configuration.md) need to be **touched by hand**: reload without a restart, a slow query showing up in the log, a checkpoint message. This is the basic "Postgres is configured" diagnostics before WAL and replication.

## Prerequisites

- The `mock-postgres` environment is running ([basic/02-lab-install](../postgresql-basic/02-lab-install.md)).
- The `shop` schema with the `orders` table (ideally data from [basic/10-lab-indexes](../postgresql-basic/10-lab-indexes.md)).

## Task 1. Snapshot of current parameters

```sql
SHOW shared_buffers;
SHOW work_mem;
SHOW effective_cache_size;
SHOW max_wal_size;
SHOW checkpoint_timeout;
SHOW log_min_duration_statement;
```

Write the values down in a notepad — you'll need them for the final project [17-final-project](17-final-project.md).

Via the settings catalog:

```sql
SELECT name, setting, unit, context, pending_restart
FROM pg_settings
WHERE name IN (
  'shared_buffers', 'work_mem', 'max_wal_size',
  'checkpoint_timeout', 'log_min_duration_statement'
);
```

The `context` column tells you: `postmaster` = a restart is required.

## Task 2. Enable logging via ALTER SYSTEM

```sql
ALTER SYSTEM SET log_min_duration_statement = '100ms';
ALTER SYSTEM SET log_checkpoints = on;
ALTER SYSTEM SET log_lock_waits = on;
SELECT pg_reload_conf();
```

Verification:

```sql
SHOW log_min_duration_statement;
SHOW log_checkpoints;
```

**Expected:** the values were applied **without** a container restart.

See what was written:

```bash
docker exec mock-postgres cat /var/lib/postgresql/data/postgresql.auto.conf
```

## Task 3. Generate a "slow" query

```sql
SET work_mem = '64kB';  -- artificially tightened for the lab

SELECT count(*)
FROM shop.orders o
JOIN shop.products p ON p.id = o.product_id
WHERE o.qty > 0;

RESET work_mem;
```

Repeat the JOIN a few times. Then the logs:

```bash
docker logs mock-postgres 2>&1 | tail -30
```

**Expected:** `duration: ... ms` lines for queries longer than 100ms (if there's little data — increase the cartesian or lower the threshold to `0ms` **only on the lab environment**).

## Task 4. Forced checkpoint

```sql
CHECKPOINT;
```

Again `docker logs mock-postgres 2>&1 | tail -15` — with `log_checkpoints=on` you can see the checkpoint message (starting/complete, WAL position).

## Task 5. pending_restart (optional)

```sql
ALTER SYSTEM SET wal_level = 'replica';
SELECT name, setting, pending_restart
FROM pg_settings WHERE name = 'wal_level';
```

**Expected:** `pending_restart = true` until the container restart:

```bash
docker compose -f deploy/postgres/docker-compose.yml restart postgres
```

After the restart `wal_level` should be `replica` — you'll need it for replication ([06-lab-streaming-replication](06-lab-streaming-replication.md)).

## If something went wrong

| Symptom | Fix |
|---------|---------|
| No lines in docker logs | `log_destination`; check `SHOW log_destination` (stderr) |
| reload doesn't change the parameter | `context = postmaster` — a restart is required |
| No shop schema | [basic/04-lab-ddl](../postgresql-basic/04-lab-ddl.md) |

## Success criteria

- [ ] Captured a baseline of parameters
- [ ] `ALTER SYSTEM` + `pg_reload_conf` without a restart (for log_*)
- [ ] A slow query landed in the log
- [ ] Saw a checkpoint in the log
- [ ] Understand `pending_restart` using the `wal_level` example

## Next

WAL: [03-wal.md](03-wal.md).
