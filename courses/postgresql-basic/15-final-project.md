# 15. Финальный проект: делаем базу магазина как в реальной команде

## Легенда

Вы в команде интернет-магазина. Бизнес говорит:

- "Сделайте нормальную базу, чтобы не развалилась."
- "Отчеты должны открываться быстро."
- "Права должны быть безопасными."
- "Нужен backup и понятный restore."
- "И разберите баги с транзакциями и оплатами."

Ваша задача: собрать небольшой production-like контур в `shop_final`.

---

## Что должно быть в результате

1. Схема `shop_final` с таблицами и связями.
2. Данные для реалистичных тестов (не 10 строк).
3. Роли `shop_migrator`, `shop_app`, `shop_report`.
4. Проверка отчета через `EXPLAIN (ANALYZE, BUFFERS)`.
5. Backup и проверенный restore.
6. Раздел troubleshooting с реальными кейсами и решениями.

---

## Этап 1. Делаем схему данных

Создайте `schema.sql` и схему `shop_final`.

```text
categories ──< products
customers  ──< orders ──< order_items >── products
```

```sql
CREATE SCHEMA shop_final AUTHORIZATION course;

CREATE TABLE shop_final.categories (
  id   serial PRIMARY KEY,
  name text NOT NULL UNIQUE
);

CREATE TABLE shop_final.products (
  id          serial PRIMARY KEY,
  category_id int NOT NULL REFERENCES shop_final.categories(id),
  sku         text NOT NULL UNIQUE,
  name        text NOT NULL,
  price       numeric(10,2) NOT NULL CHECK (price >= 0)
);

CREATE TABLE shop_final.customers (
  id         bigserial PRIMARY KEY,
  email      text NOT NULL UNIQUE,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE shop_final.orders (
  id          bigserial PRIMARY KEY,
  customer_id bigint NOT NULL REFERENCES shop_final.customers(id),
  created_at  timestamptz NOT NULL DEFAULT now(),
  status      text NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'paid', 'shipped', 'cancelled'))
);

CREATE TABLE shop_final.order_items (
  id         bigserial PRIMARY KEY,
  order_id   bigint NOT NULL REFERENCES shop_final.orders(id) ON DELETE CASCADE,
  product_id int NOT NULL REFERENCES shop_final.products(id),
  qty        int NOT NULL CHECK (qty > 0),
  unit_price numeric(10,2) NOT NULL CHECK (unit_price >= 0),
  UNIQUE (order_id, product_id)
);
```

---

## Этап 2. Наполняем данными

Создайте `seed.sql`:

- категории и товары;
- клиенты;
- много заказов и позиций (тысячи/десятки тысяч).

Пример:

```sql
INSERT INTO shop_final.orders (customer_id, created_at)
SELECT (random() * 999 + 1)::bigint,
       now() - (random() * 90 || ' days')::interval
FROM generate_series(1, 20000);

ANALYZE shop_final.orders;
ANALYZE shop_final.order_items;
```

---

## Этап 3. Разделяем роли

```sql
CREATE ROLE shop_migrator LOGIN PASSWORD 'migrator_pass';
CREATE ROLE shop_app LOGIN PASSWORD 'app_pass';
CREATE ROLE shop_report LOGIN PASSWORD 'report_pass';

GRANT CONNECT ON DATABASE course TO shop_migrator, shop_app, shop_report;
GRANT USAGE, CREATE ON SCHEMA shop_final TO shop_migrator;
GRANT USAGE ON SCHEMA shop_final TO shop_app, shop_report;

GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA shop_final TO shop_app;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA shop_final TO shop_app;
GRANT SELECT ON ALL TABLES IN SCHEMA shop_final TO shop_report;
```

Проверки:

- `shop_report` не должен уметь `INSERT/UPDATE/DELETE`.
- `shop_app` не должен уметь `CREATE TABLE`.

---

## Этап 4. Проверяем главный отчет и план

```sql
SELECT c.email,
       count(*) AS orders,
       sum(oi.qty * oi.unit_price) AS total
FROM shop_final.customers c
JOIN shop_final.orders o ON o.customer_id = c.id
JOIN shop_final.order_items oi ON oi.order_id = o.id
WHERE o.created_at >= now() - interval '30 days'
GROUP BY c.email
ORDER BY total DESC
LIMIT 20;
```

```sql
EXPLAIN (ANALYZE, BUFFERS)
-- запрос выше
```

---

## Этап 5. Backup и restore

```bash
pg_dump -Fc -n shop_final -f shop_final.dump "postgresql://course:course@localhost:5432/course"
```

```bash
createdb course_test
pg_restore -d course_test shop_final.dump
psql "postgresql://course:course@localhost:5432/course_test" -c "SELECT count(*) FROM shop_final.orders;"
```

---

## Этап 6. Приходит жалоба на медленность -> настраиваем индексы

### Легенда

После демо бизнес пишет:

- "Карточка клиента тормозит."
- "Отчет за месяц иногда открывается очень долго."

Вы не "угадываете" индекс, а делаете по процессу: медленный запрос -> EXPLAIN -> индекс -> повторный EXPLAIN.

### Базовый набор индексов

```sql
CREATE INDEX orders_customer_created_idx
  ON shop_final.orders (customer_id, created_at DESC);

CREATE INDEX orders_created_at_idx
  ON shop_final.orders (created_at);

CREATE INDEX order_items_order_id_idx
  ON shop_final.order_items (order_id);
```

### Другой тип индекса (не B-tree)

Если таблица очень большая и в основном растет по времени, тестируйте BRIN:

```sql
CREATE INDEX orders_created_at_brin_idx
  ON shop_final.orders USING brin (created_at);
```

