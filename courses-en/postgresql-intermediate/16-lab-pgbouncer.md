# 16. Lab: PgBouncer

## Why this lab

Connecting through **6432** and comparing it with the direct **5432** under `pgbench` reinforces why a pooler is needed with many clients. The lab is **optional** if there's no PgBouncer in the compose yet — you can add a service or write up a tabletop with the config.

## Prerequisites

- Primary Postgres on 5432.
- `pgbench` in the PostgreSQL client or in a container.

## Task 1. Add PgBouncer to compose (optional)

A fragment for `deploy/postgres/docker-compose.yml`:

```yaml
  pgbouncer:
    image: edoburu/pgbouncer:latest
    container_name: mock-pgbouncer
    ports:
      - "6432:6432"
    environment:
      DATABASE_URL: postgres://course:course@postgres:5432/course
      POOL_MODE: transaction
      MAX_CLIENT_CONN: 200
      DEFAULT_POOL_SIZE: 20
    depends_on:
      postgres:
        condition: service_healthy
```

```bash
docker compose -f deploy/postgres/docker-compose.yml up -d pgbouncer
```

## Task 2. Check the connection

```bash
psql "postgresql://course:course@localhost:6432/course" -c "SELECT current_database(), inet_server_addr();"
```

**Expected:** the `course` DB, the query passes.

Repeat with 5432 — compare `inet_server_addr()` (the Postgres address vs PgBouncer).

## Task 3. SHOW POOLS (admin, if available)

```bash
psql "postgresql://course:course@localhost:6432/pgbouncer" -c "SHOW POOLS;"
psql "postgresql://course:course@localhost:6432/pgbouncer" -c "SHOW STATS;"
```

If the admin DB is unavailable — note "image without admin" in the report; tasks 2 and 4 are enough.

## Task 4. pgbench — direct vs pool

Initialization (once, via the pool or direct):

```bash
pgbench -i -s 10 "postgresql://course:course@localhost:5432/course"
```

Test **directly** (50 clients, 30 sec):

```bash
pgbench -c 50 -j 2 -T 30 "postgresql://course:course@localhost:5432/course"
```

Write down **tps** and **latency average**.

Test **through PgBouncer** (if it's up):

```bash
pgbench -c 50 -j 2 -T 30 "postgresql://course:course@localhost:6432/course"
```

| Metric | 5432 direct | 6432 pool |
|---------|-------------|-----------|
| tps | | |
| avg latency | | |
| errors | | |

On a small environment the difference may be moderate; at `pgbench -c 200`, direct often hits `max_connections`, but the pool doesn't.

## Task 5. Short report (5–10 sentences)

Answer:

1. How many backends on the primary with 50 pgbench clients without PgBouncer? (`pg_stat_activity` during the test)
2. How many with the same 50 through PgBouncer? (`SHOW POOLS` or activity)
3. When would you **not** run migrations through a transaction pool?

## Path B — without Docker PgBouncer

File `docs/pgbouncer-config.md`:

- The `[databases]` and `[pgbouncer]` sections from [15-pgbouncer](15-pgbouncer.md)
- The app → 6432 → 5432 scheme
- Limitations of transaction mode for your ORM

## If something went wrong

| Symptom | Fix |
|---------|---------|
| Connection refused 6432 | The service didn't start; `docker compose ps` |
| Auth failed | `DATABASE_URL`, the image's userlist |
| pgbench FATAL too many clients | Lower `-c` or use the pool |
| Same TPS | Few clients; increase `-c` |

## Success criteria

- [ ] `SELECT 1` through 6432 OK **or** the config doc is ready
- [ ] pgbench direct is recorded
- [ ] A comparison with the pool (or a rationale for tabletop)
- [ ] You understand why migrations go on 5432

## Next

Final project: [17-final-project.md](17-final-project.md).
