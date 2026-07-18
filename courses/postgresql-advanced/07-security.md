# 07. SSL, Row Level Security, аудит

## Сценарий с работы

Пентест: приложение подключается с `sslmode=prefer` — MITM в гостевой Wi‑Fi. Аудит: аналитик с `SELECT` на `orders` видит **все** tenant_id — RLS не включён. Compliance: «кто удалил строку?» — в binlog MySQL есть; в Postgres без **pgaudit** только догадки.

Advanced security — обзор перед полным треком [postgresql-security](../postgresql-security/README.md).

## Что вы узнаете

- TLS для клиентов и `verify-full`
- RLS: policies, `BYPASSRLS`, session GUC
- Аудит: pgaudit vs triggers vs logs
- Encryption at rest vs in column
- Ограничения RDS

## SSL/TLS

Сервер:

```ini
ssl = on
ssl_cert_file = 'server.crt'
ssl_key_file = 'server.key'
ssl_ca_file = 'root.crt'
```

Клиент:

```text
postgresql://app@host:5432/db?sslmode=verify-full&sslrootcert=/path/ca.pem
```

| sslmode | Защита |
|---------|--------|
| `disable` | Нет — только dev |
| `require` | Шифр, **без** проверки hostname |
| `verify-full` | Шифр + CA + hostname — **production** |

Связь: [security/09-lab-ssl](../postgresql-security/09-lab-ssl.md).

## Row Level Security

```sql
ALTER TABLE shop.orders ADD COLUMN tenant_id int NOT NULL DEFAULT 1;
ALTER TABLE shop.orders ENABLE ROW LEVEL SECURITY;

CREATE POLICY orders_tenant_select ON shop.orders
  FOR SELECT
  USING (tenant_id = current_setting('app.tenant_id', true)::int);

CREATE POLICY orders_tenant_modify ON shop.orders
  FOR ALL
  USING (tenant_id = current_setting('app.tenant_id', true)::int)
  WITH CHECK (tenant_id = current_setting('app.tenant_id', true)::int);
```

Приложение **на каждую сессию/transaction**:

```sql
SET app.tenant_id = '42';
-- или SET LOCAL внутри BEGIN
```

| Роль | Поведение |
|------|-----------|
| Обычная app role | Видит только свои строки |
| `BYPASSRLS` attribute | Обходит RLS — **не** для app |
| `SUPERUSER` | Обходит RLS |

**RLS без SET tenant** — `current_setting(..., true)` вернёт NULL → 0 строк или deny.

Политики раздельно для SELECT / INSERT / UPDATE. `WITH CHECK` на INSERT — нельзя вставить чужой tenant_id.

## Аудит

| Метод | Плюс | Минус |
|-------|------|-------|
| **pgaudit** | Централизованный audit log DDL/DML | Объём логов, настройка |
| `log_statement = 'ddl'` | Просто | Нет DML |
| Trigger → audit_table | Гибко | Нагрузка, maintenance |
| Application audit | Бизнес-контекст | Обход в обход app |

```sql
-- pgaudit preview
CREATE EXTENSION pgaudit;
-- shared_preload_libraries = 'pgaudit'
-- pgaudit.log = 'write, ddl'
```

Углубление: [security/06-pgaudit](../postgresql-security/06-pgaudit.md).

## Шифрование

| Уровень | Реализация |
|---------|------------|
| **At rest** | LUKS, EBS encryption, RDS storage encryption |
| **In transit** | TLS |
| **Column** | `pgcrypto` `pgp_sym_encrypt`, app-level KMS |
| **TDE** | Enterprise / cloud proprietary |

Postgres не шифрует data files прозрачно без extension/cloud — полагайтесь на disk + TLS + secrets management ([secrets-basic](../secrets-basic/README.md)).

## RDS / Aurora (preview)

- Нет доступа к `pg_hba.conf` файлу — parameter groups.
- `rds_superuser` ≠ полный superuser.
- IAM database authentication — токены вместо пароля.
- См. [13-cloud-k8s](13-cloud-k8s.md), [aws-intermediate/13-rds-private](../aws-intermediate/13-rds-private.md).

## Типичные ошибки

1. RLS включён, app не делает SET — «пустые списки» в prod.
2. `sslmode=require` в compliance checklist — недостаточно.
3. Audit trigger без retention policy — таблица audit больше prod.
4. Миграции под superuser — обходят RLS незаметно.

## Чек-лист

- [ ] RLS без SET app.tenant — безопасно? (нет)
- [ ] require vs verify-full
- [ ] pgaudit vs trigger audit
- [ ] SUPERUSER / BYPASSRLS обходят RLS
- [ ] At rest vs in transit

## Дальше

Лаба: [08-lab-security.md](08-lab-security.md).

**Углубление:** [postgresql-security](../postgresql-security/README.md).
