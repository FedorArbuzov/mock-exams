# 06. Lab: physical replica (Docker)

## Why this lab

Streaming replication on paper is `pg_hba` + `pg_basebackup`. In Docker, the network and restarts complicate the picture. You either bring up a **second instance on 5433** or document the steps and prove `pg_stat_replication` on the primary — both paths count if the mechanics are clear.

**Environment docs:** [`deploy/postgres`](../../deploy/postgres/README.md) — a second instance on port **5433**.

## Prerequisites

- Primary `mock-postgres` on **5432**, the `shop` schema.
- `wal_level = replica` (lab [02](02-lab-configuration.md)).
- Enough disk space for a copy of PGDATA.

## Path A — full environment (recommended)

### Step 1. The replicator role on the primary

```sql
CREATE USER replicator WITH REPLICATION ENCRYPTED PASSWORD 'repl_pass';
```

### Step 2. Primary parameters

```sql
ALTER SYSTEM SET wal_level = 'replica';
ALTER SYSTEM SET max_wal_senders = 5;
ALTER SYSTEM SET max_replication_slots = 5;
```

Restart the primary:

```bash
docker compose -f deploy/postgres/docker-compose.yml restart postgres
```

### Step 3. pg_hba for replication

In the primary container, add to `pg_hba.conf` (or via init):

```text
host  replication  replicator  0.0.0.0/0  scram-sha-256
```

```sql
SELECT pg_reload_conf();
```

In production — **not** `0.0.0.0/0`; only the replica subnet.

### Step 4. pg_basebackup

From the host (you need the PostgreSQL 16 client):

```bash
mkdir -p ./replica_data
pg_basebackup -h localhost -p 5432 -U replicator \
  -D ./replica_data -Fp -Xs -P -R -W
```

Password: `repl_pass`. The `-R` flag creates `standby.signal` and `primary_conninfo`.

### Step 5. Starting the replica on 5433

Example of a second container (simplified):

```bash
docker run -d --name mock-postgres-replica \
  -p 5433:5432 \
  -v "$(pwd)/replica_data:/var/lib/postgresql/data" \
  -e POSTGRES_HOST_AUTH_METHOD=scram-sha-256 \
  postgres:16
```

Or a separate service in `docker-compose.yml` — see the repository extensions.

### Step 6. Check the primary

```sql
SELECT application_name, client_addr, state, sync_state,
       pg_wal_lsn_diff(sent_lsn, replay_lsn) AS byte_lag
FROM pg_stat_replication;
```

**Expected:** one row, `state = streaming`, small `byte_lag`.

### Step 7. Check the replica

```bash
psql "postgresql://course:course@localhost:5433/course" -c "SELECT pg_is_in_recovery();"
psql "postgresql://course:course@localhost:5433/course" -c "SELECT count(*) FROM shop.products;"
```

**Expected:** `pg_is_in_recovery = t`, the count matches the primary.

### Step 8. Read-only on the replica

```bash
psql "postgresql://course:course@localhost:5433/course" \
  -c "INSERT INTO shop.products (sku,name,price) VALUES ('x','y',1);"
```

**Expected:** `ERROR: cannot execute INSERT in a read-only transaction`.

### Step 9. Write replication

On the primary:

```sql
INSERT INTO shop.products (sku, name, price) VALUES ('repl-test', 'Replica', 9.99);
```

On the replica (after 1–2 sec):

```sql
SELECT * FROM shop.products WHERE sku = 'repl-test';
```

## Path B — tabletop (if there's no second container)

Write up `docs/streaming-replica-runbook.md`:

1. A checklist of primary parameters.
2. The `pg_basebackup` command with flags.
3. SQL checks for `pg_stat_replication`.
4. Expected output of `pg_is_in_recovery`.
5. Failover scenario: `pg_promote()` + what changes in the application.

Minimum on the primary after configuring replicator:

```sql
-- simulation: a slot with no replica until one connects
SELECT * FROM pg_replication_slots;
```

## If something went wrong

| Symptom | Fix |
|---------|---------|
| `password authentication failed for user replicator` | hba, password, `pg_hba` reload |
| `wal_level insufficient` | restart after `replica` |
| Replica won't start | Permissions on `replica_data`, PG version, `docker logs` |
| Lag grows | Load, network; `pg_stat_replication` |
| count doesn't match | Replica is still catching up; wait |

## Success criteria

- [ ] `pg_stat_replication` shows a standby (path A) **or** a runbook of ≥ 10 steps (path B)
- [ ] `pg_is_in_recovery() = true` on the replica
- [ ] SELECT works on the replica, INSERT doesn't
- [ ] A new row from the primary is visible on the replica

## Next

Logical replication: [07-logical-replication.md](07-logical-replication.md).
