# 15. PgBouncer and connection pooling

## Real-world scenario

Kubernetes: 50 pods × pool 20 = **1000** client connections to Postgres with `max_connections=100`. New pods go into CrashLoop — `FATAL: sorry, too many clients already`. They bumped `max_connections` to 500 — the OOM killer hits the VM. The right move: **PgBouncer** between the app and Postgres — thousands of clients, dozens of server connections ([basic/07-connections-psql](../postgresql-basic/07-connections-psql.md)).

## What you'll learn

- Why a pooler is needed with Postgres's process-per-connection model
- Pool modes: session, transaction, statement
- Limitations of transaction mode for ORMs
- Config and auth
- Single point of failure and an HA pooler

## The problem

```text
Without a pooler:
  1000 app connections → 1000 backend processes → RAM + context switch

With PgBouncer:
  1000 client connections → PgBouncer → 20–50 server connections → Postgres
```

PgBouncer is a lightweight multiplexer; **not** a query cache and not a replacement for Postgres.

## Pool modes

| Mode | Backend held | Typical use |
|------|---------------|------------------------|
| **session** | For the entire client session | Migrations, `LISTEN`, temp tables, legacy app |
| **transaction** | Only for the duration of a transaction | Web API, stateless workers |
| **statement** | For a single statement | Rare; breaks multi-statement transactions |

**Transaction mode** — the default for FastAPI/Django with short request-scoped transactions.

```text
Client BEGIN → backend assigned
COMMIT → backend returned to the pool
Client SET search_path → may "get lost" between transactions
```

## Config (fragment)

```ini
[databases]
course = host=postgres port=5432 dbname=course

[pgbouncer]
listen_addr = 0.0.0.0
listen_port = 6432
auth_type = scram-sha-256
auth_file = /etc/pgbouncer/userlist.txt
pool_mode = transaction
max_client_conn = 1000
default_pool_size = 20
min_pool_size = 5
reserve_pool_size = 5
server_reset_query = DISCARD ALL
```

| Parameter | Meaning |
|----------|-------|
| `max_client_conn` | Max clients to PgBouncer |
| `default_pool_size` | Server conns **per user+database** |
| `server_reset_query` | Clears session state when a backend is returned |

`max_client_conn` >> `default_pool_size` is normal; clients wait in the PgBouncer queue, not in Postgres.

## Limitations of transaction mode

- **Prepared statements** — a name collision when a backend is reused. Solutions: `max_prepared_statements` (newer versions), disable prepare in the driver (`statement_cache_size=0` in asyncpg), session mode for problematic clients.
- **`SET` session variables** — not carried over; use `SET LOCAL` in the transaction or `server_reset_query`.
- **`LISTEN/NOTIFY`, temp tables, advisory locks** — session mode or caution.
- **Cursors** with hold — session mode.

SQLAlchemy 2 / asyncpg: check the docs for pooling through PgBouncer.

## Auth

`auth_file` — user/password pairs. Or `auth_query` to the `pgbouncer.get_auth()` function on Postgres.

The application connects to **6432**, not 5432:

```text
postgresql://shop_app:pass@pgbouncer:6432/course
```

Roles and GRANT — on Postgres as before ([basic/05-roles-privileges](../postgresql-basic/05-roles-privileges.md)).

## HA and SPOF

PgBouncer on a single host is a single point of failure. Options:

- two PgBouncers behind an LB;
- a sidecar PgBouncer in a K8s pod (less sharing);
- RDS Proxy on AWS.

## vs application pool

| | App pool (SQLAlchemy) | PgBouncer |
|---|----------------------|-----------|
| Where | In each pod | Centrally |
| Server conns | pods × pool_size | default_pool_size |
| Better when | Few pods | Many pods / serverless |

Often **both**: a small app pool + PgBouncer.

## Common mistakes

1. `default_pool_size = 500` "so nobody waits" — killed Postgres.
2. Transaction mode + heavy prepared statements without configuring the driver.
3. Running migrations through a transaction pooler — DDL/session issues.
4. Forgetting `server_reset_query` — leaking `search_path` between clients.

## Checklist

- [ ] transaction vs session pool
- [ ] The prepared statements issue
- [ ] PgBouncer SPOF — mitigation
- [ ] `max_client_conn` vs `default_pool_size`
- [ ] Migrations — directly on 5432

## Next

Lab: [16-lab-pgbouncer.md](16-lab-pgbouncer.md).
