# 05. Lab: Liquibase

## Why this lab

Apply a changelog or walk through it **tabletop** — understand `update` idempotency and `databasechangelog` structure before code-reviewing a Java service on Liquibase.

## Prerequisites

- [04-liquibase](04-liquibase.md)
- Postgres running
- Liquibase CLI (optional — tabletop is enough)

## Task 1. With CLI

```bash
cd courses/postgresql-developer/examples/liquibase
liquibase --defaults-file=liquibase.properties update
liquibase --defaults-file=liquibase.properties status
```

```bash
psql "postgresql://course:course@localhost:5432/course" -c "\dt devapp_lb.*"
psql "postgresql://course:course@localhost:5432/course" -c \
  "SELECT id, author, filename, md5sum, exectype FROM databasechangelog;"
```

Expected: `devapp_lb.tasks` exists, 1 row in `databasechangelog`.

## Task 2. Repeat update

```bash
liquibase update
```

Expected: **no changes** — changeSet id=1 already EXECUTED. That is idempotency.

## Task 3. Tabletop (without CLI)

Open [`changelog.xml`](examples/liquibase/changelog.xml). Answer:

| # | Question | Your answer |
|---|--------|-----------|
| 1 | changeSet execution order | id=1 first in the file |
| 2 | What on a repeat `update`? | Skip, MARK_RAN/EXECUTED |
| 3 | databasechangelog columns | id, author, filename, md5sum, ... |
| 4 | Where is schema `devapp_lb`? | In SQL inside the changeSet |

## Task 4. New changeSet (optional)

Add to `changelog.xml`:

```xml
<changeSet id="2" author="course">
  <addColumn schemaName="devapp_lb" tableName="tasks">
    <column name="priority" type="int" defaultValueNumeric="0"/>
  </addColumn>
</changeSet>
```

```bash
liquibase update
psql ... -c "\d devapp_lb.tasks"
```

Expected: column `priority`.

## Task 5. Comparison with Flyway

Fill in after [03-lab-flyway](03-lab-flyway.md):

| | Flyway V2 | Liquibase changeSet 1 |
|---|-----------|----------------------|
| History table | flyway_schema_history | databasechangelog |
| Format | .sql file | XML + SQL |
| Repeat run | Skip by version | Skip by id+author |

## Troubleshooting

| Problem | Fix |
|----------|-----|
| Validation Failed | changelog path in properties |
| changeSet already exists | id collision — change id |
| Permission denied | user course needs CREATE |
| XML parse error | check xmlns |

## Success criteria

- [ ] `devapp_lb.tasks` created OR tabletop 4 questions
- [ ] Repeat update with no changes
- [ ] Understanding id+author as the key
- [ ] Comparison with Flyway

## Next

N+1: [06-n-plus-one.md](06-n-plus-one.md).
