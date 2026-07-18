# 07. Лаба: N+1

## Зачем эта лаба

На данных `devapp` **почувствовать** разницу N+1 vs JOIN: round-trips, `\timing`, EXPLAIN — до того как APM на prod покажет 201 query.

## Предусловия

- [03-lab-flyway](03-lab-flyway.md) — схема `devapp`
- [06-n-plus-one](06-n-plus-one.md)

## Задание 1. Тестовые данные

```sql
INSERT INTO devapp.products (sku, name, price) VALUES
  ('B1', 'Bolt', 1.00),
  ('B2', 'Nut', 0.50),
  ('B3', 'Washer', 0.25)
ON CONFLICT (sku) DO NOTHING;

INSERT INTO devapp.orders (product_id, qty) VALUES
  (1, 2), (1, 1), (2, 5), (3, 10), (2, 3);
```

Проверка:

```sql
SELECT count(*) FROM devapp.orders;
```

## Задание 2. Плохой паттерн (симуляция N+1)

```sql
\timing on
```

```sql
-- "приложение": сначала все заказы
SELECT id, product_id FROM devapp.orders;
```

Для **каждой** строки вручную (или скриптом) выполните:

```sql
SELECT name, price FROM devapp.products WHERE id = 1;
SELECT name, price FROM devapp.products WHERE id = 1;
-- ... по числу orders
```

Запишите:

| Метрика | N+1 |
|---------|-----|
| Число запросов | orders + 1 |
| Суммарное время (\timing) | |

## Задание 3. Хороший паттерн — JOIN

```sql
\timing on
EXPLAIN (ANALYZE, BUFFERS)
SELECT o.id, o.qty, o.product_id, p.name, p.price
FROM devapp.orders o
JOIN devapp.products p ON p.id = o.product_id
ORDER BY o.id;
```

Ожидание:

- **1 query** в логе
- Plan: `Nested Loop` или `Hash Join` с Index Scan на `products_pkey`
- Время ≤ N+1 подхода

## Задание 4. Batch IN

```sql
WITH ord AS (
  SELECT id, product_id FROM devapp.orders
)
SELECT o.id, o.product_id, p.name
FROM ord o
JOIN devapp.products p ON p.id = o.product_id;
```

Или два шага:

```sql
SELECT DISTINCT product_id FROM devapp.orders;
SELECT * FROM devapp.products WHERE id IN (1, 2, 3);
```

Запишите: **2 round-trips** vs N+1.

## Задание 5. Индекс на FK

```sql
EXPLAIN SELECT * FROM devapp.orders o
JOIN devapp.products p ON p.id = o.product_id
WHERE o.id = 1;
```

Если Seq Scan на products — добавьте (для лабы обычно PK достаточно):

```sql
CREATE INDEX IF NOT EXISTS orders_product_id_idx ON devapp.orders (product_id);
```

## Troubleshooting

| Симптом | Причина |
|---------|---------|
| Empty orders | не вставили данные |
| FK violation | product_id не существует |
| Same timing | мало строк — увеличьте INSERT loop |

## Критерии успеха

- [ ] EXPLAIN JOIN — один plan, join на products
- [ ] Сравнение: count запросов N+1 vs 1
- [ ] Понимание зачем индекс на product_id
- [ ] Записаны timing numbers

## Дальше

JSONB: [08-jsonb.md](08-jsonb.md).
