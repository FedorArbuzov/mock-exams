# 09. Indexes and EXPLAIN

`orders` hits 40 million rows. A query on `customer_id` takes 30 seconds — `EXPLAIN` shows **Seq Scan**. DBA adds one index, it drops to 50 ms. A month later the disk is full: five unused indexes on every column "just in case," and INSERTs got slow. Another week, the index exists but the planner still picks Seq Scan — stats went stale after a bulk load and nobody ran `ANALYZE`.

An index is a trade-off: faster reads, slower writes, more disk. This chapter is about how that works under the hood, when to add one, and how to read a plan without guessing.

Deeper dive later: [`postgresql-performance`](../postgresql-performance/README.md).

## Think of an index as a table of contents

Picture a phone book with 40 million pages. You need every entry for "Ivanov." Without an index you flip **every page** — that's **Sequential Scan** (Seq Scan). With an alphabetical index you jump straight to the right section — that's **Index Scan**.

In Postgres, table rows live in a **heap** — an unordered pile on disk. An index is a **separate structure** that stores:

1. Column value(s), sorted
2. A pointer to the row in the heap — the **TID** (tuple identifier)

When you run `WHERE product_id = 1`, Postgres walks the index, collects TIDs, then **fetches** the actual rows from the heap. That's **random I/O** — jumping around the disk. On a tiny table (a few hundred rows) it's often cheaper to just read everything in one pass. Seq Scan isn't always wrong.

```sql
CREATE INDEX orders_product_id_idx ON shop.orders (product_id);
```

On every INSERT, Postgres writes the row to the heap **and** updates every index on that table. More indexes = slower writes. That's the price you pay.

## When should you add an index?

| Situation | Index? | Why |
|-----------|--------|-----|
| `WHERE customer_id = ?` on 10M rows, API hits it every second | **Yes** | selective, hot path |
| `WHERE status = 'pending'` but 90% of rows are pending | **Probably not** | index returns almost the whole table; Seq Scan may win |
| 500 rows, rarely queried | **No** | planner reads it in milliseconds anyway |
| JOIN on `orders.product_id = products.id` | **Yes, on the FK** | speeds up joins |
| Column only written, never in WHERE/JOIN/ORDER BY | **No** | pure overhead |
| Monthly report, 5 minutes is fine | **Maybe skip** | not worth slowing daily INSERTs |

**What I'd actually do:**

1. Query is slow → `EXPLAIN (ANALYZE)` on **real data volume** (not an empty dev DB).
2. Seq Scan on a big table with a selective filter → index candidate.
3. Add index → `EXPLAIN (ANALYZE)` again → compare.
4. Once a quarter, check `pg_stat_user_indexes`: `idx_scan = 0` for months → candidate to drop.

## Which index type?

Postgres defaults to **B-tree**. That's the Swiss Army knife for comparisons.

| Type | Use when | Example | Mental model |
|------|----------|---------|--------------|
| **B-tree** (default) | `=`, `<`, `>`, `BETWEEN`, `IN`, `LIKE 'prefix%'` | `WHERE product_id = 1` | alphabetical index |
| **GIN** | JSONB, full-text, arrays | `metadata @> '{"color":"red"}'` | index words inside a document |
| **GiST** | geo, ranges, nearest-neighbor | PostGIS queries | spatial tree |
| **BRIN** | huge append-only tables, rows physically ordered by time | `created_at` on logs | index by page ranges |

```sql
CREATE INDEX products_name_idx ON shop.products (name);
CREATE INDEX orders_created_brin ON shop.orders USING brin (created_at);
```

**BRIN** is tiny (kilobytes vs gigabytes) but only works when new rows land **next to** old ones physically — append-only logs, time partitions. If the table gets hammered with UPDATEs and rows scatter, BRIN won't help.

**GIN** is for "what's inside" JSON or arrays. A B-tree on a whole JSONB column indexes the blob as one value, not the keys inside. Useless for `@>` queries.

## Composite indexes — column order matters

One index on multiple columns is like "sort by last name, then first name":

```sql
CREATE INDEX orders_product_created_idx
  ON shop.orders (product_id, created_at DESC);
```

**This helps:**

```sql
WHERE product_id = 1
WHERE product_id = 1 ORDER BY created_at DESC
WHERE product_id = 1 AND created_at > '2025-01-01'
```

**This doesn't (or barely):**

```sql
WHERE created_at > '2025-01-01'          -- leftmost rule: no product_id
WHERE customer_id = 42                   -- wrong column
```

**Leftmost rule:** index `(a, b, c)` works like "first by a, then b inside a, then c inside b." `WHERE b = ?` without `a` — the index won't help much.

**Picking column order:**

1. Equality columns from `WHERE` (`=`, `IN`) go first.
2. `ORDER BY` column next — can eliminate a separate Sort node.
3. Range columns (`>`, `<`) usually last in the equality group.

## Partial and functional indexes

**Partial** — index only some rows. Smaller, faster to maintain:

```sql
CREATE INDEX orders_pending_idx ON shop.orders (created_at)
  WHERE status = 'pending';
```

Works for `WHERE status = 'pending'`. Won't help `WHERE status = 'delivered'` — and shouldn't.

**Functional** — index on an expression, not the raw column:

```sql
-- Without functional index: Seq Scan, because lower(email) ≠ email
SELECT * FROM shop.users WHERE lower(email) = 'ivan@shop.com';

CREATE INDEX users_email_lower_idx ON shop.users (lower(email));
```

Classic trap: index on `email`, but the app runs `WHERE lower(email) = ?`. Postgres can't use the plain index — the function changes the value.

