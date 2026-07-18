# 04. Liquibase

## Сценарий с работы

Enterprise с Oracle + PostgreSQL + MySQL хочет **один** pipeline миграций. Flyway — SQL per engine; Liquibase — changelog с абстракциями и `preConditions` («применить только если колонки нет»). Команда shop на одном Postgres чаще остаётся на Flyway, но Liquibase встречается в Java/Spring и крупных монорепо.

Понимание Liquibase нужно для code review и собеседований — модель changeSet ≠ Flyway version file.

## Что вы узнаете

- Changelog и changeSet
- Таблицу `databasechangelog`
- Сравнение с Flyway
- Когда выбирать Liquibase

## Модель

```text
changelog.xml (root)
  └── changeSet id=1 author=course
  └── changeSet id=2 author=course
        └── sql / createTable / rollback
```

Каждый changeSet выполняется **один раз**. Запись в `databasechangelog`:

| Колонка | Смысл |
|---------|-------|
| id, author | Уникальный ключ changeSet |
| filename | changelog path |
| md5sum | Checksum содержимого |
| exectype | EXECUTED, MARK_RAN, FAILED |
| dateexecuted | Timestamp |

## Пример

См. [`examples/liquibase/changelog.xml`](examples/liquibase/changelog.xml):

```xml
<changeSet id="1" author="course">
  <sql>
    CREATE SCHEMA IF NOT EXISTS devapp_lb;
    CREATE TABLE devapp_lb.tasks (...);
  </sql>
</changeSet>
```

YAML/JSON/SQL changelogs — тот же движок.

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

`liquibase rollbackCount 1` — на staging; на prod чаще forward-only как в Flyway.

## preConditions

```xml
<preConditions onFail="MARK_RAN">
  <not><columnExists tableName="tasks" columnName="priority"/></not>
</preConditions>
```

Полезно при drift между env — осторожно, скрывает проблемы.

## Команды

```bash
cd courses/postgresql-developer/examples/liquibase
liquibase --defaults-file=liquibase.properties status
liquibase update
liquibase history
liquibase validate
```

## Сравнение с Flyway

| | Flyway | Liquibase |
|---|--------|-----------|
| Primary format | `.sql` files | Changelog + SQL |
| Versioning | V1, V2, V3 | changeSet id + author |
| History table | flyway_schema_history | databasechangelog |
| Rollback | Manual V{n+1} | Built-in rollback tags |
| Multi-DB | Duplicate SQL | Abstractions (частично) |
| DBA review | Отлично | XML шумнее |

## Когда Liquibase

- Несколько СУБД, один changelog
- Spring Boot default в некоторых шаблонах
- Сложные preconditions (feature flags)
- Org standard уже Liquibase

## Когда Flyway

- PostgreSQL-only, SQL-first
- Простота и прозрачность
- DBA пишет raw SQL

ORM: Django migrations, Alembic — для app-centric teams ([django](../django/README.md), [sqlalchemy-deep](../sqlalchemy-deep/README.md)).

## Типичные ошибки

1. Дублирующий id+author в changeSet — unpredictable.
2. Правка applied changeSet — md5sum drift.
3. XML `createTable` без schema — wrong namespace.
4. Rollback на prod без теста — data loss.
5. `update` из app pod — race condition.

## Чек-лист

- [ ] changeSet id + author уникальны
- [ ] databasechangelog vs flyway_schema_history
- [ ] Flyway для PG-only SQL
- [ ] Liquibase для multi-DB / preconditions
- [ ] Forward-only на prod предпочтительнее rollback

## Дальше

Лаба: [05-lab-liquibase.md](05-lab-liquibase.md).
