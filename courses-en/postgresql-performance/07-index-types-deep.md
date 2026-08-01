# 07. Indexes: BRIN, GiST, partial, INCLUDE

## Scenario from work

The `events` table — 300 GB, a B-tree on `created_at` — 40 GB. A BRIN on the same column — 200 KB, and queries for the last week fly thanks to correlation. Another case: an index on `event_type` bloats INSERTs — but 95% of queries are only `event_type = 'error'` — a **partial index** is 20× smaller.

After [basic/09-indexes](../postgresql-basic/09-indexes-explain.md) — advanced index type selection and **covering** scans.

## What you'll learn

- BRIN vs B-tree for time-series
- GIN / GiST — when
- Partial and covering (INCLUDE) indexes
- Index Only Scan and the visibility map

## BRIN (Block Range INdex)

```sql
CREATE INDEX events_created_brin ON perf.events USING brin (created_at);
```

| | BRIN | B-tree on created_at |
|---|------|----------------------|
| Size | Very small | Large |
| Condition | Physical order ≈ logical | Any |
| Query | `created_at > ...` range | `=`, range, ORDER BY |
| UPDATE of old rows | Bad (breaks correlation) | OK |

Ideal: append-only time-series, logs, metrics ([advanced/03-partitioning](../postgresql-advanced/03-partitioning.md) + BRIN per partition).

## GIN and GiST

| Access method | Types / operators |
|---------------|------------------|
| **GIN** | `jsonb @>`, arrays, full-text, `pg_trgm` |
| **GiST** | PostGIS, range types, nearest-neighbor |

```sql
CREATE INDEX events_payload_gin ON perf.events USING gin (payload);
-- WHERE payload @> '{"alert": true}'
```

GIN — heavy on writes; use a partial GIN on the hot subset.

## Partial index

An index only on a subset:

```sql
CREATE INDEX events_errors_created_idx ON perf.events (created_at DESC)
WHERE event_type = 'error';
```

Works when the `WHERE` **matches** the index predicate (or implies it).

Pros: smaller size, faster INSERTs for the other rows.  
Con: a separate index for each hot predicate.

## Covering index (INCLUDE)

```sql
CREATE INDEX events_device_inc_idx ON perf.events (device_id)
INCLUDE (event_type, created_at);
```

A B-tree on `device_id` + payload columns in the leaves → **Index Only Scan** with no heap fetch (if the visibility map is OK).

```sql
EXPLAIN SELECT device_id, event_type, created_at
FROM perf.events WHERE device_id = 100;
```

| | INCLUDE | Composite (device_id, event_type, created_at) |
|---|---------|-----------------------------------------------|
| WHERE device_id = ? | Index Only possible | Yes |
| WHERE event_type = ? | No | Depends on column order |

## Decision tree

```text
time-series append-only, range on time     → BRIN (+ partition)
equality + range on scalar                 → B-tree
rare filter in WHERE (errors only)         → partial B-tree
cover SELECT list with a fixed WHERE       → INCLUDE
jsonb containment                          → GIN
geo                                        → GiST
```

## Index Only Scan and the VM

Postgres skips the heap if all columns are in the index and the **visibility map** says the page is all-visible. After a bulk UPDATE — the VM goes stale → heap fetches come back. A VACUUM is needed ([intermediate/11-vacuum-bloat](../postgresql-intermediate/11-vacuum-bloat.md)).

## Common mistakes

1. BRIN on a chaotically updated table — false positives, slower than a Seq Scan.
2. A partial index without a matching WHERE in the query.
3. INCLUDE of all table columns — the index becomes a copy of the table.
4. Forgetting CREATE INDEX CONCURRENTLY on prod — blocks writes.

## Checklist

- [ ] When BRIN is worse than B-tree
- [ ] Why a partial index
- [ ] INCLUDE vs composite
- [ ] Index Only Scan — the role of VACUUM
- [ ] GIN for jsonb `@>`

## Next

Lab: [08-lab-index-choice.md](08-lab-index-choice.md).
