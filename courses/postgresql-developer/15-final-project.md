# 15. Финальный проект: схема заказов

## Сценарий с работы

Greenfield микросервис **orders** в shop: customers, orders, line items, async fulfillment jobs. Tech lead выдал требования: Flyway, JSONB meta, FTS по продуктам, queue на Postgres, API без N+1, CI migrate job.

Вы собираете всё из курса в один **репозируемый** артефакт.

## Задача

Спроектируйте и реализуйте через **Flyway** мини-сервис «Заказы».

## Требования

### 1. Схема (Flyway V1+)

| Таблица | Ключевые поля |
|---------|---------------|
| `customers` | id, email UNIQUE, created_at |
| `products` | id, sku, name, price, search tsvector |
| `orders` | id, customer_id FK, status, meta jsonb, created_at |
| `order_items` | id, order_id FK, product_id FK, qty, price |
| `jobs` | id, payload jsonb, status, created_at |

Schema: `shop_orders` или `devapp` — на ваш выбор, консистентно в `flyway.conf`.

### 2. JSONB meta на orders

```json
{"channel": "mobile", "promo": "SPRING10", "utm": {"source": "google"}}
```

Запрос: фильтр `@> '{"channel": "mobile"}'` + GIN индекс.

### 3. FTS по products

- Колонка `search tsvector`
- GIN индекс
- Trigger на INSERT/UPDATE name/sku
- API query с `ts_rank`

Скопируйте паттерн из [`V2__add_search.sql`](examples/flyway/sql/V2__add_search.sql).

### 4. Jobs + SKIP LOCKED

При создании order — INSERT job `{"order_id": N, "action": "fulfill"}`.

Worker SQL:

```sql
BEGIN;
SELECT id, payload FROM shop_orders.jobs
WHERE status = 'pending'
ORDER BY id FOR UPDATE SKIP LOCKED LIMIT 1;
-- UPDATE status = 'processing' → work → 'done'
COMMIT;
```

Докажите два parallel worker — разные jobs.

### 5. Документ N+1

`API.md` — список заказов с items и product names:

```sql
-- плохо: N+1 псевдокод
-- хорошо: ваш JOIN или selectinload
```

Один EXPLAIN для «хорошего» запроса.

## Артефакты

```text
your-orders-service/
  sql/V1__init.sql
  sql/V2__fts_products.sql
  sql/V3__jobs_index.sql
  flyway.conf
  README.md          -- flyway migrate, примеры SQL
  API.md               -- N+1, list orders query
  .gitlab-ci.yml       -- опционально: migrate job
```

Fork [`examples/flyway`](examples/flyway/) допустим.

## Критерии приёмки

- [ ] `flyway migrate` — history без failed
- [ ] FTS с rank на products
- [ ] JSONB `@>` с GIN
- [ ] 2 parallel workers — разные jobs
- [ ] API.md с JOIN против N+1 + EXPLAIN
- [ ] (Опционально) GitLab CI migrate из [14-ci-migrations](14-ci-migrations.md)

## Self-review

| Вопрос | OK? |
|--------|-----|
| Индекс на order_items.order_id? | |
| Индекс jobs (status, id)? | |
| Migrator role ≠ app role? | |
| CONCURRENTLY для больших индексов? | |

## Связь с другими курсами

| Курс | Применение |
|------|------------|
| [postgresql-performance](../postgresql-performance/README.md) | Индексы, EXPLAIN |
| [postgresql-security](../postgresql-security/README.md) | RLS tenant, app role |
| [fastapi](../fastapi/README.md) | Реализация API |
| [aws-intermediate](../aws-intermediate/README.md) | RDS deploy |

## Поздравляем

Трек **postgresql-developer** завершён. Вся ветка PostgreSQL (~102 урока) — мегакурс. Карта: [`postgresql-path.md`](../postgresql-path.md).
