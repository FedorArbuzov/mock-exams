# 06. Лаба: роли и GRANT

## Зачем эта лаба

В [05-roles-privileges](05-roles-privileges.md) — теория least privilege. Здесь вы **разделите** доступ к схеме `shop`: читатель не пишет, писатель не лезет в DDL. Так же устроены реальные `DATABASE_URL` для API и readonly-реплики для отчётов.

После лабы вы сможете воспроизвести типичный ответ на собесе: «как дать приложению доступ только к одной схеме».

## Предусловия

- Схема `shop` из [04-lab-ddl](04-lab-ddl.md) на месте.
- Подключение как `course` (суперпользователь стенда).

## Задание 1. Создать роли приложения

```sql
CREATE ROLE shop_reader LOGIN PASSWORD 'reader_pass';
CREATE ROLE shop_writer LOGIN PASSWORD 'writer_pass';
```

Проверка:

```sql
\du shop_*
```

## Задание 2. Выдать минимальные права

```sql
GRANT CONNECT ON DATABASE course TO shop_reader, shop_writer;
GRANT USAGE ON SCHEMA shop TO shop_reader, shop_writer;

GRANT SELECT ON ALL TABLES IN SCHEMA shop TO shop_reader;

GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA shop TO shop_writer;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA shop TO shop_writer;
```

Почему writer нужен `USAGE, SELECT ON SEQUENCES`: `serial`/`bigserial` используют sequence; без права INSERT в `orders` упадёт на `nextval`.

**Для будущих таблиц** (если migrator = `course`):

```sql
ALTER DEFAULT PRIVILEGES IN SCHEMA shop
  GRANT SELECT ON TABLES TO shop_reader;
ALTER DEFAULT PRIVILEGES IN SCHEMA shop
  GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO shop_writer;
ALTER DEFAULT PRIVILEGES IN SCHEMA shop
  GRANT USAGE, SELECT ON SEQUENCES TO shop_writer;
```

## Задание 3. Проверка reader — SELECT да, INSERT нет

С хоста (два отдельных вызова):

```bash
psql "postgresql://shop_reader:reader_pass@localhost:5432/course" \
  -c "SELECT count(*) FROM shop.products;"

psql "postgresql://shop_reader:reader_pass@localhost:5432/course" \
  -c "INSERT INTO shop.products (sku,name,price) VALUES ('x','y',1);"
```

| Запрос | Ожидание |
|--------|----------|
| `SELECT count(*)` | Успех, число ≥ 2 |
| `INSERT` | `ERROR: permission denied for table products` |

Windows PowerShell — те же команды в одну строку или через `docker exec`:

```bash
docker exec mock-postgres psql "postgresql://shop_reader:reader_pass@localhost:5432/course" -c "SELECT count(*) FROM shop.products;"
```

## Задание 4. Проверка writer

```bash
psql "postgresql://shop_writer:writer_pass@localhost:5432/course" \
  -c "INSERT INTO shop.products (sku,name,price) VALUES ('C3','Cable', 4.99) RETURNING id;"
```

Должен вернуть новый `id`. Reader после этого видит строку:

```bash
psql "postgresql://shop_reader:reader_pass@localhost:5432/course" \
  -c "SELECT sku FROM shop.products WHERE sku = 'C3';"
```

## Задание 5. ACL в psql

Под `course`:

```sql
\dp shop.*
```

Колонки показывают, кто что может (`r`=SELECT, `a`=INSERT, …). Сверьте с ожиданием для `shop_reader` и `shop_writer`.

## Задание 6. application_name (preview)

```bash
psql "postgresql://shop_writer:writer_pass@localhost:5432/course?application_name=lab06" -c "SELECT 1;"
```

Под `course`:

```sql
SELECT application_name, usename, state
FROM pg_stat_activity
WHERE application_name = 'lab06';
```

Так в проде отличают пул приложения от ad-hoc сессии DBA ([07-connections-psql](07-connections-psql.md)).

## Если что-то пошло не так

| Симптом | Причина |
|---------|---------|
| `password authentication failed` | Опечатка; роль не LOGIN; hba |
| `permission denied for schema shop` | Нет `USAGE ON SCHEMA` |
| `permission denied for sequence` | Writer без прав на sequence |
| Reader может INSERT | Подключились не той ролью; лишний GRANT |

Удалить роли для переделки:

```sql
REASSIGN OWNED BY shop_reader TO course;
REASSIGN OWNED BY shop_writer TO course;
DROP OWNED BY shop_reader;
DROP OWNED BY shop_writer;
DROP ROLE shop_reader, shop_writer;
```

## Критерии успеха

- [ ] `shop_reader`: SELECT OK, INSERT denied
- [ ] `shop_writer`: INSERT/UPDATE OK
- [ ] `\dp shop.*` отражает разделение прав
- [ ] Понимаете, почему runtime не использует `course`

## Дальше

Подключения, psql, пулы: [07-connections-psql.md](07-connections-psql.md).
