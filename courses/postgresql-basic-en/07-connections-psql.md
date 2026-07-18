# 07. Connections: psql, URI, Pools

Friday release. Kubernetes scales FastAPI to 80 pods, each with `pool_size=20` — that's **1600** Postgres connections against `max_connections=100`. Queueing, timeouts, random 500s in the logs. Different incident: DBA opens `pg_stat_activity` and sees 200 anonymous `psql` sessions — nobody set `application_name`, so nobody knows who's holding `idle in transaction`.

This chapter is about connecting the right way: URI format, `psql`, limits, SSL, and why you need a pool (PgBouncer deep dive is in [intermediate](../postgresql-intermediate/15-pgbouncer.md)).

## Connection URI — what each piece means

```text
postgresql://shop_writer:writer_pass@localhost:5432/course?sslmode=prefer&application_name=shop-api
```

| Part | Example | Note |
|------|---------|------|
| Scheme | `postgresql://` | `postgres://` works too |
| User / password | `shop_writer:writer_pass` | URL-encode special chars in password |
| Host / port | `localhost:5432` | in K8s, usually a service name |
| Database | `course` | not the cluster name |
| Query params | `sslmode`, `connect_timeout`, ... | see below |

Handy params:

```text
?connect_timeout=5
&application_name=shop-api
&options=-csearch_path%3Dshop
```

`options=-csearch_path=shop` sets the schema for the session (alternative to `SET search_path` in SQL).

Python ([fastapi/16-lab-postgres](../fastapi/16-lab-postgres.md)):

```python
DATABASE_URL = "postgresql+asyncpg://shop_writer:writer_pass@localhost:5432/course"
```

`postgresql+asyncpg` is SQLAlchemy dialect syntax. The wire protocol is still plain Postgres.

## psql — the tool you'll actually use

| Command | What it does |
|---------|--------------|
| `\?` | help for meta-commands |
| `\h CREATE TABLE` | SQL syntax help |
| `\conninfo` | current connection details |
| `\dt shop.*` | tables in a schema |
| `\d shop.products` | columns, indexes, FKs |
| `\dp shop.*` | privileges (ACL) |
| `\timing on` | show query duration |
| `\x auto` | vertical output for wide rows |
| `\e` | open editor for a query |
| `\i file.sql` | run a SQL file |
| `\copy` | import/export **from the client side** |
| `\watch 2` | rerun query every 2 seconds |

**`COPY` vs `\copy`:** `COPY` reads/writes a file **on the server** (needs permissions, often blocked on RDS). `\copy` streams through the client — safe from your laptop.

```sql
\copy (SELECT * FROM shop.products) TO 'products.csv' CSV HEADER
```

## application_name — so you know who's connected

```sql
SET application_name = 'gitlab-ci-migrate';
```

Or in the URI: `?application_name=shop-api`.

```sql
SELECT pid, application_name, usename, state, left(query, 60)
FROM pg_stat_activity
WHERE datname = 'course';
```

In prod this tells API apart from workers, migrations, Metabase. Without it, "someone's holding a lock" is all you get.

## Connection limits — don't open 10,000 connections

```sql
SHOW max_connections;
SHOW work_mem;
```

Each connection = a backend process ([01-architecture](01-architecture.md)). Memory isn't always `max_connections × work_mem`, but heavy sorts/hashes on many connections at once can spike RAM.

| Approach | When |
|----------|------|
| App pool (SQLAlchemy, pgx) | tens of workers |
| PgBouncer transaction pooling | hundreds/thousands of clients |
| crank `max_connections` to 5000 | almost never the first fix |

Back-of-napkin: `pods × pool_size < max_connections`, with headroom for admin and replication.

## SSL

| sslmode | Behavior |
|---------|----------|
| `disable` | no TLS — local dev only |
| `prefer` | TLS if available |
| `require` | TLS mandatory |
| `verify-full` | TLS + hostname/CA check — **production** |

On RDS/Aurora/managed Postgres, use `verify-full` with a trusted CA.

## Things people usually get wrong

1. Every pod opens a pile of direct DB connections with no pool.
2. ORM keeps a transaction open for the whole request — blocks vacuum.
3. `sslmode=disable` in prod because the tutorial said so.
4. Server-side `COPY '/tmp/file'` on RDS where you can't touch the filesystem.

## Before you move on

- [ ] I can build a URI and use query params
- [ ] I know `\d`, `\dt`, `\dp`, `\timing`
- [ ] I know `\copy` vs `COPY`
- [ ] I set `application_name` for debugging
- [ ] I understand why 10k direct connections is a bad idea

## What's next

Lab: [08-lab-psql.md](08-lab-psql.md).