## Reading EXPLAIN like a human

`EXPLAIN` shows the **plan** — what Postgres **intends** to do. No execution.

```sql
EXPLAIN SELECT * FROM shop.orders WHERE product_id = 1;
```

`EXPLAIN (ANALYZE, BUFFERS)` **actually runs** the query and shows real numbers:

```sql
EXPLAIN (ANALYZE, BUFFERS)
SELECT * FROM shop.orders WHERE product_id = 1;
```

| Plan node | What it means |
|-----------|---------------|
| **Seq Scan** | reading the whole table row by row |
| **Index Scan** | walk index, fetch matching rows from heap |
| **Index Only Scan** | all needed columns are in the index — no heap read |
| **Bitmap Index Scan** + **Bitmap Heap Scan** | collect TIDs from index, read heap in batches |
| **Nested Loop** | for each row on the left, search the right |
| **Hash Join** | build a hash table, probe it |
| **Sort** | sorting — expensive on big data without an index |

Example output:

```text
Index Scan using orders_product_id_idx on orders
  Index Cond: (product_id = 1)
  Buffers: shared hit=4
Planning Time: 0.1 ms
Execution Time: 0.05 ms
```

- `Index Scan using orders_product_id_idx` — our index was used. Good.
- `Index Cond: (product_id = 1)` — filter applied **inside** the index.
- `Buffers: shared hit=4` — 4 pages from RAM, no disk.
- `Execution Time` — only appears with ANALYZE.

Watch estimate vs reality:

```text
Index Scan ... (cost=... rows=1 ...) (actual rows=847 loops=1)
```

Planner expected **1 row**, found **847**. Big gap → stale stats → run `ANALYZE`. The planner might have chosen Seq Scan thinking the table was tiny.

**On prod:** `EXPLAIN ANALYZE` **runs the query for real**. On heavy SELECTs, use plain `EXPLAIN` or test on a replica.

## Real example: 30 seconds → 50 ms

```sql
EXPLAIN (ANALYZE, BUFFERS)
SELECT * FROM shop.orders WHERE customer_id = 12345;

-- Seq Scan on orders
--   Filter: (customer_id = 12345)
--   Rows Removed by Filter: 999500
--   Buffers: shared read=8000
--   Execution Time: 2847 ms
```

Postgres read ~8000 pages and threw away 999,500 rows.

```sql
CREATE INDEX orders_customer_id_idx ON shop.orders (customer_id);

EXPLAIN (ANALYZE, BUFFERS)
SELECT * FROM shop.orders WHERE customer_id = 12345;

-- Index Scan using orders_customer_id_idx
--   Buffers: shared hit=12
--   Execution Time: 0.08 ms
```

12 pages instead of 8000. Orders of magnitude difference.

## The planner isn't psychic — run ANALYZE

The planner doesn't know your data. It reads **statistics** in `pg_stats` (from `ANALYZE` or autovacuum).

After a bulk `INSERT` / `COPY` / migration, stats might still say "1000 rows" when you have 10 million. Planner picks Seq Scan because it thinks the table is small.

```sql
ANALYZE shop.orders;

SELECT attname, n_distinct, most_common_vals, correlation
FROM pg_stats
WHERE tablename = 'orders' AND schemaname = 'shop';
```

| Field | Meaning |
|-------|---------|
| `n_distinct` | approximate number of unique values |
| `most_common_vals` | most frequent values |
| `correlation` | how well physical row order matches logical column order (matters for BRIN) |

More: [performance/01-planner-statistics](../postgresql-performance/01-planner-statistics.md).

## Unused indexes — you pay on every INSERT

Every index slows INSERT/UPDATE/DELETE and eats disk. "Just in case" is a bad strategy.

```sql
SELECT schemaname, relname, indexrelname, idx_scan,
       pg_size_pretty(pg_relation_size(indexrelid))
FROM pg_stat_user_indexes
WHERE schemaname = 'shop'
ORDER BY idx_scan;
```

| `idx_scan` | What to do |
|------------|------------|
| 0 for months | candidate to drop — but check rare reports and FKs first |
| millions | working hard, leave it |
| low but critical query | keep — `idx_scan` resets on restart and doesn't catch everything |

Drop safely on prod:

```sql
DROP INDEX CONCURRENTLY shop.orders_old_status_idx;
```

## Things people usually get wrong

1. **Index every column** — every INSERT updates all of them. Add indexes based on `EXPLAIN`, not "maybe someday."
2. **Index on `email`, query uses `lower(email)`** — need a functional index on `lower(email)`.
3. **`SELECT *`** — even with an index, Postgres reads the heap for other columns. List what you need; consider covering indexes.
4. **Testing on an empty table** — "index didn't help, Seq Scan was faster" on 50 rows is normal. Test at prod-like volume.
5. **Forgot `ANALYZE` after migration** — index exists, planner ignores it.
6. **Index on low-cardinality column** (`status` with 3 values) — often useless without a partial index.

## Before you move on

- [ ] I can explain index → TID → heap with the phone book analogy
- [ ] I know when Seq Scan is fine (small table, low selectivity)
- [ ] I can name one use case each for B-tree, GIN, BRIN
- [ ] I can give an example where a composite index won't work
- [ ] I know `EXPLAIN ANALYZE` actually runs the query
- [ ] I run `ANALYZE` after bulk loads
- [ ] I check `idx_scan` for dead indexes

## What's next

Lab: [10-lab-indexes.md](10-lab-indexes.md) — generate 50k rows and watch Seq Scan vs Index Scan yourself.
