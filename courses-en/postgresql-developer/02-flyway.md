# 02. Flyway

## Scenario

The team chose Flyway: SQL in git, DBA reviews PRs, Java/Kotlin/Python devs read migrations without XML. First incident — editing `V2__add_search.sql` after merge: prod `validate` fails with **checksum mismatch**. Second — `CREATE INDEX` on 10M rows in a transaction — shop down for 20 minutes.

Flyway is simple, but it has **strict rules**: immutable applied migrations, versions are monotonic.

## What you'll learn

- Naming convention and `flyway.conf`
- Commands info, migrate, validate, baseline
- `flyway_schema_history`
- `CREATE INDEX CONCURRENTLY` outside a transaction

## Naming convention

```text
sql/
  V1__init.sql
  V2__add_search.sql
  V3__add_promo_column.sql
  V2_1__hotfix_index.sql   -- optional patch version
```

| Part | Rule |
|-------|---------|
| Prefix | `V` versioned, `U` undo (Teams), `R` repeatable |
| Version | Number or `1_2` |
| Separator | Double underscore `__` |
| Description | snake_case, clear in history |

Repeatable (`R__views.sql`) — reapplied when the checksum changes.

## flyway.conf

See [`examples/flyway/flyway.conf`](examples/flyway/flyway.conf):

```properties
flyway.url=jdbc:postgresql://localhost:5432/course
flyway.user=course
flyway.password=course
flyway.schemas=devapp
flyway.locations=filesystem:sql
```

Secrets in prod — CI variables ([14-ci-migrations](14-ci-migrations.md)), not in git.

## Commands

```bash
cd courses/postgresql-developer/examples/flyway
flyway info      # pending / success
flyway migrate   # apply pending
flyway validate  # checksums vs files
flyway repair    # fix failed entry (careful)
flyway baseline -baselineVersion=1  # existing DB without history
```

`info` before a prod deploy — a required step.

## flyway_schema_history

```sql
SELECT installed_rank, version, description, type, script, checksum, success
FROM flyway_schema_history
ORDER BY installed_rank;
```

| Column | Meaning |
|---------|-------|
| version | V1, V2, ... |
| checksum | File hash — change the file → mismatch |
| success | false = failed migrate, blocks subsequent ones |

**Do not edit manually** without `repair` and understanding.

## Best practices

### One logical change per file

```text
V3__add_orders_promo.sql   — promo only
V4__index_orders_created   — index only
```

### CONCURRENTLY outside a transaction

PostgreSQL: `CREATE INDEX CONCURRENTLY` cannot run in a transaction block.

Flyway 9+ for PostgreSQL:

```sql
-- V4__index_concurrent.sql
-- flyway:executeInTransaction=false
CREATE INDEX CONCURRENTLY orders_created_idx ON devapp.orders (created_at);
```

Or a separate manual DBA job.

### No destructive ops without backup

`DROP TABLE`, `TRUNCATE` — confirm + PITR window.

## baseline

DB existed before Flyway (legacy):

```bash
flyway baseline -baselineVersion=1 -baselineDescription=existing_schema
```

Then only V2+.

## vs Liquibase

| | Flyway | Liquibase |
|---|--------|-----------|
| Format | SQL-first | XML/YAML + SQL |
| Learning curve | Low | Medium |
| Preconditions | No | Yes |
| Undo | Forward-only / Teams | rollback blocks |

See [04-liquibase](04-liquibase.md).

## Common mistakes

1. Editing V2 after apply on staging — validate fails everywhere.
2. Skipping version V3 when V4 exists — Flyway error.
3. `CREATE INDEX` without CONCURRENTLY on prod.
4. `flyway.schemas` does not match CREATE SCHEMA in SQL.
5. Password in `flyway.conf` in git.

## Checklist

- [ ] Naming V{version}__{desc}.sql
- [ ] validate in CI before migrate
- [ ] checksum immutable after merge
- [ ] CONCURRENTLY + executeInTransaction=false
- [ ] baseline for legacy DB

## Next

Lab: [03-lab-flyway.md](03-lab-flyway.md).
