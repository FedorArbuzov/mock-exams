# 10. Лаба: индексы и план

## Зачем эта лаба

Теория [09-indexes-explain](09-indexes-explain.md) без практики не приживается: цифры `cost` и `rows` в плане нужно увидеть на **реальной** таблице с десятками тысяч строк. Вы сгенерируете данные, поймаете Seq Scan, добавите индекс и сравните `EXPLAIN (ANALYZE, BUFFERS)`. Затем попробуете составной, partial и functional индекс — те темы, которые в теории легко «прочитать и забыть».

Это тот же навык, что при разборе медленного API endpoint в [fastapi](../fastapi/README.md) или N+1 в [developer/06-n-plus-one](../postgresql-developer/06-n-plus-one.md).

## Предусловия

- Схема `shop` с таблицами `products` и `orders` ([04-lab-ddl](04-lab-ddl.md)).
- Подключение как `course`.

## Задание 1. Наполнить orders

```sql
INSERT INTO shop.orders (product_id, qty)
SELECT (random() * 2 + 1)::int,
       (random() * 5 + 1)::int
FROM generate_series(1, 50000);

ANALYZE shop.orders;
```

Проверка:

```sql
SELECT count(*) FROM shop.orders;
SELECT product_id, count(*) FROM shop.orders GROUP BY 1 ORDER BY 1;
```

Ожидайте ~50002 строки (2 старых + 50000) и распределение по product_id 1, 2, 3.

**Зачем `ANALYZE` сразу после INSERT:** планировщик узнает реальный размер таблицы. Без этого в `EXPLAIN` будут неверные `rows=` и он может выбрать не тот план.

## Задание 2. Seq Scan до индекса

Убедитесь, что индекса на `product_id` нет (если создавали ранее — удалите для эксперимента):

```sql
DROP INDEX IF EXISTS shop.orders_product_id_idx;
ANALYZE shop.orders;
```

План:

```sql
EXPLAIN (ANALYZE, BUFFERS)
SELECT * FROM shop.orders WHERE product_id = 1;
```

**Запишите в блокнот (это привычка on-call):**

| Поле | Ваше значение |
|------|---------------|
| Узел плана | ожидаем **Seq Scan** |
| `actual rows` | ~⅓ от actual rows от 50k |
| `Rows Removed by Filter` | сколько строк прочитали зря |
| `Execution Time` | |
| `Buffers: shared read` / `hit` | read = с диска, hit = из RAM |

На ~50k строк Seq Scan всё ещё может быть быстрым (десятки миллисекунд) — смотрите на **узел плана** и `Rows Removed by Filter`, не только на время. Postgres прочитал почти всю таблицу и выбросил лишнее — именно это индекс должен убрать.

## Задание 3. Index Scan после индекса

```sql
CREATE INDEX orders_product_id_idx ON shop.orders (product_id);
ANALYZE shop.orders;

EXPLAIN (ANALYZE, BUFFERS)
SELECT * FROM shop.orders WHERE product_id = 1;
```

Ожидайте **Index Scan** или **Bitmap Index Scan** + **Bitmap Heap Scan**.

Сравните с заданием 2:

| Метрика | До индекса | После |
|---------|------------|-------|
| Узел плана | Seq Scan | Index / Bitmap |
| `Rows Removed by Filter` | почти все строки | 0 или мало |
| Buffers | часто больше read | меньше при селективном фильтре |
| Execution Time | зависит от кэша | обычно ниже на больших таблицах |

**Вопрос себе:** индекс ускорил запрос? Если разница в миллисекундах — нормально на 50k. На 5M строк разрыв был бы в секунды. Лаба учит **читать план**, а не гоняться за таймингом на маленьких данных.

## Задание 4. Оценка vs факт

```sql
EXPLAIN SELECT * FROM shop.orders WHERE product_id = 1;
```

Сравните `rows=` (оценка) в плане **без** ANALYZE с `actual rows=` из задания 3.

```sql
-- Посмотреть, что «думает» планировщик о product_id
SELECT attname, n_distinct, most_common_vals
FROM pg_stats
WHERE schemaname = 'shop' AND tablename = 'orders' AND attname = 'product_id';
```

Если `rows=` и `actual rows` сильно расходятся — повторите `ANALYZE`. Именно так в проде «индекс есть, а Seq Scan» — устаревшая статистика после bulk load.

## Задание 5. Составной индекс — фильтр + сортировка

Добавьте колонку `status` и наполните данными:

```sql
ALTER TABLE shop.orders ADD COLUMN IF NOT EXISTS status text DEFAULT 'delivered';

UPDATE shop.orders SET status = 'pending' WHERE id % 20 = 0;
UPDATE shop.orders SET status = 'shipped'  WHERE id % 20 = 1;
-- остальные остаются delivered
ANALYZE shop.orders;
```

Создайте **составной** индекс:

```sql
CREATE INDEX orders_product_created_idx
  ON shop.orders (product_id, created_at DESC);
```

Сравните планы:

