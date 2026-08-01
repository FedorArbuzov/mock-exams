# 07. Logical replication

## Real-world scenario

You need to copy **only** `orders` and `order_items` into a warehouse, not the whole cluster with `pg_catalog` and a hundred databases. A physical replica doesn't fit. Or a PG 15 → 16 migration: logical replication to a new cluster, cutover, rollback. A third case: `ALTER TABLE ADD COLUMN` on the primary — the subscriber **didn't** receive the DDL, and the pipeline broke.

Logical replication works at the level of **rows and tables** via publication/subscription. More expensive to operate, more flexible by scenario.

## What you'll learn

- Differences between physical vs logical
- Publication and subscription
- Use cases: upgrade, warehouse, partial replication
- Replication slots (logical) and WAL
- Monitoring and conflicts

## Physical vs logical

| | Physical (streaming) | Logical |
|---|---------------------|---------|
| Granularity | The whole cluster (WAL bytes) | Selected tables |
| DDL | Replicated | **Not** replicated automatically |
| PG versions | Usually the same major | Often a cross-major upgrade (test it) |
| Conflicts | None at the row level | Possible on the subscriber |
| Setup | `pg_basebackup` | `CREATE PUBLICATION` + `CREATE SUBSCRIPTION` |

`wal_level` on the primary: **`logical`**.

## Publication

```sql
CREATE PUBLICATION shop_pub FOR TABLE shop.products, shop.orders;
```

Or all tables in a schema (be careful):

```sql
CREATE PUBLICATION shop_all FOR ALL TABLES IN SCHEMA shop;
```

`FOR ALL TABLES` — new tables are picked up automatically; the subscriber needs the schema and structure.

Viewing:

```sql
SELECT * FROM pg_publication_tables;
```

## Subscription

On **another** database (the same or a different cluster):

```sql
CREATE SUBSCRIPTION shop_sub
  CONNECTION 'host=primary port=5432 dbname=course user=course password=course'
  PUBLICATION shop_pub
  WITH (copy_data = true, slot_name = shop_sub_slot);
```

| Option | Meaning |
|-------|-------|
| `copy_data = true` | Initial sync — COPY of existing rows |
| `slot_name` | Name of the logical replication slot on the primary |
| `create_slot = true` | Create the slot (default) |

Tables on the subscriber must **exist** with a compatible structure (indexes not required).

```sql
CREATE TABLE shop.products (LIKE shop.products INCLUDING ALL);
```

On the **same** cluster for the lab — a separate database `course_sub`, not just a schema.

## Use cases

1. **Major upgrade** — logical → new cluster, switch DNS, drop old.
2. **Warehouse / CDC** — Debezium, analytics DB, facts only.
3. **Multi-tenant extract** — a publication with a filter (PG 15+ `FOR TABLE ... WHERE`).

**Not** a default use case: HA instead of physical — for HA use streaming + Patroni.

## Slots and WAL

A logical slot retains WAL until it's delivered to the decoder. A dead subscription = a growing `pg_wal` ([03-wal](03-wal.md)).

```sql
SELECT slot_name, slot_type, active,
       pg_size_pretty(pg_wal_lsn_diff(pg_current_wal_lsn(), restart_lsn))
FROM pg_replication_slots;
```

Removal:

```sql
DROP SUBSCRIPTION shop_sub;  -- removes the subscription
-- the slot on the primary may remain — DROP SLOT manually
```

## Monitoring

```sql
SELECT subname, pid, received_lsn, latest_end_lsn, last_msg_send_time, last_msg_receipt_time
FROM pg_stat_subscription;

SELECT * FROM pg_stat_subscription_stats;
```

Worker states: `streaming`, `syncing`, errors in the subscriber logs.

## Conflicts

On the subscriber, when an `INSERT`/`UPDATE` conflicts with existing data:

```sql
-- on the subscriber
ALTER SUBSCRIPTION shop_sub DISABLE;
-- fix the data
ALTER SUBSCRIPTION shop_sub ENABLE;
```

Strategies: `disable`, skip, transform — depends on the version and settings. For production — a clear playbook.

## Common mistakes

1. DDL on the primary without applying it manually on the subscriber.
2. `wal_level=replica` — logical won't start.
3. A subscription on the same table without a separate database — confusion.
4. Forgot to drop the slot — the primary's disk fills up.

## Checklist

- [ ] Is DDL replicated? (no)
- [ ] When logical is better than physical
- [ ] An example of a conflict on the subscriber
- [ ] `FOR ALL TABLES` — the risk
- [ ] The link between a slot and WAL size

## Next

Lab: [08-lab-logical-replication.md](08-lab-logical-replication.md).
