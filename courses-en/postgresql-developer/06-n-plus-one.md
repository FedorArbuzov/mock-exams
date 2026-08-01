# 06. N+1 and query patterns

## Scenario

API `GET /orders` returns 200 orders in 80 ms — «fast». APM shows **201 queries** to Postgres: 1 list + 200 `SELECT product WHERE id = ?`. Under load latency hits 2 s, pool exhausted, 503.

**N+1** — classic ORM anti-pattern. Postgres handles it with one JOIN; the problem is **round-trips** and planning on the app side.

**Related:** [sqlalchemy-deep](../sqlalchemy-deep/README.md), [performance/01](../postgresql-performance/README.md), [fastapi](../fastapi/README.md).

## What you'll learn

- How N+1 arises
- JOIN, batch IN, eager loading
- ORM anti-patterns
- Measuring with EXPLAIN and APM

## The N+1 problem

```text
Handler:
  orders = SELECT * FROM orders LIMIT 200     -- 1 query
  for o in orders:
    product = SELECT * FROM products WHERE id = o.product_id  -- N queries
Total: N + 1 round-trips
```

Each round-trip — latency (0.5–2 ms LAN, more through a pooler). 200 × 1 ms = 200 ms network alone.

```python
# SQLAlchemy lazy — classic trap
for order in session.scalars(select(Order).limit(200)):
    print(order.product.name)  # lazy load every time
```

## Solution 1: JOIN

```sql
SELECT o.id, o.qty, o.created_at,
       p.id AS product_id, p.name, p.price
FROM devapp.orders o
JOIN devapp.products p ON p.id = o.product_id
ORDER BY o.created_at DESC
LIMIT 200;
```

One plan, one round-trip. Index on `orders.product_id` (FK) — [basic/09-indexes](../postgresql-basic/09-indexes-explain.md).

SQLAlchemy:

```python
select(Order).options(joinedload(Order.product)).limit(200)
```

Django: `select_related('product')`.

## Solution 2: Batch IN

When JOIN inflates rows (many items):

```sql
-- 1) orders
SELECT id, product_id FROM devapp.orders LIMIT 200;
-- 2) products in one query
SELECT * FROM devapp.products WHERE id IN (1, 5, 7, ...);
```

Two queries instead of 201. DataLoader pattern in GraphQL.

## Solution 3: Eager loading deliberately

| Pattern | When |
|---------|-------|
| `joinedload` | Many-to-one, few columns |
| `selectinload` | One-to-many collections |
| `subqueryload` | Rarely, careful with volume |

Default lazy — handy in a shell, dangerous in an API.

## Other anti-patterns

| Anti-pattern | Effect |
|--------------|--------|
| `SELECT *` on a wide table | IO, network |
| No LIMIT on lists | OOM, full scan |
| COUNT(*) in a loop | N counts |
| OFFSET 100000 | Seq scan — keyset pagination |
| N+1 in async | Worse — await × N |

## Measurement

### EXPLAIN

```sql
EXPLAIN (ANALYZE, BUFFERS)
SELECT ... JOIN ...;
```

One Index Scan / Nested Loop — good. 200 loops — suspect N+1 in the app, not in a single SQL.

### APM / OpenTelemetry

Span per DB query — spike count on the endpoint. SQLAlchemy: `echo=True` dev only; production — OTel instrumentation.

## JOIN vs two queries

| | JOIN | 2 queries IN |
|---|------|--------------|
| Round-trips | 1 | 2 |
| Row duplication | Inflates on 1:N | No |
| ORM cache | Simpler | Harder merge |
| Typical case | Order + Product | Order + 50 line items |

## Common mistakes

1. «We use an ORM, it optimizes» — not by default.
2. JOIN 20 tables «just in case» — cartesian risk.
3. Forgot index on FK — Nested Loop with Seq Scan on products.
4. N+1 only at prod data volume — dev with 5 rows looks «fast».
5. GraphQL without DataLoader — N+1 on every field.

## Checklist

- [ ] N+1 = 1 + N round-trips
- [ ] joinedload / select_related for lists
- [ ] Index on FK product_id
- [ ] EXPLAIN + APM query count
- [ ] LIMIT / keyset on lists

## Next

Lab: [07-lab-n-plus-one.md](07-lab-n-plus-one.md).
