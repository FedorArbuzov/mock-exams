# 15. Final Project: Build a Shop Database Like a Real Team

## The story

You're on an e-commerce team. Business drops five requests in one sprint:

- "Build a proper database — not a toy schema that falls apart in prod."
- "Reports have to open fast."
- "Access has to be secure — no one user with god mode."
- "We need backup and a restore we can actually run at 3am."
- "And figure out the transaction/payment bugs before they hit customers."

Your job: put together a small production-like setup in schema `shop_final`. Stages 1–5 are the build. Stages 6–7 are what happens **after** go-live — when someone complains about speed or money.

---

## What you're delivering

1. `shop_final` schema with real table relationships
2. Seed data at useful volume — not ten rows
3. Three roles: `shop_migrator`, `shop_app`, `shop_report`
4. Main report query checked with `EXPLAIN (ANALYZE, BUFFERS)`
5. Backup + restore you actually verified
6. `troubleshooting.md` with the five incidents below — written out, not "fill in a template"

---

## Stage 1. Data model

Create `schema.sql`:

```text
categories ──< products
customers  ──< orders ──< order_items >── products
```

```sql
CREATE SCHEMA shop_final AUTHORIZATION course;

CREATE TABLE shop_final.categories (
  id   serial PRIMARY KEY,
  name text NOT NULL UNIQUE
);

CREATE TABLE shop_final.products (
  id          serial PRIMARY KEY,
  category_id int NOT NULL REFERENCES shop_final.categories(id),
  sku         text NOT NULL UNIQUE,
  name        text NOT NULL,
  price       numeric(10,2) NOT NULL CHECK (price >= 0)
);

CREATE TABLE shop_final.customers (
  id         bigserial PRIMARY KEY,
  email      text NOT NULL UNIQUE,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE shop_final.orders (
  id          bigserial PRIMARY KEY,
  customer_id bigint NOT NULL REFERENCES shop_final.customers(id),
  created_at  timestamptz NOT NULL DEFAULT now(),
  status      text NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'paid', 'shipped', 'cancelled'))
);

CREATE TABLE shop_final.order_items (
  id         bigserial PRIMARY KEY,
  order_id   bigint NOT NULL REFERENCES shop_final.orders(id) ON DELETE CASCADE,
  product_id int NOT NULL REFERENCES shop_final.products(id),
  qty        int NOT NULL CHECK (qty > 0),
  unit_price numeric(10,2) NOT NULL CHECK (unit_price >= 0),
  UNIQUE (order_id, product_id)
);
```

---

## Stage 2. Seed data

Create `seed.sql` — categories, products, customers, thousands of orders and line items.

```sql
INSERT INTO shop_final.orders (customer_id, created_at)
SELECT (random() * 999 + 1)::bigint,
       now() - (random() * 90 || ' days')::interval
FROM generate_series(1, 20000);

ANALYZE shop_final.orders;
ANALYZE shop_final.order_items;
```

Without `ANALYZE` after bulk load, `EXPLAIN` in the next stages will lie to you.

---

## Stage 3. Split roles

```sql
CREATE ROLE shop_migrator LOGIN PASSWORD 'migrator_pass';
CREATE ROLE shop_app LOGIN PASSWORD 'app_pass';
CREATE ROLE shop_report LOGIN PASSWORD 'report_pass';

GRANT CONNECT ON DATABASE course TO shop_migrator, shop_app, shop_report;
GRANT USAGE, CREATE ON SCHEMA shop_final TO shop_migrator;
GRANT USAGE ON SCHEMA shop_final TO shop_app, shop_report;

GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA shop_final TO shop_app;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA shop_final TO shop_app;
GRANT SELECT ON ALL TABLES IN SCHEMA shop_final TO shop_report;
```

Verify:

- `shop_report` cannot INSERT/UPDATE/DELETE
- `shop_app` cannot `CREATE TABLE`

---

## Stage 4. Main report + query plan

```sql
SELECT c.email,
       count(*) AS orders,
       sum(oi.qty * oi.unit_price) AS total
FROM shop_final.customers c
JOIN shop_final.orders o ON o.customer_id = c.id
JOIN shop_final.order_items oi ON oi.order_id = o.id
WHERE o.created_at >= now() - interval '30 days'
GROUP BY c.email
ORDER BY total DESC
LIMIT 20;
```

```sql
EXPLAIN (ANALYZE, BUFFERS)
-- paste the query above
```

Save the output — you'll compare it after indexes in stage 6.

---

## Stage 5. Backup and restore

```bash
pg_dump -Fc -n shop_final -f shop_final.dump "postgresql://course:course@localhost:5432/course"
```

```bash
createdb course_test
pg_restore -d course_test shop_final.dump
psql "postgresql://course:course@localhost:5432/course_test" -c "SELECT count(*) FROM shop_final.orders;"
```

A backup you haven't restored is just a file on disk. Count rows in `course_test` and match prod.

---

## Stage 6. "Everything is slow" — indexes

### What business says

A week after demo:

- "Customer page takes forever."
- "Monthly report sometimes hangs for minutes."

Don't guess indexes. Process: slow query → `EXPLAIN` → index → `EXPLAIN` again.

