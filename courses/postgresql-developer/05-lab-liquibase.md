# 05. Лаба: Liquibase

## Зачем эта лаба

Применить changelog или разобрать его **tabletop** — понять идемпотентность `update` и структуру `databasechangelog` перед code review Java-сервиса на Liquibase.

## Предусловия

- [04-liquibase](04-liquibase.md)
- Postgres running
- Liquibase CLI (опционально — tabletop достаточен)

## Задание 1. С CLI

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

Ожидание: `devapp_lb.tasks` существует, 1 строка в `databasechangelog`.

## Задание 2. Повторный update

```bash
liquibase update
```

Ожидание: **no changes** — changeSet id=1 уже EXECUTED. Это идемпотентность.

## Задание 3. Tabletop (без CLI)

Откройте [`changelog.xml`](examples/liquibase/changelog.xml). Ответьте:

| # | Вопрос | Ваш ответ |
|---|--------|-----------|
| 1 | Порядок выполнения changeSet | id=1 первый в файле |
| 2 | Что при повторном `update`? | Skip, MARK_RAN/EXECUTED |
| 3 | Колонки databasechangelog | id, author, filename, md5sum, ... |
| 4 | Где schema `devapp_lb`? | В SQL внутри changeSet |

## Задание 4. Новый changeSet (опционально)

Добавьте в `changelog.xml`:

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

Ожидание: колонка `priority`.

## Задание 5. Сравнение с Flyway

Заполните после [03-lab-flyway](03-lab-flyway.md):

| | Flyway V2 | Liquibase changeSet 1 |
|---|-----------|----------------------|
| History table | flyway_schema_history | databasechangelog |
| Format | .sql file | XML + SQL |
| Repeat run | Skip by version | Skip by id+author |

## Troubleshooting

| Проблема | Fix |
|----------|-----|
| Validation Failed | changelog path в properties |
| changeSet already exists | id collision — сменить id |
| Permission denied | user course needs CREATE |
| XML parse error | проверить xmlns |

## Критерии успеха

- [ ] `devapp_lb.tasks` создана ИЛИ tabletop 4 вопроса
- [ ] Повторный update без изменений
- [ ] Понимание id+author как ключа
- [ ] Сравнение с Flyway

## Дальше

N+1: [06-n-plus-one.md](06-n-plus-one.md).
