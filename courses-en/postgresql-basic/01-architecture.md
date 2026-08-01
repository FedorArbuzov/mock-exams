# 01. PostgreSQL Architecture

Tuesday, 11:00. A Slack message says: "Postgres is slow, spin up one more instance." You open Docker Compose, add another Postgres container, and one hour later you now have **two disconnected databases** with different data. In a call someone says, "create a staging database," so you run `CREATE DATABASE` and think you created a separate server. Then a DBA asks: "How many backend processes do we have in prod?" You answer "well... one Postgres," and that is also wrong.

These mix-ups happen when people do not have a clear model of **processes**, **disk files**, and **terms** (cluster, instance, database, schema). This lesson is the foundation for the full PostgreSQL branch in mock-exams: from [basic](README.md) to [advanced](../postgresql-advanced/README.md), [developer](../postgresql-developer/README.md), and [performance](../postgresql-performance/README.md).

Course lab environment: [`deploy/postgres`](../../deploy/postgres/README.md) — `docker compose up`, port `5432`, user `course`.

In this chapter:

- Process model: postmaster, background workers, one backend per connection.
- What a **cluster** (instance) is and where data lives on disk.
- Difference between **database**, **schema**, and "separate server."
- Why `postgresql.conf`, `pg_hba.conf`, and `pg_catalog` matter.
- Major/minor versions and how Postgres differs from MySQL at a conceptual level.

## Process Model: Processes, Not Threads

PostgreSQL is a **multi-process** DBMS. The main process is called **postmaster** (sometimes shown as "postgres" in logs/docs). It does not execute your queries itself — it **accepts connections** and **spawns child processes**.

```text
postmaster (main process)
├── background writer   — flushes dirty pages from shared_buffers to disk
├── checkpointer        — checkpoints
├── WAL writer          — WAL writes to disk
├── autovacuum launcher — starts autovacuum workers
├── stats collector     — stats for pg_stat_*
└── backend process     — one per client connection
```

**Why this matters in practice**

Each TCP connection from your app = a **separate OS process** inside Postgres. That process consumes memory (`work_mem`, buffers, etc). 100 connections can be fine; **thousands** often become "Postgres ate all RAM" even for simple queries.

That is why you will keep seeing this rule (again in [intermediate/15-pgbouncer](../postgresql-intermediate/15-pgbouncer.md)): at high client counts you need a **connection pool** (PgBouncer, ORM pooler, pgx pool limits). The pool keeps a small number of real DB connections and many app requests share them.

| Interview question | Short answer |
|--------------------|-------------|
| How many backends for 100 connections? | 100 (without pooling) |
| Who executes `SELECT`? | Your session backend process |
| What does postmaster do during `SELECT`? | Connection/process management, not query execution |

Comparison: MySQL InnoDB historically leans more on **threads** per connection; SQLite is embedded directly in the application process. Postgres intentionally chooses process isolation: one broken backend should not crash the full server.

## Data Files: One Cluster = One PGDATA

All data for one **cluster** lives in **PGDATA** (often `/var/lib/postgresql/data` in Docker). As long as postmaster runs against that directory, it is **one Postgres instance**.

| Path (typical) | Content |
|----------------|---------|
| `PGDATA` | cluster root |
| `base/` | table files for user DBs (grouped by DB OID) |
| `global/` | shared system catalogs (roles, tablespaces) |
| `pg_wal/` | WAL (Write-Ahead Log) |
| `postgresql.conf` | server parameters |
| `postgresql.auto.conf` | parameters set by `ALTER SYSTEM` |
| `pg_hba.conf` | who can connect and how |
| `pg_ident.conf` | OS user -> DB role mapping |

WAL is the core **durability** mechanism: write to WAL first, then update data pages. More in [intermediate/04-lab-wal](../postgresql-intermediate/04-lab-wal.md) and [11-transactions-mvcc](11-transactions-mvcc.md).

**Lab check** ([02-lab-install](02-lab-install.md)):

```sql
SHOW data_directory;
```

```bash
docker exec mock-postgres ls -la /var/lib/postgresql/data/pg_wal | head
```

You will see WAL segments even in an almost empty training DB.

## Cluster vs Database vs Schema

Postgres terminology confuses many beginners because **cluster** in docs is not a Kubernetes cluster and not necessarily a replication cluster.

| Term | What it actually means |
|------|-------------------------|
| **Instance / cluster** | running postmaster + one PGDATA directory |
| **Database** | isolated namespace inside a cluster; own schemas/objects; **no native cross-database joins** |
| **Schema** | namespace inside a DB: `public`, `app`, `audit` |
| **Table** | table inside a schema: `app.orders` |