### Base index set

```sql
CREATE INDEX orders_customer_created_idx
  ON shop_final.orders (customer_id, created_at DESC);

CREATE INDEX orders_created_at_idx
  ON shop_final.orders (created_at);

CREATE INDEX order_items_order_id_idx
  ON shop_final.order_items (order_id);
```

### When to try BRIN instead of B-tree

If `orders` is huge and mostly append-only by time:

```sql
CREATE INDEX orders_created_at_brin_idx
  ON shop_final.orders USING brin (created_at);
```

BRIN shines when you have tens/hundreds of millions of rows, inserts follow time order, and you want a tiny index. Compare plans before and after — see [09-indexes-explain](09-indexes-explain.md).

---

## Stage 7. Bugs land in support — troubleshooting

Put these five cases in `shop_final/troubleshooting.md`. Each one: what business said → what was happening → why → fix → how you proved it.

### Case 1. Oversell of the last item

- **Business:** "Sometimes we sell the last unit twice."
- **What happened:** two checkout flows read `stock = 1`, both decrement.
- **Why:** race under Read Committed, no row lock.
- **Fix:** `SELECT ... FOR UPDATE` on the product row + `CHECK (stock >= 0)`; for trickier rules, Serializable + retry.
- **Proof:** parallel load test — one order succeeds, the second gets a controlled error; stock never goes negative.

```sql
BEGIN;
SELECT stock
FROM shop_final.products
WHERE id = :product_id
FOR UPDATE;

UPDATE shop_final.products
SET stock = stock - :qty
WHERE id = :product_id;
COMMIT;
```

### Case 2. "Jumping" financial report

- **Business:** "Numbers in the same report don't match."
- **What happened:** long Read Committed transaction with several SELECTs.
- **Why:** in Read Committed, each statement gets a fresh snapshot — new orders appear mid-report.
- **Fix:** wrap report in `REPEATABLE READ`; keep transactions short; heavy analytics on a replica.
- **Proof:** run the report 10 times in a row — numbers stable within each run.

```sql
BEGIN ISOLATION LEVEL REPEATABLE READ;
-- several SELECTs for the report
COMMIT;
```

### Case 3. Double charge on webhook retry

- **Business:** "Rare, but customers get charged twice."
- **What happened:** payment provider retried the callback; app treated it as a new payment.
- **Why:** no idempotency key, no unique constraint.
- **Fix:** `payment_id` column + partial unique index; treat `unique_violation` as "already processed."
- **Proof:** replay the same callback 50 times — one payment row, correct order status.

```sql
ALTER TABLE shop_final.orders
  ADD COLUMN payment_id text;

CREATE UNIQUE INDEX orders_payment_id_uq
  ON shop_final.orders (payment_id)
  WHERE payment_id IS NOT NULL;
```

### Case 4. Pending queue stalls at peak

- **Business:** "Evenings, pending orders pile up — we miss SLA."
- **What happened:** workers grabbed the same rows, blocked each other, held transactions too long.
- **Why:** queue without `SKIP LOCKED`, lots of lock wait.
- **Fix:** dequeue with `FOR UPDATE SKIP LOCKED`, small batches, short transactions.
- **Proof:** queue latency drops in peak, lock wait near zero, throughput up.

```sql
BEGIN;
SELECT id
FROM shop_final.orders
WHERE status = 'pending'
ORDER BY created_at
FOR UPDATE SKIP LOCKED
LIMIT 100;

UPDATE shop_final.orders
SET status = 'paid'
WHERE id = ANY(:ids);
COMMIT;
```

### Case 5. "Max 3 active orders" rule gets broken

- **Business:** "Customer sometimes has 4 active orders, limit is 3."
- **What happened:** two parallel requests read `count(active)=2`, both create an order.
- **Why:** write skew — classic race on Read Committed.
- **Fix:** order-creation block in `SERIALIZABLE` + mandatory retry on serialization failure.
- **Proof:** 1000 parallel attempts with limit 3 — invariant holds; some txs retry cleanly.

```sql
BEGIN ISOLATION LEVEL SERIALIZABLE;

SELECT count(*)
FROM shop_final.orders
WHERE customer_id = :customer_id
  AND status IN ('pending', 'paid');

INSERT INTO shop_final.orders (customer_id, status)
VALUES (:customer_id, 'pending');

COMMIT;
```

In the app: catch `serialization_failure`, retry with backoff (2–3 attempts), log retry rate so you see the cost.

---

## What to submit

- `schema.sql`
- `seed.sql`
- `README.md` — ER sketch, how to connect, backup/restore commands
- `troubleshooting.md` — all five cases above
- one `EXPLAIN (ANALYZE, BUFFERS)` for the report query (before or after indexes — note which)

## Before you call it done

- [ ] Schema builds from scratch
- [ ] 4+ tables with FK and CHECK
- [ ] Roles separated and tested
- [ ] EXPLAIN output attached
- [ ] Backup restored and row counts checked
- [ ] All 5 troubleshooting cases written with fix + proof

## What's next

`postgresql-basic` is done. Continue with [postgresql-intermediate](../postgresql-intermediate/README.md).
