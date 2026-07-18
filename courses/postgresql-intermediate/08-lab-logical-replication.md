# 08. Лаба: logical publication

## Зачем эта лаба

Publication/subscription один раз настроить в документации легко; на практике путают **БД subscriber**, забывают `wal_level=logical` и структуру таблицы. Лаба на одном кластере с БД `course_sub` — минимальный рабочий pipeline.

## Предусловия

- Primary на 5432, схема `shop`, таблица `products`.
- Готовность к **restart** для `wal_level = logical`.

## Задание 1. wal_level logical

```sql
SHOW wal_level;
```

Если не `logical`:

```sql
ALTER SYSTEM SET wal_level = 'logical';
```

Restart:

```bash
docker compose -f deploy/postgres/docker-compose.yml restart postgres
```

Проверка:

```sql
SHOW wal_level;
```

## Задание 2. Publication на primary (course)

```sql
DROP PUBLICATION IF EXISTS lab_pub;
CREATE PUBLICATION lab_pub FOR TABLE shop.products;
```

```sql
SELECT pubname, schemaname, tablename FROM pg_publication_tables;
```

## Задание 3. База subscriber

```sql
CREATE DATABASE course_sub;
```

Подключитесь к `course_sub`:

```bash
psql "postgresql://course:course@localhost:5432/course_sub"
```

Создайте структуру (та же, что на primary):

```sql
CREATE SCHEMA shop;

CREATE TABLE shop.products (
  id    serial PRIMARY KEY,
  sku   text NOT NULL UNIQUE,
  name  text NOT NULL,
  price numeric(10,2) NOT NULL CHECK (price >= 0)
);
```

**Важно:** имена колонок и типы должны совпадать с publisher.

## Задание 4. Subscription

В `course_sub`:

```sql
CREATE SUBSCRIPTION lab_sub
  CONNECTION 'host=localhost port=5432 dbname=course user=course password=course'
  PUBLICATION lab_pub
  WITH (copy_data = true);
```

Проверка статуса (в `course` или `course_sub`):

```sql
SELECT subname, pid, received_lsn IS NOT NULL AS receiving
FROM pg_stat_subscription;
```

На primary — slot:

```sql
\c course
SELECT slot_name, slot_type, active FROM pg_replication_slots;
```

**Ожидание:** `lab_sub` или имя slot, `active = true`, initial copy завершился.

## Задание 5. Репликация INSERT

На **primary** (`course`):

```sql
INSERT INTO shop.products (sku, name, price)
VALUES ('Z9', 'Logical New', 1.00);
```

На **subscriber** (`course_sub`):

```sql
SELECT * FROM shop.products WHERE sku = 'Z9';
```

**Ожидание:** строка появилась без ручного INSERT на subscriber.

## Задание 6. DDL не летит (демонстрация)

На primary:

```sql
ALTER TABLE shop.products ADD COLUMN color text;
```

На subscriber:

```sql
\d shop.products
```

Колонки `color` **нет** — subscription не применяет DDL. Нужно вручную:

```sql
ALTER TABLE shop.products ADD COLUMN color text;
```

Запишите вывод: «после DDL на primary — ALTER на subscriber, иначе pipeline error».

## Задание 7. Очистка (опционально)

```sql
\c course_sub
DROP SUBSCRIPTION lab_sub;
\c course
DROP PUBLICATION lab_pub;
SELECT pg_drop_replication_slot('lab_sub');  -- имя из pg_replication_slots
```

## Если что-то пошло не так

| Симптом | Решение |
|---------|---------|
| `could not connect` | CONNECTION string, hba, пароль |
| `relation does not exist` | Таблица на subscriber до subscription |
| `logical decoding requires wal_level` | restart после logical |
| Дубликаты при copy_data | Пустая таблица subscriber перед подпиской |
| Slot exists | DROP SUBSCRIPTION ... ; DROP SLOT |

## Критерии успеха

- [ ] `wal_level = logical`
- [ ] INSERT на primary виден на `course_sub`
- [ ] `pg_stat_subscription` в рабочем состоянии
- [ ] Понимаете `copy_data` и отсутствие DDL sync

## Дальше

PITR: [09-pitr.md](09-pitr.md).
