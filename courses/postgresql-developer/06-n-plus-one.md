# 06. N+1 и паттерны запросов

## Сценарий с работы

API `GET /orders` возвращает 200 заказов за 80 ms — «быстро». APM показывает **201 запрос** к Postgres: 1 список + 200 `SELECT product WHERE id = ?`. Под нагрузкой latency 2 s, pool exhausted, 503.

**N+1** — классический anti-pattern ORM. Postgres справляется одним JOIN; проблема в **round-trips** и планировщике на стороне app.

**Связь:** [sqlalchemy-deep](../sqlalchemy-deep/README.md), [performance/01](../postgresql-performance/README.md), [fastapi](../fastapi/README.md).

## Что вы узнаете

- Как возникает N+1
- JOIN, batch IN, eager loading
- ORM anti-patterns
- Измерение в EXPLAIN и APM

## Проблема N+1

```text
Handler:
  orders = SELECT * FROM orders LIMIT 200     -- 1 query
  for o in orders:
    product = SELECT * FROM products WHERE id = o.product_id  -- N queries
Total: N + 1 round-trips
```

Каждый round-trip — latency (0.5–2 ms LAN, больше через pooler). 200 × 1 ms = 200 ms только на сеть.

```python
# SQLAlchemy lazy — типичная ловушка
for order in session.scalars(select(Order).limit(200)):
    print(order.product.name)  # lazy load каждый раз
```

## Решение 1: JOIN

```sql
SELECT o.id, o.qty, o.created_at,
       p.id AS product_id, p.name, p.price
FROM devapp.orders o
JOIN devapp.products p ON p.id = o.product_id
ORDER BY o.created_at DESC
LIMIT 200;
```

Один plan, один round-trip. Индекс на `orders.product_id` (FK) — [basic/09-indexes](../postgresql-basic/09-indexes-explain.md).

SQLAlchemy:

```python
select(Order).options(joinedload(Order.product)).limit(200)
```

Django: `select_related('product')`.

## Решение 2: Batch IN

Когда JOIN раздувает строки (много items):

```sql
-- 1) orders
SELECT id, product_id FROM devapp.orders LIMIT 200;
-- 2) products одним запросом
SELECT * FROM devapp.products WHERE id IN (1, 5, 7, ...);
```

Два запроса вместо 201. DataLoader pattern в GraphQL.

## Решение 3: Eager loading осознанно

| Паттерн | Когда |
|---------|-------|
| `joinedload` | Many-to-one, мало колонок |
| `selectinload` | One-to-many collections |
| `subqueryload` | Редко, осторожно с объёмом |

Default lazy — удобен в shell, опасен в API.

## Другие anti-patterns

| Anti-pattern | Эффект |
|--------------|--------|
| `SELECT *` на wide table | IO, network |
| Без LIMIT на списках | OOM, full scan |
| COUNT(*) в цикле | N counts |
| OFFSET 100000 | Seq scan — keyset pagination |
| N+1 в async | Хуже — await × N |

## Измерение

### EXPLAIN

```sql
EXPLAIN (ANALYZE, BUFFERS)
SELECT ... JOIN ...;
```

Один Index Scan / Nested Loop — хорошо. 200 loops — подозрение на N+1 в app, не в одном SQL.

### APM / OpenTelemetry

Span per DB query — spike count на endpoint. SQLAlchemy: `echo=True` dev only; production — OTel instrumentation.

## JOIN vs два запроса

| | JOIN | 2 queries IN |
|---|------|--------------|
| Round-trips | 1 | 2 |
| Дублирование rows | При 1:N раздувает | Нет |
| Кэш ORM | Проще | Сложнее merge |
| Типичный case | Order + Product | Order + 50 line items |

## Типичные ошибки

1. «У нас ORM, он оптимизирует» — нет по умолчанию.
2. JOIN 20 таблиц «на всякий случай» — cartesian risk.
3. Индекс на FK забыли — Nested Loop с Seq Scan на products.
4. N+1 только в prod data volume — dev с 5 rows «быстро».
5. GraphQL без DataLoader — N+1 на каждый field.

## Чек-лист

- [ ] N+1 = 1 + N round-trips
- [ ] joinedload / select_related для списков
- [ ] Индекс на FK product_id
- [ ] EXPLAIN + APM query count
- [ ] LIMIT / keyset на списках

## Дальше

Лаба: [07-lab-n-plus-one.md](07-lab-n-plus-one.md).
