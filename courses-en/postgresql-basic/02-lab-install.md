# 02. Lab: Installation and First Connection

Before going deep into MVCC and replication, you need to **connect confidently** to Postgres and understand that "the server is running" is not the same as "I can execute queries." In production, half of "DB is down" tickets end up being: unhealthy container, wrong port, password typo, or `pg_hba.conf` blocking your IP.

This lab brings up the training environment from [`deploy/postgres`](../../deploy/postgres/README.md) and introduces `psql` — the tool you will use in all following chapters and in interviews.

## What you need

- Docker and Docker Compose are installed ([`containers-basic`](../containers-basic/README.md)).
- `mock-exams` repository is cloned locally.
- Host port **5432** is free (or change mapping in compose).

## Task 1. Start Postgres in Docker

From repository root:

```bash
cd deploy/postgres
docker compose build
docker compose up -d
docker compose ps
```

**Expected result:** `postgres` service is `running` and healthcheck is `healthy` (can take 10-30 seconds on first start).

Readiness check without entering container:

```bash
docker exec mock-postgres pg_isready -U course -d course
```

Should return: `accepting connections`.

### If startup fails

| Symptom | What to check |
|---------|---------------|
| `port is already allocated` | Another Postgres uses 5432; run `docker ps` and stop conflicting service |
| long `unhealthy` status | `docker compose logs postgres` for PGDATA/init errors |
| `no such file` | You are not in `deploy/postgres` or missing `docker-compose.yml` |

After changing images/extensions, you may need a volume reset — see [deploy/postgres README](../../deploy/postgres/README.md).

## Task 2. First connection via psql

**From host** (if `psql` client is installed):

```bash
psql "postgresql://course:course@localhost:5432/course"
```

**Via container** (always works):

```bash
docker exec -it mock-postgres psql -U course -d course
```

Prompt `course=#` means: connected to DB `course` as superuser `course` (fine in a training lab; in production app connections should not run like this — see [05-roles-privileges](05-roles-privileges.md)).

URI breakdown:

```text
postgresql://course:course@localhost:5432/course
            │      │        │         │      └── database
            │      │        │         └── port
            │      │        └── host
            │      └── password
            └── user (role)
```

## Task 3. First commands in psql

In interactive session:

```sql
SELECT version();
\conninfo
\l
\du
\q
```

| Command | What it shows |
|---------|---------------|
| `SELECT version()` | PostgreSQL version (expect **16.x**) |
| `\conninfo` | current host, port, user, database |
| `\l` | list of databases in the **cluster** |
| `\du` | roles (users/groups) |
| `\q` | quit |

**Theory link:** `\l` corresponds to catalog `pg_database` from [01-architecture](01-architecture.md). Multiple databases still mean one postmaster and one PGDATA.

## Task 4. Data files inside container

Verify where data is stored:

```bash
docker exec mock-postgres psql -U course -c "SHOW data_directory;"
docker exec mock-postgres ls -la /var/lib/postgresql/data/pg_wal | head
```

First command shows PGDATA path. Second shows **WAL** segments. Even with no user tables, WAL is active — that is how Postgres guarantees durability.

Optional pgAdmin from same compose:

- [http://localhost:5050](http://localhost:5050) — `admin@course.local` / `course`
- Add Server: host `postgres` (inside compose network) or `host.docker.internal` from Windows host

## Task 5. Mini check: "I can administer this cluster"

```sql
SELECT current_user, current_database();
SHOW server_version;
SELECT datname FROM pg_database WHERE datistemplate = false;
```

Remember: in this lab `course` is both role and DB name. In real projects they are usually **different**.

## You're done when

- [ ] `docker compose ps` shows healthy postgres
- [ ] `pg_isready` -> accepting connections
- [ ] `SELECT 1` and `SELECT version()` work
- [ ] You can explain URI parts in `postgresql://course:course@localhost:5432/course`
- [ ] You saw `pg_wal` and understand it is not a backup folder

## What's next

Database object theory: [03-databases-schemas.md](03-databases-schemas.md).  
DDL practice on `shop` schema: [04-lab-ddl.md](04-lab-ddl.md).
