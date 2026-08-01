# 03. Cluster, Database, Schemas, Tables

A new developer writes `CREATE TABLE users (...)` without a schema prefix — in production the table lands in `public`, while the team agreed on `app`. Another teammate runs `CREATE DATABASE analytics` on the same RDS hoping to isolate prod load — but CPU and disk are **shared**, because it's one cluster. A third picks `timestamp without time zone` for orders from Europe and the US — reports drift when DST kicks in.

This chapter is about the **object hierarchy** in Postgres and picking types/constraints you won't regret fixing later in [intermediate](../postgresql-intermediate/README.md) and [developer](../postgresql-developer/README.md).

## How objects nest inside each other

```text
Cluster (one PGDATA, one postmaster)
└── Database: course
      ├── Schema: public      ← default
      ├── Schema: shop        ← our training schema (lab 04)
      └── Schema: app
            ├── Table: products
            ├── View: active_products
            ├── Index, Sequence, Function, ...
```

A **database** in Postgres is a hard wall: you can't `JOIN` `course.shop.orders` with `analytics.shop.orders` in one SQL statement. Cross-database means FDW or application logic — not basic level.

A **schema** is a namespace inside a database. Names are unique per `(schema, object_name)`. One cluster, many apps: `billing.invoices`, `shop.orders`.

## CREATE DATABASE

```sql
CREATE DATABASE appdb
  OWNER = app_owner
  ENCODING = 'UTF8'
  LC_COLLATE = 'en_US.utf8'
  LC_CTYPE = 'en_US.utf8'
  TEMPLATE = template0;
```

| Parameter | Why |
|-----------|-----|
| `OWNER` | who owns objects created in this DB |
| `ENCODING UTF8` | standard for apps |
| `LC_*` | sorting and char classification — **can't change later** |
| `TEMPLATE template0` | clean empty clone |

Why `template0` and not `template1`?  
`template1` is the default template and often has extensions or shared objects baked in. `template0` is the pristine baseline.

One gotcha: `CREATE DATABASE` **cannot** run inside a transaction (`BEGIN` … `COMMIT`). In CI migration scripts that wraps everything in a transaction, the whole script rolls back unexpectedly.

On this training stand you work in existing DB `course`. You'll create/restore another DB in the [final project](15-final-project.md).

## Schemas and search_path

```sql
CREATE SCHEMA shop AUTHORIZATION course;
SET search_path TO shop, public;
```

After `SET`, `SELECT * FROM products` looks at `shop.products` first, then `public.products`.

| Approach | Good | Bad |
|----------|------|-----|
| Always `shop.products` | explicit, no surprises | longer SQL |
| `search_path = shop` | shorter queries | shadowing, injection risks |
| Everything in `public` | fine for a prototype | chaos in a real monolith |

In [django](../django/07-models-basics.md) and [sqlalchemy-deep](../sqlalchemy-deep/README.md) you usually set schema in model metadata or connection string: `options=-csearch_path=shop`.

## Picking column types

```sql
CREATE TABLE shop.products (
  id          bigserial PRIMARY KEY,
  sku         text NOT NULL UNIQUE,
  name        text NOT NULL,
  price       numeric(10,2) NOT NULL CHECK (price >= 0),
  metadata    jsonb,
  created_at  timestamptz NOT NULL DEFAULT now()
);
```

| Type | When |
|------|------|
| `bigint` / `bigserial` | IDs, counters |
| `numeric(p,s)` | money — **not** float |
| `text` | strings of any length |
| `timestamptz` | real moments in time (orders, logs) |
| `timestamp` (no tz) | "wall clock" semantics only — rare |
| `jsonb` | flexible attributes |
| `uuid` | distributed or public IDs |

`timestamptz` stores UTC, displays in session timezone. Plain `timestamp` has no timezone context — easy to mess up APIs and reports across regions.

## Constraints — let the DB enforce rules

```sql
CREATE TABLE shop.orders (
  id         bigserial PRIMARY KEY,
  product_id bigint NOT NULL REFERENCES shop.products(id),
  qty        int NOT NULL CHECK (qty > 0),
  created_at timestamptz DEFAULT now()
);
```

| Constraint | What it does |
|-----------|--------------|
| `PRIMARY KEY` | unique + NOT NULL; creates an index |
| `UNIQUE` | business keys (sku, email) |
| `NOT NULL` | column can't be null |
| `CHECK` | domain rules (price >= 0) |
| `FOREIGN KEY` | referential integrity |

**FK and indexes:** put an index on the referencing column (`orders.product_id`). The referenced column (`products.id`) already has one from PK. Without an index on the FK, JOINs and parent DELETEs get painful.

## Views

```sql
CREATE VIEW shop.active_products AS
  SELECT id, sku, name, price
  FROM shop.products
  WHERE deleted_at IS NULL;
```

A view is a saved query, not a data copy. A **materialized view** stores a snapshot on disk — refresh with `REFRESH MATERIALIZED VIEW`.

## Checking sizes

When someone asks "why is the disk full?":

```sql
SELECT pg_size_pretty(pg_database_size('course'));

SELECT schemaname, relname,
       pg_size_pretty(pg_total_relation_size(relid)) AS total
FROM pg_catalog.pg_statio_user_tables
ORDER BY pg_total_relation_size(relid) DESC
LIMIT 10;
```

`pg_total_relation_size` includes table + TOAST + indexes — closer to real disk usage.

```sql
SELECT tablename FROM pg_tables WHERE schemaname = 'shop';
```

## Things people usually get wrong

1. Dumping everything in `public` — six months later nobody knows what belongs to whom.
2. `CREATE DATABASE` for workload isolation — it isolates names, not CPU/RAM/disk.
3. `double precision` for money — rounding surprises. Use `numeric`.
4. No index on FK columns — slow JOINs and painful cascades.

## Before you move on

- [ ] I can draw cluster → database → schema → table
- [ ] I know why `TEMPLATE template0`
- [ ] I understand `search_path` risks
- [ ] I use `timestamptz` for app events
- [ ] I can find the biggest tables by size

## What's next

Hands-on: [04-lab-ddl.md](04-lab-ddl.md).
