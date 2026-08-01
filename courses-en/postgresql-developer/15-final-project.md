# 15. Final project: orders schema

## Scenario

Greenfield **orders** microservice in a shop: customers, orders, line items, async fulfillment jobs. Tech lead requirements: Flyway, JSONB meta, FTS on products, Postgres queue, API without N+1, CI migrate job.

You assemble everything from the course into one **reproducible** artifact.

## Task

Design and implement via **Flyway** a mini «Orders» service.

## Requirements

### 1. Schema (Flyway V1+)

| Table | Key fields |
|---------|---------------|
| `customers` | id, email UNIQUE, created_at |
| `products` | id, sku, name, price, search tsvector |
| `orders` | id, customer_id FK, status, meta jsonb, created_at |
| `order_items` | id, order_id FK, product_id FK, qty, price |
| `jobs` | id, payload jsonb, status, created_at |

Schema: `shop_orders` or `devapp` — your choice, consistent in `flyway.conf`.

### 2. JSONB meta on orders

```json
{"channel": "mobile", "promo": "SPRING10", "utm": {"source": "google"}}
```

Query: filter `@> '{"channel": "mobile"}'` + GIN index.

### 3. FTS on products

- Column `search tsvector`
- GIN index
- Trigger on INSERT/UPDATE name/sku
- API query with `ts_rank`

Copy the pattern from [`V2__add_search.sql`](examples/flyway/sql/V2__add_search.sql).

### 4. Jobs + SKIP LOCKED

On order create — INSERT job `{"order_id": N, "action": "fulfill"}`.

Worker SQL:

```sql
BEGIN;
SELECT id, payload FROM shop_orders.jobs
WHERE status = 'pending'
ORDER BY id FOR UPDATE SKIP LOCKED LIMIT 1;
-- UPDATE status = 'processing' → work → 'done'
COMMIT;
```

Prove two parallel workers — different jobs.

### 5. N+1 document

`API.md` — list orders with items and product names:

```sql
-- bad: N+1 pseudocode
-- good: your JOIN or selectinload
```

One EXPLAIN for the «good» query.

## Artifacts

```text
your-orders-service/
  sql/V1__init.sql
  sql/V2__fts_products.sql
  sql/V3__jobs_index.sql
  flyway.conf
  README.md          -- flyway migrate, SQL examples
  API.md               -- N+1, list orders query
  .gitlab-ci.yml       -- optional: migrate job
```

Forking [`examples/flyway`](examples/flyway/) is fine.

## Success criteria

- [ ] `flyway migrate` — history with no failed
- [ ] FTS with rank on products
- [ ] JSONB `@>` with GIN
- [ ] 2 parallel workers — different jobs
- [ ] API.md with JOIN against N+1 + EXPLAIN
- [ ] (Optional) GitLab CI migrate from [14-ci-migrations](14-ci-migrations.md)

## Self-review

| Question | OK? |
|--------|-----|
| Index on order_items.order_id? | |
| Index jobs (status, id)? | |
| Migrator role ≠ app role? | |
| CONCURRENTLY for large indexes? | |

## Related courses

| Course | Use |
|------|------------|
| [postgresql-performance](../postgresql-performance/README.md) | Indexes, EXPLAIN |
| [postgresql-security](../postgresql-security/README.md) | RLS tenant, app role |
| [fastapi](../fastapi/README.md) | API implementation |
| [aws-intermediate](../aws-intermediate/README.md) | RDS deploy |

## Congratulations

The **postgresql-developer** track is complete. The full PostgreSQL branch (~102 lessons) is a megacourse. Map: [`postgresql-path.md`](../postgresql-path.md).
