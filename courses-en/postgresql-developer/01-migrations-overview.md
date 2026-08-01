# 01. Schema migrations overview

## Scenario

Friday, shop-api deploy. A developer manually ran `ALTER TABLE orders ADD COLUMN promo_code` on prod — staging was not updated. On Monday CI fails: «column already exists». In parallel another engineer rolls back the app release, but the **DB schema is ahead of the code** — 500s on the old version.

Without **schema versioning**, dev/stage/prod drift apart. Migrations are DDL as code: review in PR, apply via CI, history in a table.

**Prerequisites:** [basic/03-databases-schemas](../postgresql-basic/03-databases-schemas.md), [basic/04-lab-ddl](../postgresql-basic/04-lab-ddl.md).

## What you'll learn

- Why version the schema
- Flyway vs Liquibase vs ORM migrations
- Idempotency and forward-only rollback
- Expand/contract for zero-downtime

## Why version

| Without migrations | With migrations |
|--------------|--------------|
| «Works on my machine» | Same schema everywhere |
| DDL in Slack | DDL in a git PR |
| Who changed what — unknown | `flyway_schema_history` |
| App rollback ≠ schema rollback | Deliberate schema strategy |

```text
Developer → PR (V3__add_promo.sql) → CI flyway migrate → staging
         → merge → CD migrate prod → deploy app
```

## Approaches

| Approach | Pros | Cons |
|--------|-------|-------|
| SQL files (Flyway) | Transparent, DBA-friendly | No built-in DOWN |
| Changelog XML/YAML (Liquibase) | Preconditions, rollback blocks | More complex, XML |
| ORM (Alembic, Django) | Next to models | Hidden DDL, drift from raw SQL |
| Manual psql | Fast «one-off» | Disaster at scale |

For this course — **Flyway** (primary) + understanding **Liquibase**. In FastAPI — Alembic ([fastapi/16-lab-postgres](../fastapi/16-lab-postgres.md)); same principles.

## Idempotency

A migration is applied **exactly once** — the tracker (Flyway/Liquibase) decides, not `IF NOT EXISTS` on prod:

```sql
-- bad as the only safeguard on prod:
CREATE TABLE IF NOT EXISTS orders (...);

-- good: version V1 in flyway_schema_history
CREATE TABLE orders (...);
```

`IF NOT EXISTS` — for local debugging, not a substitute for versioning.

## Rollback strategies

### 1. Forward-only (recommended)

Rollback = a **new migration**:

```sql
-- V4 added promo_code
-- V5 rolls it back logically:
ALTER TABLE orders DROP COLUMN promo_code;
```

On prod with data, `DROP COLUMN` — only after the contract phase.

### 2. Expand / contract

```text
V4: ADD promo_code NULLABLE     — expand (old app ignores it)
deploy app v2 (writes promo)
V5: SET NOT NULL + default      — contract
V6: DROP old_column             — contract
```

See [ops/08-zero-downtime](../postgresql-ops/08-zero-downtime.md).

### 3. Restore from backup

Disaster — PITR ([intermediate/09-pitr](../postgresql-intermediate/09-pitr.md)). Not a «migration rollback».

## Who applies migrations

| Anti-pattern | Why it's bad |
|--------------|--------------|
| App on startup `migrate()` | Race with 10 pods, no audit |
| DBA manually on prod | Not in git |
| CI job `flyway migrate` | ✅ One runner, logs, secrets |

Separate role `shop_migrator` — [security/02-scram](../postgresql-security/02-scram-auth.md).

## Common mistakes

1. `DROP COLUMN` without contract — old app crashes.
2. Long `CREATE INDEX` in a transaction — locks the table ([performance](../postgresql-performance/README.md)).
3. Editing already-applied V2.sql — checksum mismatch.
4. Migrations after app deploy — expand broken.
5. One migration = 15 unrelated changes — hard rollback.

## Checklist

- [ ] Why version vs manual DDL
- [ ] Forward-only vs DOWN
- [ ] Expand/contract for ADD/DROP column
- [ ] CI applies migrations, not the app pod
- [ ] History in `flyway_schema_history`

## Next

Flyway: [02-flyway.md](02-flyway.md).
