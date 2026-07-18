# 10. RLS и audit

## Сценарий с работы

SaaS shop: один PostgreSQL, тысячи tenant. Bug в API — забыли `WHERE tenant_id`. Без **RLS** аналитик видит все заказы. С RLS + `SET app.tenant_id` — даже при забытом WHERE Postgres отфильтрует строки. Но SUPERUSER и `BYPASSRLS` обходят политику — app **никогда** не superuser.

RLS — authorization на уровне строк; pgaudit — кто что делал. Для multi-tenant нужны **оба**.

**Предварительно:** [basic/05-roles-privileges](../postgresql-basic/05-roles-privileges.md), [advanced/07-security](../postgresql-advanced/07-security.md).

## Что вы узнаете

- `ENABLE ROW LEVEL SECURITY` и политики
- `USING` vs `WITH CHECK`
- `BYPASSRLS` и SUPERUSER
- `security_barrier` views
- Связь RLS + pgaudit

## Базовый паттерн

```sql
ALTER TABLE shop.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE shop.orders FORCE ROW LEVEL SECURITY;

CREATE POLICY orders_tenant ON shop.orders
  FOR ALL
  USING (tenant_id = current_setting('app.tenant_id', true)::int)
  WITH CHECK (tenant_id = current_setting('app.tenant_id', true)::int);
```

| Часть | Назначение |
|-------|------------|
| `ENABLE` | Включает RLS для non-owner |
| `FORCE` | RLS даже для table owner (кроме superuser) |
| `USING` | Какие строки видны (SELECT, UPDATE, DELETE) |
| `WITH CHECK` | Какие строки можно INSERT/UPDATE |
| `true` в `current_setting` | NULL если GUC не set — не match |

## Установка tenant в приложении

```python
# SQLAlchemy — начало каждой транзакции / request
await conn.execute(text("SET LOCAL app.tenant_id = :tid"), {"tid": tenant_id})
```

`SET LOCAL` — сбрасывается в конце транзакции (безопаснее чем `SET` на сессию).

PgBouncer transaction mode: `SET LOCAL` внутри транзакции OK.

## Обход RLS

| Роль | RLS |
|------|-----|
| Обычный user | Политики применяются |
| Table owner без FORCE | Может видеть всё |
| `BYPASSRLS` attribute | Обход |
| SUPERUSER | Обход |

```sql
SELECT rolname, rolbypassrls, rolsuper FROM pg_roles WHERE rolname = 'shop_app';
```

`shop_app` — `rolbypassrls = false`, `rolsuper = false`.

## Security definer views — ловушка

```sql
CREATE VIEW shop.orders_safe WITH (security_barrier) AS
  SELECT id, amount
  FROM shop.orders
  WHERE tenant_id = current_setting('app.tenant_id', true)::int;
```

Без `security_barrier` оптимизатор может «протолкнуть» предикат и **утечь** строки через side channel.

Предпочтительнее: RLS на базовой таблице, view тонкий.

## Политики по операциям

```sql
CREATE POLICY orders_select ON shop.orders FOR SELECT
  USING (tenant_id = current_setting('app.tenant_id', true)::int);

CREATE POLICY orders_insert ON shop.orders FOR INSERT
  WITH CHECK (tenant_id = current_setting('app.tenant_id', true)::int);
```

Раздельные политики — fine-grained (read-only role без INSERT policy).

## RLS не заменяет audit

| Событие | RLS | pgaudit |
|---------|-----|---------|
| User видит чужие строки | Блокирует | — |
| User пытается DROP TABLE | — | Логирует |
| Admin BYPASSRLS SELECT | Разрешает | Должен логировать `read` или write |

При инциденте: pgaudit «кто», RLS «что мог увидеть».

## Типичные ошибки

1. RLS enabled, GUC не set — пустой результат (silent fail).
2. INSERT чужого `tenant_id` без `WITH CHECK` — утечка.
3. App под `postgres` superuser — RLS бесполезен.
4. Только app filter, без RLS — psql bypass.
5. `FORCE RLS` забыли — owner role в миграциях видит всё.

## Чек-лист

- [ ] USING + WITH CHECK для tenant
- [ ] SET LOCAL в app / middleware
- [ ] App role без BYPASSRLS/SUPERUSER
- [ ] FORCE ROW LEVEL SECURITY на sensitive tables
- [ ] pgaudit ddl + write на тех же таблицах

## Дальше

Лаба: [11-lab-rls.md](11-lab-rls.md). Пример: [`examples/rls-tenant.sql`](examples/rls-tenant.sql).
