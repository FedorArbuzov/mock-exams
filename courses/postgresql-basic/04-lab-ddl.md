# 04. Лаба: DDL и базовые объекты

## Зачем эта лаба

В [03-databases-schemas](03-databases-schemas.md) вы разобрали иерархию объектов. Здесь вы **создаёте** учебную схему `shop` — тот же домен «магазин», что в [fastapi](../../deploy/fastapi/README.md) и [django](../../deploy/django/README.md). Эта схема будет жить до конца basic-курса: роли, индексы, MVCC, бэкапы.

DDL (Data Definition Language) — `CREATE`, `ALTER`, `DROP`. Ошибки в DDL дорогие: долгие блокировки, потеря данных при `DROP CASCADE`. На стенде можно экспериментировать; в проде DDL идёт через миграции ([developer/02-flyway](../postgresql-developer/02-flyway.md)).

## Предусловия

- Стенд из [02-lab-install](02-lab-install.md) запущен.
- Подключение: `psql "postgresql://course:course@localhost:5432/course"` или `docker exec -it mock-postgres psql -U course -d course`.

Если схема `shop` уже есть с прошлой попытки:

```sql
DROP SCHEMA IF EXISTS shop CASCADE;
```

## Задание 1. Схема и таблицы с ограничениями

```sql
CREATE SCHEMA shop AUTHORIZATION course;

CREATE TABLE shop.products (
  id    serial PRIMARY KEY,
  sku   text NOT NULL UNIQUE,
  name  text NOT NULL,
  price numeric(10,2) NOT NULL CHECK (price >= 0)
);

CREATE TABLE shop.orders (
  id         bigserial PRIMARY KEY,
  product_id int NOT NULL REFERENCES shop.products(id),
  qty        int NOT NULL CHECK (qty > 0),
  created_at timestamptz DEFAULT now()
);
```

**Проверка структуры:**

```sql
\d shop.products
\d shop.orders
```

Ожидайте: PK, UNIQUE на `sku`, FK `orders_product_id_fkey`, CHECK на `price` и `qty`.

### Проверка FK (должна упасть)

```sql
INSERT INTO shop.orders (product_id, qty) VALUES (999, 1);
```

Ошибка: `violates foreign key constraint` — Postgres не даст «висячую» ссылку.

### Проверка UNIQUE

```sql
INSERT INTO shop.products (sku, name, price) VALUES ('A1', 'Dup', 1);
INSERT INTO shop.products (sku, name, price) VALUES ('A1', 'Dup2', 2);
```

Второй INSERT — `duplicate key value violates unique constraint`.

## Задание 2. Индекс под запросы по дате

```sql
CREATE INDEX orders_created_idx ON shop.orders (created_at DESC);
```

Пока данных мало, планировщик может игнорировать индекс — это нормально. В [10-lab-indexes](10-lab-indexes.md) наполним таблицу и увидим разницу в `EXPLAIN`.

```sql
\d shop.orders
```

В списке индексов должен быть `orders_created_idx`.

## Задание 3. Тестовые данные

```sql
INSERT INTO shop.products (sku, name, price) VALUES
  ('A1', 'Widget', 9.99),
  ('B2', 'Gadget', 19.50);

INSERT INTO shop.orders (product_id, qty) VALUES (1, 2), (2, 1);

SELECT p.name, o.qty, o.created_at
FROM shop.orders o
JOIN shop.products p ON p.id = o.product_id;
```

**Ожидаемый результат:** две строки с Widget/Gadget.

## Задание 4. Размер объектов

```sql
SELECT relname,
       pg_size_pretty(pg_relation_size(oid)) AS table_size
FROM pg_class
WHERE relnamespace = 'shop'::regnamespace
  AND relkind = 'r'
ORDER BY relname;
```

На маленьких таблицах размеры — килобайты. Запомните запрос: в проде он первый шаг при «диск кончился».

## Задание 5. search_path (опционально)

```sql
SET search_path TO shop, public;
SELECT * FROM products;
RESET search_path;
```

Без префикса схемы работает только при правильном `search_path`. В приложениях предпочтительнее **явные** имена `shop.products`.

## Если что-то пошло не так

| Ошибка | Решение |
|--------|---------|
| `schema "shop" already exists` | `DROP SCHEMA shop CASCADE;` и заново |
| `permission denied` | Подключитесь как `course`, не как `shop_reader` |
| `relation does not exist` | Проверьте `search_path` или пишите `shop.table` |

## Критерии успеха

- [ ] Схема `shop` с таблицами `products` и `orders`
- [ ] FK отклоняет неверный `product_id`
- [ ] UNIQUE на `sku` работает
- [ ] Индекс `orders_created_idx` виден в `\d shop.orders`
- [ ] JOIN возвращает осмысленные строки

## Дальше

Безопасность доступа: [05-roles-privileges.md](05-roles-privileges.md) → лаба [06-lab-roles.md](06-lab-roles.md).
