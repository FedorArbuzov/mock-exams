# 02. Flyway

## Сценарий с работы

Команда выбрала Flyway: SQL в git, DBA ревьюит PR, Java/Kotlin/Python devs читают миграции без XML. Первый инцидент — правка `V2__add_search.sql` после merge: prod `validate` падает с **checksum mismatch**. Второй — `CREATE INDEX` на 10M строк в транзакции — shop недоступен 20 минут.

Flyway прост, но у него **жёсткие правила**: immutable applied migrations, версии монотонны.

## Что вы узнаете

- Конвенцию имён и `flyway.conf`
- Команды info, migrate, validate, baseline
- `flyway_schema_history`
- `CREATE INDEX CONCURRENTLY` вне транзакции

## Конвенция имён

```text
sql/
  V1__init.sql
  V2__add_search.sql
  V3__add_promo_column.sql
  V2_1__hotfix_index.sql   -- optional patch version
```

| Часть | Правило |
|-------|---------|
| Prefix | `V` versioned, `U` undo (Teams), `R` repeatable |
| Version | Число или `1_2` |
| Separator | Двойное подчёркивание `__` |
| Description | snake_case, понятно в history |

Repeatable (`R__views.sql`) — переприменяется при изменении checksum.

## flyway.conf

См. [`examples/flyway/flyway.conf`](examples/flyway/flyway.conf):

```properties
flyway.url=jdbc:postgresql://localhost:5432/course
flyway.user=course
flyway.password=course
flyway.schemas=devapp
flyway.locations=filesystem:sql
```

Secrets в prod — CI variables ([14-ci-migrations](14-ci-migrations.md)), не в git.

## Команды

```bash
cd courses/postgresql-developer/examples/flyway
flyway info      # pending / success
flyway migrate   # apply pending
flyway validate  # checksums vs files
flyway repair    # fix failed entry (осторожно)
flyway baseline -baselineVersion=1  # существующая БД без history
```

`info` перед prod deploy — обязательный шаг.

## flyway_schema_history

```sql
SELECT installed_rank, version, description, type, script, checksum, success
FROM flyway_schema_history
ORDER BY installed_rank;
```

| Колонка | Смысл |
|---------|-------|
| version | V1, V2, ... |
| checksum | Hash файла — меняете файл → mismatch |
| success | false = failed migrate, блокирует следующие |

**Не править вручную** без `repair` и понимания.

## Best practices

### Одна логическая смена на файл

```text
V3__add_orders_promo.sql   — только promo
V4__index_orders_created   — только индекс
```

### CONCURRENTLY вне транзакции

PostgreSQL: `CREATE INDEX CONCURRENTLY` нельзя в transaction block.

Flyway 9+ для PostgreSQL:

```sql
-- V4__index_concurrent.sql
-- flyway:executeInTransaction=false
CREATE INDEX CONCURRENTLY orders_created_idx ON devapp.orders (created_at);
```

Или отдельный manual job DBA.

### Не destructive без backup

`DROP TABLE`, `TRUNCATE` — confirm + PITR window.

## baseline

БД существовала до Flyway (legacy):

```bash
flyway baseline -baselineVersion=1 -baselineDescription=existing_schema
```

Дальше только V2+.

## vs Liquibase

| | Flyway | Liquibase |
|---|--------|-----------|
| Формат | SQL-first | XML/YAML + SQL |
| Learning curve | Низкая | Средняя |
| Preconditions | Нет | Да |
| Undo | Forward-only / Teams | rollback blocks |

См. [04-liquibase](04-liquibase.md).

## Типичные ошибки

1. Правка V2 после apply на staging — validate fail everywhere.
2. Пропуск версии V3, есть V4 — Flyway error.
3. `CREATE INDEX` без CONCURRENTLY на prod.
4. `flyway.schemas` не совпадает с CREATE SCHEMA в SQL.
5. Пароль в `flyway.conf` в git.

## Чек-лист

- [ ] Именование V{version}__{desc}.sql
- [ ] validate в CI перед migrate
- [ ] checksum immutable после merge
- [ ] CONCURRENTLY + executeInTransaction=false
- [ ] baseline для legacy DB

## Дальше

Лаба: [03-lab-flyway.md](03-lab-flyway.md).