`CREATE DATABASE staging;` does **not** create a new Docker server. It creates another DB **inside the same** postmaster, using the same PGDATA and same config. Real staging/prod isolation means **separate instances** (different container/RDS/PGDATA). See [ops/06-blue-green](../postgresql-ops/06-blue-green.md).

```text
One cluster (PGDATA)
├── database: course      ← mock-exams training DB
├── database: postgres    ← utility DB
└── database: template1   ← template for CREATE DATABASE
        └── schema: public
                └── table: ...
```

In app stacks ([fastapi](../../deploy/fastapi/README.md), [django](../../deploy/django/README.md)) connection strings include the **database name** (`course`), not a "cluster name."

## System Catalogs

Postgres metadata lives in **system catalogs**. You rarely modify them directly; you read them via `pg_catalog` and `information_schema`.

| Catalog / View | Purpose |
|----------------|---------|
| `pg_database` | list of databases in cluster |
| `pg_class` | tables, indexes, sequences (relations) |
| `pg_roles` / `pg_authid` | roles, attributes, passwords |
| `pg_stat_user_tables` | table stats (live/dead tuples) |

From [08-lab-psql](08-lab-psql.md):

```sql
SELECT datname FROM pg_database WHERE datistemplate = false;
SELECT relname, relkind FROM pg_class WHERE relnamespace = 'public'::regnamespace LIMIT 10;
```

Catalog literacy pays off later: planner stats in [performance](../postgresql-performance/README.md), permissions/audit in [security](../postgresql-security/README.md).

## Configuration and Connection Security

**`postgresql.conf`** controls memory, WAL, logging, autovacuum. Change via file or `ALTER SYSTEM` ([intermediate/01-configuration](../postgresql-intermediate/01-configuration.md)).

**`pg_hba.conf`** (host-based authentication) is your **first security gate**: which IP/user/DB can connect and with what method (scram-sha-256, cert, peer). A bad HBA rule often appears as "connection refused" or "no pg_hba.conf entry" while Postgres itself is up. More in [05-roles-privileges](05-roles-privileges.md) and [security/02-scram-auth](../postgresql-security/02-scram-auth.md).

Typical local-lab line:

```text
# TYPE  DATABASE  USER    ADDRESS        METHOD
host    all       all     0.0.0.0/0      scram-sha-256
```

After editing HBA: `SELECT pg_reload_conf();` or `pg_ctl reload`.

## Versions: Major and Minor

This course targets **PostgreSQL 16** (image in `deploy/postgres`).

| Update type | Example | How to roll out |
|-------------|---------|-----------------|
| **Minor** | 16.2 -> 16.3 | package/image update + restart |
| **Major** | 16 -> 17 | `pg_upgrade` or dump/restore; test migrations |

Major upgrades are separate projects: extension compatibility, downtime strategy, rollback plan ([advanced/09-major-upgrade](../postgresql-advanced/09-major-upgrade.md)). Minor updates are routine ops.

Check:

```sql
SELECT version();
SHOW server_version_num;
```

## PostgreSQL vs MySQL / SQLite (Conceptual)

| | PostgreSQL | MySQL (InnoDB) | SQLite |
|---|------------|----------------|--------|
| Model | processes, one cluster -> many DBs | commonly thread-based model | embedded file DB |
| MVCC | row versions (xmin/xmax) | undo log | simpler locking model |
| Log | WAL | redo log | journal mode |
| Replication | physical + logical | binlog-centric | limited |
| Typical use | primary app database | legacy + many SaaS stacks | edge/tests/mobile |

If you come from [django](../django/README.md) or [sqlalchemy-deep](../sqlalchemy-deep/README.md), ORM hides DB details, but **transaction and lock behavior** still depends on the engine. That is exactly what [11-transactions-mvcc](11-transactions-mvcc.md) covers.

## Common Beginner Mistakes

1. **"I will add one more Postgres container"** without understanding PGDATA -> you get two separate clusters, not HA.
2. **"`CREATE DATABASE` means new server"** -> no, only a new namespace in same cluster.
3. **"I will open 500 worker connections"** -> 500 backend processes; without pooling, memory/context-switch overhead can destroy latency.
4. **Editing only `postgresql.conf` and forgetting `pg_hba.conf`** -> DB is up, but nobody can connect.

## Before you move on

- [ ] I can explain postmaster -> backend per connection.
- [ ] I understand what WAL is and why it exists.
- [ ] I can distinguish cluster/instance from database and schema.
- [ ] I know why `pg_hba.conf` matters when "cannot connect."
- [ ] I know major upgrade != minor patch.

## What's next

Next lesson is hands-on: [02-lab-install.md](02-lab-install.md) (Docker, `psql`, first meta-commands).

Related tracks: [containers-basic](../containers-basic/README.md), [fastapi/16-lab-postgres](../fastapi/16-lab-postgres.md).
