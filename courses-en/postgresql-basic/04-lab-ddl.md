# 04. Lab: DDL and Basic Objects

In [03-databases-schemas](03-databases-schemas.md) you learned object hierarchy. Here you **build** training schema `shop` — the same shop domain used in [fastapi](../../deploy/fastapi/README.md) and [django](../../deploy/django/README.md). This schema stays with you through the full basic track: roles, indexes, MVCC, backups.

DDL (`CREATE`, `ALTER`, `DROP`) mistakes are expensive: long locks, possible data loss (`DROP CASCADE`). In the lab you can experiment; in production DDL usually goes through migrations ([developer/02-flyway](../postgresql-developer/02-flyway.md)).

## What you need

- Lab environment from [02-lab-install](02-lab-install.md) is running.
- Connection: `psql "postgresql://course:course@localhost:5432/course"` or `docker exec -it mock-postgres psql -U course -d course`.

If `shop` already exists from a previous run:

```sql
DROP SCHEMA IF EXISTS shop CASCADE;
```

## Task 1. Create schema and constrained tables

```sql
CREATE SCHEMA shop AUTHORIZATION course;

CREATE TABLE shop.products (
  id    serial PRIMARY KEY,
  sku   text NOT NULL UNIQUE,
  name  text NOT NULL,
  price numeric(10,2) NOT NULL CHECK (price >= 0)
);

CREATE TABLE shop.orders (
  id         bigserial PRIMARY KEY,
  product_id int NOT NULL REFERENCES shop.products(id),
  qty        int NOT NULL CHECK (qty > 0),
  created_at timestamptz DEFAULT now()
);
```

**Structure check:**

```sql
\d shop.products
\d shop.orders
```

Expected: PK, UNIQUE on `sku`, FK `orders_product_id_fkey`, CHECK on `price` and `qty`.

### FK validation (must fail)

```sql
INSERT INTO shop.orders (product_id, qty) VALUES (999, 1);
```

Expected error: `violates foreign key constraint`.

### UNIQUE validation

```sql
INSERT INTO shop.products (sku, name, price) VALUES ('A1', 'Dup', 1);
INSERT INTO shop.products (sku, name, price) VALUES ('A1', 'Dup2', 2);
```

Second insert must fail with duplicate key error.

## Task 2. Add date index

```sql
CREATE INDEX orders_created_idx ON shop.orders (created_at DESC);
```

With tiny data Postgres may still prefer Seq Scan — that is normal. You will see the difference later in [10-lab-indexes](10-lab-indexes.md).

```sql
\d shop.orders
```

You should see `orders_created_idx`.

## Task 3. Seed sample data

```sql
INSERT INTO shop.products (sku, name, price) VALUES
  ('A1', 'Widget', 9.99),
  ('B2', 'Gadget', 19.50);

INSERT INTO shop.orders (product_id, qty) VALUES (1, 2), (2, 1);

SELECT p.name, o.qty, o.created_at
FROM shop.orders o
JOIN shop.products p ON p.id = o.product_id;
```

Expected: two rows (Widget/Gadget).

## Task 4. Inspect object sizes

```sql
SELECT relname,
       pg_size_pretty(pg_relation_size(oid)) AS table_size
FROM pg_class
WHERE relnamespace = 'shop'::regnamespace
  AND relkind = 'r'
ORDER BY relname;
```

Sizes will be small now, but this is a core production query when disk usage grows.

## Task 5. search_path (optional)

```sql
SET search_path TO shop, public;
SELECT * FROM products;
RESET search_path;
```

Unqualified names work only with expected `search_path`. In apps, explicit schema names are usually safer.

## If something goes wrong

| Error | Fix |
|------|-----|
| `schema "shop" already exists` | run `DROP SCHEMA shop CASCADE;` and retry |
| `permission denied` | connect as `course`, not `shop_reader` |
| `relation does not exist` | check `search_path` or use `shop.table` |

## You're done when

- [ ] `shop` schema exists with `products` and `orders`
- [ ] FK blocks invalid `product_id`
- [ ] UNIQUE on `sku` works
- [ ] `orders_created_idx` is visible
- [ ] JOIN returns meaningful rows

## What's next

Access control: [05-roles-privileges.md](05-roles-privileges.md) -> [06-lab-roles.md](06-lab-roles.md).
