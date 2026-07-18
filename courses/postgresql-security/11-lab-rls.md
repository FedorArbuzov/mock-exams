# 11. Лаба: RLS multi-tenant

## Зачем эта лаба

Проверить **изоляцию tenant** на уровне Postgres — не только в ORM. Типичный acceptance test для SaaS перед prod.

## Предусловия

- [10-rls-audit](10-rls-audit.md)
- Стенд [`deploy/postgres`](../../deploy/postgres/README.md)

## Задание 1. Подготовка схемы

```bash
psql "postgresql://course:course@localhost:5432/course" \
  -f courses/postgresql-security/examples/rls-tenant.sql
```

Скрипт создаёт:

- `sec.orders` с `tenant_id`
- RLS policies SELECT/INSERT
- роль `app_user`

Проверка:

```sql
SELECT relrowsecurity, relforcerowsecurity
FROM pg_class c
JOIN pg_namespace n ON n.oid = c.relnamespace
WHERE n.nspname = 'sec' AND c.relname = 'orders';
```

Ожидание: `relrowsecurity = t`.

## Задание 2. Tenant 1 — сессия A

```sql
SET app.tenant_id = '1';
INSERT INTO sec.orders (tenant_id, amount) VALUES (1, 100.00);
INSERT INTO sec.orders (tenant_id, amount) VALUES (1, 250.50);
SELECT * FROM sec.orders;
```

Ожидание: 2 строки, только `tenant_id = 1`.

## Задание 3. Tenant 2 — сессия B

Новое подключение psql или:

```sql
RESET app.tenant_id;
SET app.tenant_id = '2';
SELECT * FROM sec.orders;
```

Ожидание: **0 строк** (tenant 1 не виден).

```sql
INSERT INTO sec.orders (tenant_id, amount) VALUES (2, 99.00);
SELECT * FROM sec.orders;
```

Ожидание: 1 строка (tenant 2 only).

## Задание 4. Атака: чужой tenant_id

```sql
SET app.tenant_id = '2';
INSERT INTO sec.orders (tenant_id, amount) VALUES (1, 999.00);
```

Ожидание: **ERROR** — `WITH CHECK` violation (new row violates row-level security policy).

## Задание 5. Роль app_user (не superuser)

```bash
psql "postgresql://app_user:app_pass@localhost:5432/course" \
  -c "SET app.tenant_id=1; SELECT * FROM sec.orders;"
```

Ожидание: строки tenant 1.

```bash
psql "postgresql://app_user:app_pass@localhost:5432/course" \
  -c "SET app.tenant_id=2; SELECT * FROM sec.orders;"
```

Ожидание: строки tenant 2 only.

## Задание 6. Bypass tabletop

```sql
-- как superuser course/postgres
SELECT * FROM sec.orders;  -- видит ВСЁ без SET tenant
```

Документируйте: почему migrator CI не должен использовать superuser в runtime.

## Troubleshooting

| Симптом | Причина | Fix |
|---------|---------|-----|
| Все строки видны | RLS off или superuser | ENABLE RLS, app role |
| Пустой SELECT | GUC не set | SET app.tenant_id |
| INSERT чужого tenant OK | нет WITH CHECK | добавить policy |
| app_user permission denied | GRANT | rerun rls-tenant.sql |

## Критерии успеха

- [ ] Tenant 1 / 2 изолированы
- [ ] INSERT с чужим tenant_id отклонён
- [ ] app_user работает с SET tenant
- [ ] Задокументирован superuser bypass

## Дальше

Compliance: [12-compliance.md](12-compliance.md).
