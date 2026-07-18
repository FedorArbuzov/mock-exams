# 08. Лаба: RLS multi-tenant

## Зачем эта лаба

Multi-tenant SaaS часто изолирует данные через `tenant_id` + RLS вместо отдельной БД на клиента. Вы настроите политики и проверите, что cross-tenant INSERT невозможен.

## Предусловия

- `shop.orders` существует
- Подключение как `course` (superuser) для DDL; тест под app role

## Задание 1. Подготовка данных

```sql
ALTER TABLE shop.orders ADD COLUMN IF NOT EXISTS tenant_id int NOT NULL DEFAULT 1;

UPDATE shop.orders SET tenant_id = 1 WHERE tenant_id IS NULL OR tenant_id = 1;

INSERT INTO shop.orders (product_id, qty, tenant_id)
SELECT product_id, 1, 2
FROM shop.products LIMIT 5;
```

Проверка без RLS (superuser видит всё):

```sql
SELECT tenant_id, count(*) FROM shop.orders GROUP BY 1;
```

## Задание 2. Включить RLS и политики

```sql
ALTER TABLE shop.orders ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS tenant_select ON shop.orders;
DROP POLICY IF EXISTS tenant_modify ON shop.orders;

CREATE POLICY tenant_select ON shop.orders FOR SELECT
  USING (tenant_id = current_setting('app.tenant_id', true)::int);

CREATE POLICY tenant_modify ON shop.orders FOR ALL
  USING (tenant_id = current_setting('app.tenant_id', true)::int)
  WITH CHECK (tenant_id = current_setting('app.tenant_id', true)::int);
```

Superuser **обходит** RLS. Создайте app role:

```sql
CREATE ROLE shop_app_rls LOGIN PASSWORD 'app_rls_pass';
GRANT CONNECT ON DATABASE course TO shop_app_rls;
GRANT USAGE ON SCHEMA shop TO shop_app_rls;
GRANT SELECT, INSERT, UPDATE, DELETE ON shop.orders TO shop_app_rls;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA shop TO shop_app_rls;
-- НЕ давать BYPASSRLS
```

## Задание 3. Tenant 1 vs tenant 2

```bash
psql "postgresql://shop_app_rls:app_rls_pass@localhost:5432/course" -c \
  "SET app.tenant_id = '1'; SELECT count(*) FROM shop.orders;"
```

```bash
psql "postgresql://shop_app_rls:app_rls_pass@localhost:5432/course" -c \
  "SET app.tenant_id = '2'; SELECT count(*) FROM shop.orders;"
```

**Ожидание:** разные count; tenant 2 не видит tenant 1.

## Задание 4. Cross-tenant INSERT — denied

```bash
psql "postgresql://shop_app_rls:app_rls_pass@localhost:5432/course" -c \
  "SET app.tenant_id = '1'; INSERT INTO shop.orders (product_id, qty, tenant_id) VALUES (1, 1, 2);"
```

**Ожидание:** `new row violates row-level security policy` (WITH CHECK).

## Задание 5. Без SET tenant_id

```bash
psql "postgresql://shop_app_rls:app_rls_pass@localhost:5432/course" -c \
  "SELECT count(*) FROM shop.orders;"
```

**Ожидание:** 0 строк или error — не «все tenants».

## Задание 6. FastAPI/Django интеграция (письменно)

В `rls-notes.md` опишите:

- Где вызывать `SET app.tenant_id` (middleware, `get_db`, connection pool).
- Почему PgBouncer transaction mode требует `SET LOCAL` в начале transaction ([intermediate/15-pgbouncer](../postgresql-intermediate/15-pgbouncer.md)).

## Если что-то пошло не так

| Симптом | Решение |
|---------|---------|
| Видны все строки | Подключены как superuser/course |
| INSERT прошёл с tenant 2 | Нет WITH CHECK; BYPASSRLS |
| permission denied | GRANT на orders |

## Критерии успеха

- [ ] RLS фильтрует SELECT по tenant
- [ ] WITH CHECK блокирует cross-tenant INSERT
- [ ] App role без BYPASSRLS
- [ ] Заметки про SET в application layer

## Дальше

Major upgrade: [09-major-upgrade.md](09-major-upgrade.md).