Когда BRIN обычно уместен:

- десятки/сотни миллионов строк;
- вставки идут в порядке времени;
- важен компактный размер индекса.

---

## Этап 7. Приходят баги -> разбираем troubleshooting

Ниже уже готовые разборы кейсов. Их и кладете в `shop_final/troubleshooting.md`.

### Кейс 1. Oversell последней единицы

- **Что сказал бизнес:** "Иногда продаем последний товар дважды."
- **Что было:** два checkout-потока читают `stock = 1`, оба списывают.
- **Почему:** гонка в Read Committed, без блокировки строки.
- **Что поменяли:** `SELECT ... FOR UPDATE` на товар + `CHECK (stock >= 0)`; для сложных правил — точечно `SERIALIZABLE` + retry.
- **Чем доказали:** нагрузочный тест двумя параллельными потоками: один заказ проходит, второй получает controlled error; отрицательный stock больше не появляется.

Пример паттерна:

```sql
BEGIN;
SELECT stock
FROM shop_final.products
WHERE id = :product_id
FOR UPDATE;

UPDATE shop_final.products
SET stock = stock - :qty
WHERE id = :product_id;
COMMIT;
```

### Кейс 2. "Прыгающий" финансовый отчет

- **Что сказал бизнес:** "Открываем отчет, цифры в одном отчете расходятся."
- **Что было:** длинная транзакция в Read Committed с несколькими SELECT.
- **Почему:** в Read Committed каждый statement получает новый snapshot.
- **Что поменяли:** отчетный блок перевели на `REPEATABLE READ`; сократили время транзакции; тяжелые отчеты унесли на replica.
- **Чем доказали:** повторный прогон отчета 10 раз подряд — цифры внутри одного прогона стабильны; мониторинг не показывает длительных блокировок от отчетов.

Пример:

```sql
BEGIN ISOLATION LEVEL REPEATABLE READ;
-- несколько SELECT для отчета
COMMIT;
```

### Кейс 3. Двойная оплата при ретраях webhook

- **Что сказал бизнес:** "Редко, но бывает двойное списание."
- **Что было:** повторный callback от провайдера обрабатывался как новый платеж.
- **Почему:** нет idempotency-ключа и уникального ограничения.
- **Что поменяли:** `payment_id` + `UNIQUE`, обработка `unique_violation` как "already processed"; операция в одной транзакции.
- **Чем доказали:** отправили один и тот же callback 50 раз — в БД один платеж, статус заказа корректный, дублей нет.

Пример:

```sql
ALTER TABLE shop_final.orders
  ADD COLUMN payment_id text;

CREATE UNIQUE INDEX orders_payment_id_uq
  ON shop_final.orders (payment_id)
  WHERE payment_id IS NOT NULL;
```

### Кейс 4. Pending-заказы подвисают в пике

- **Что сказал бизнес:** "Вечером pending-заказы копятся, SLA не держим."
- **Что было:** воркеры берут одни и те же заказы, блокируют друг друга, долго держат транзакции.
- **Почему:** очередь без `SKIP LOCKED`, много lock wait.
- **Что поменяли:** dequeue через `FOR UPDATE SKIP LOCKED`, батчи и короткие транзакции, лимиты по времени обработки.
- **Чем доказали:** latency очереди в пике снизилась, lock wait почти исчез, throughput вырос.

Пример:

```sql
BEGIN;
SELECT id
FROM shop_final.orders
WHERE status = 'pending'
ORDER BY created_at
FOR UPDATE SKIP LOCKED
LIMIT 100;

-- обработка батча
UPDATE shop_final.orders
SET status = 'paid'
WHERE id = ANY(:ids);
COMMIT;
```

### Кейс 5. Бизнес-правило "не больше N активных заказов" иногда нарушается

- **Что сказал бизнес:** "Иногда у клиента оказывается 4 активных заказа, хотя лимит 3."
- **Что было:** два параллельных запроса читают `count(active_orders)=2`, оба создают новый заказ.
- **Почему:** классический race/write skew. На Read Committed обе транзакции видят старое состояние и проходят проверку.
- **Что поменяли:** критичный блок создания заказа перевели на `SERIALIZABLE` + обязательный retry при `could not serialize access`.
- **Чем доказали:** параллельный тест 1000 попыток создания заказа при лимите 3 — инвариант больше не нарушается; часть транзакций корректно уходит в retry.

Пример паттерна:

```sql
BEGIN ISOLATION LEVEL SERIALIZABLE;

-- проверяем инвариант
SELECT count(*)
FROM shop_final.orders
WHERE customer_id = :customer_id
  AND status IN ('pending', 'paid');

-- если count < 3, создаем заказ
INSERT INTO shop_final.orders (customer_id, status)
VALUES (:customer_id, 'pending');

COMMIT;
```

В приложении обязательно:

- ловить `serialization_failure`;
- делать retry с backoff (обычно 2-3 попытки);
- логировать долю retry, чтобы видеть цену решения.

---

## Что сдаем

- `schema.sql`
- `seed.sql`
- `README.md` (ER, подключение, backup/restore)
- `troubleshooting.md` с кейсами выше
- пример `EXPLAIN (ANALYZE, BUFFERS)` для отчетного запроса

---

## Чек-лист

- [ ] Схема поднимается с нуля.
- [ ] Есть 4+ таблицы, FK, CHECK.
- [ ] Роли разделены.
- [ ] EXPLAIN на отчет приложен.
- [ ] Backup сделан и restore проверен.
- [ ] Все 5 troubleshooting-кейсов расписаны с решением и проверкой.

---

## Дальше

`postgresql-basic` завершен.

Следующий шаг: [postgresql-intermediate](../postgresql-intermediate/README.md).
