# 03. Лаба: Flyway

## Зачем эта лаба

Пройти полный цикл: `flyway info` → `migrate` → проверка схемы и FTS из V2 — как в CI перед деплоем shop-api.

## Предусловия

- [`deploy/postgres`](../../deploy/postgres/README.md) запущен
- [Flyway CLI](https://flywaydb.org/download) установлен
- [02-flyway](02-flyway.md)

## Задание 1. Проверка конфига

```bash
cd courses/postgresql-developer/examples/flyway
cat flyway.conf
flyway info
```

Ожидание: V1, V2 в статусе **Pending** (чистая БД) или **Success** (уже мигрировали).

## Задание 2. migrate

```bash
flyway migrate
flyway info
```

Ожидание: все скрипты `Success`, нет `Failed`.

При ошибке:

```bash
flyway info   # какая версия failed
# исправить SQL, flyway repair (dev only) или reset DB
```

## Задание 3. Проверка схемы

```bash
psql "postgresql://course:course@localhost:5432/course" -c "\dt devapp.*"
psql "postgresql://course:course@localhost:5432/course" -c \
  "SELECT version, description, success FROM flyway_schema_history ORDER BY installed_rank;"
```

Ожидание:

| Таблица | Есть |
|---------|------|
| `devapp.products` | ✅ |
| `devapp.orders` | ✅ |
| колонка `products.search` | ✅ (V2) |

## Задание 4. FTS после V2

```sql
INSERT INTO devapp.products (sku, name, price)
VALUES ('A1', 'Widget Pro', 9.99);

SELECT sku, name, search
FROM devapp.products
WHERE search @@ plainto_tsquery('simple', 'widget');
```

Ожидание: 1 строка — trigger обновил `search` на INSERT.

```sql
UPDATE devapp.products SET name = 'Super Widget' WHERE sku = 'A1';
SELECT search @@ plainto_tsquery('simple', 'super') AS matches;
```

Ожидание: `matches = t`.

## Задание 5. validate

```bash
flyway validate
```

Ожидание: успех. Измените байт в `V1__init.sql` локально — validate должен **упасть** (верните файл).

## Сброс стенда (опционально)

```bash
# в deploy/postgres
docker compose down -v && docker compose up -d
```

Или:

```sql
DROP SCHEMA devapp CASCADE;
TRUNCATE flyway_schema_history;  -- только dev!
```

## Troubleshooting

| Проблема | Причина | Fix |
|----------|---------|-----|
| Connection refused | Postgres down | docker compose up |
| Schema devapp does not exist | schemas= mismatch | flyway.conf |
| Checksum mismatch | правили applied SQL | repair / reset |
| EXECUTE FUNCTION error | PG < 14 | `EXECUTE PROCEDURE` в trigger |

## Критерии успеха

- [ ] `flyway migrate` без ошибок
- [ ] `devapp.products`, `devapp.orders` существуют
- [ ] FTS на INSERT/UPDATE работает
- [ ] `flyway validate` OK
- [ ] Понимание flyway_schema_history

## Дальше

Liquibase: [04-liquibase.md](04-liquibase.md).
