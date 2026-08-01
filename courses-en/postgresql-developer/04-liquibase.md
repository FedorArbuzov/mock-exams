# 04. Liquibase

## Scenario

An enterprise with Oracle + PostgreSQL + MySQL wants **one** migration pipeline. Flyway — SQL per engine; Liquibase — changelog with abstractions and `preConditions` («apply only if the column is missing»). A shop team on a single Postgres often stays on Flyway, but Liquibase shows up in Java/Spring and large monorepos.

Understanding Liquibase matters for code review and interviews — the changeSet model ≠ a Flyway version file.

## What you'll learn

- Changelog and changeSet
- The `databasechangelog` table
- Comparison with Flyway
- When to choose Liquibase

## Model

```text
changelog.xml (root)
  └── changeSet id=1 author=course
  └── changeSet id=2 author=course
        └── sql / createTable / rollback
```

Each changeSet runs **once**. A row in `databasechangelog`:

| Column | Meaning |
|---------|-------|
| id, author | Unique changeSet key |
| filename | changelog path |
| md5sum | Content checksum |
| exectype | EXECUTED, MARK_RAN, FAILED |
| dateexecuted | Timestamp |

## Example

See [`examples/liquibase/changelog.xml`](examples/liquibase/changelog.xml):

```xml
<changeSet id="1" author="course">
  <sql>
    CREATE SCHEMA IF NOT EXISTS devapp_lb;
    CREATE TABLE devapp_lb.tasks (...);
  </sql>
</changeSet>
```

YAML/JSON/SQL changelogs — same engine.

## Rollback blocks

```xml
<changeSet id="2" author="course">
  <addColumn tableName="tasks" schemaName="devapp_lb">
    <column name="priority" type="int"/>
  </addColumn>
  <rollback>
    <dropColumn tableName="tasks" columnName="priority"/>
  </rollback>
</changeSet>
```

`liquibase rollbackCount 1` — on staging; on prod more often forward-only as with Flyway.

## preConditions

```xml
<preConditions onFail="MARK_RAN">
  <not><columnExists tableName="tasks" columnName="priority"/></not>
</preConditions>
```

Useful for drift across envs — careful, it can hide problems.

## Commands

```bash
cd courses/postgresql-developer/examples/liquibase
liquibase --defaults-file=liquibase.properties status
liquibase update
liquibase history
liquibase validate
```

## Comparison with Flyway

| | Flyway | Liquibase |
|---|--------|-----------|
| Primary format | `.sql` files | Changelog + SQL |
| Versioning | V1, V2, V3 | changeSet id + author |
| History table | flyway_schema_history | databasechangelog |
| Rollback | Manual V{n+1} | Built-in rollback tags |
| Multi-DB | Duplicate SQL | Abstractions (partially) |
| DBA review | Excellent | XML is noisier |

## When Liquibase

- Multiple DBMS, one changelog
- Spring Boot default in some templates
- Complex preconditions (feature flags)
- Org standard already Liquibase

## When Flyway

- PostgreSQL-only, SQL-first
- Simplicity and transparency
- DBA writes raw SQL

ORM: Django migrations, Alembic — for app-centric teams ([django](../django/README.md), [sqlalchemy-deep](../sqlalchemy-deep/README.md)).

## Common mistakes

1. Duplicate id+author in changeSet — unpredictable.
2. Editing an applied changeSet — md5sum drift.
3. XML `createTable` without schema — wrong namespace.
4. Rollback on prod without testing — data loss.
5. `update` from an app pod — race condition.

## Checklist

- [ ] changeSet id + author are unique
- [ ] databasechangelog vs flyway_schema_history
- [ ] Flyway for PG-only SQL
- [ ] Liquibase for multi-DB / preconditions
- [ ] Forward-only on prod preferred over rollback

## Next

Lab: [05-lab-liquibase.md](05-lab-liquibase.md).