```sql
-- ✅ Должен использовать составной индекс (фильтр + сортировка)
EXPLAIN (ANALYZE, BUFFERS)
SELECT * FROM shop.orders
WHERE product_id = 1
ORDER BY created_at DESC
LIMIT 10;

-- ❌ Составной индекс НЕ поможет — нет условия на product_id
EXPLAIN (ANALYZE, BUFFERS)
SELECT * FROM shop.orders
WHERE created_at > now() - interval '30 days'
ORDER BY created_at DESC
LIMIT 10;
```

**Ожидание:** первый запрос — Index Scan без отдельного узла **Sort** (сортировка «бесплатна» из индекса). Второй — Seq Scan или индекс `orders_created_idx` из лабы 04, но **не** `orders_product_created_idx`.

## Задание 6. Partial index — только «активные» заказы

```sql
CREATE INDEX orders_pending_idx ON shop.orders (created_at)
  WHERE status = 'pending';
```

```sql
-- ✅ Partial index работает
EXPLAIN (ANALYZE)
SELECT * FROM shop.orders
WHERE status = 'pending'
ORDER BY created_at DESC
LIMIT 10;

-- ❌ Partial index не используется
EXPLAIN (ANALYZE)
SELECT * FROM shop.orders
WHERE status = 'delivered'
ORDER BY created_at DESC
LIMIT 10;
```

Partial index меньше по размеру — индексирует только ~5% строк (`pending`). На проде так делают для `WHERE status IN ('pending', 'processing')`, когда 95% строк уже `delivered`.

## Задание 7. Functional index — ловушка с lower()

Создайте таблицу пользователей:

```sql
CREATE TABLE IF NOT EXISTS shop.users (
  id    serial PRIMARY KEY,
  email text NOT NULL UNIQUE
);

INSERT INTO shop.users (email) VALUES
  ('Ivan@Shop.com'),
  ('maria@shop.com')
ON CONFLICT DO NOTHING;
```

Обычный индекс на `email` **не поможет** этому запросу:

```sql
DROP INDEX IF EXISTS shop.users_email_idx;
DROP INDEX IF EXISTS shop.users_email_lower_idx;

EXPLAIN (ANALYZE)
SELECT * FROM shop.users WHERE lower(email) = 'ivan@shop.com';
-- Ожидаем Seq Scan
```

Functional index:

```sql
CREATE INDEX users_email_lower_idx ON shop.users (lower(email));

EXPLAIN (ANALYZE)
SELECT * FROM shop.users WHERE lower(email) = 'ivan@shop.com';
-- Ожидаем Index Scan
```

**Вывод:** индекс на колонку и индекс на **выражение** — разные вещи. В коде `WHERE lower(email) = ?` — нужен functional index.

## Задание 8. Статистика использования индексов

Выполните запрос несколько раз:

```sql
SELECT count(*) FROM shop.orders WHERE product_id = 2;
```

Затем:

```sql
SELECT indexrelname, idx_scan, idx_tup_read,
       pg_size_pretty(pg_relation_size(indexrelid)) AS size
FROM pg_stat_user_indexes
WHERE schemaname = 'shop' AND relname = 'orders'
ORDER BY idx_scan;
```

`idx_scan` для `orders_product_id_idx` должен быть > 0. Индексы с `idx_scan = 0` — кандидаты на удаление (после проверки редких отчётов).

## Задание 9. Запрос по дате (опционально)

```sql
EXPLAIN (ANALYZE)
SELECT * FROM shop.orders
WHERE created_at > now() - interval '1 day'
ORDER BY created_at DESC
LIMIT 10;
```

Сравните с индексом `orders_created_idx` из лабы 04 — помогает ли для узкого временного окна на 50k строк?

## Если что-то пошло не так

| Симптом | Решение |
|---------|---------|
| Всё ещё Seq Scan с индексом | Мало строк — планировщик предпочитает Seq; увеличьте данные или `SET enable_seqscan = off` **только для учебного эксперимента** |
| Partial index не используется | Условие в WHERE не совпадает с `WHERE` в определении индекса; проверьте `status = 'pending'` |
| Functional index — Seq Scan | Выражение в запросе должно **точно** совпадать с индексом: `lower(email)`, не `LOWER(email)` — в PG регистр функции не важен, но `trim(lower(email))` уже другое выражение |
| INSERT долго | Нормально для 50k; на проде — batch/chunk |
| Duplicate key на products | Не трогайте products при генерации orders |

## Критерии успеха

- [ ] ≥ 50k строк в `shop.orders`, выполнен `ANALYZE`
- [ ] Видели Seq Scan без индекса и Index Scan после — записали метрики
- [ ] Составной индекс убрал Sort при `WHERE product_id = ? ORDER BY created_at`
- [ ] Partial index работает только для `status = 'pending'`
- [ ] Functional index: Seq Scan без него, Index Scan с ним
- [ ] Понимаете разницу estimate rows vs actual rows
- [ ] `idx_scan` растёт после запросов

## Дальше

Транзакции и MVCC: [11-transactions-mvcc.md](11-transactions-mvcc.md).
