# 03. Лаба: SCRAM

## Зачем эта лаба

Создать роль с SCRAM, подключиться с хоста, проверить `password_encryption` и оформить **3 пункта hardening** для `pg_hba.conf`.

## Предусловия

- Стенд [`deploy/postgres`](../../deploy/postgres/README.md)
- [02-scram-auth](02-scram-auth.md)

## Задание 1. password_encryption

```sql
SHOW password_encryption;
```

Ожидание: `scram-sha-256`. Если `md5`:

```sql
ALTER SYSTEM SET password_encryption = 'scram-sha-256';
-- restart если нужно
```

## Задание 2. Новая роль

```sql
CREATE ROLE app_readonly LOGIN PASSWORD 'LabReadOnly2024!';
GRANT CONNECT ON DATABASE course TO app_readonly;
GRANT USAGE ON SCHEMA shop TO app_readonly;
GRANT SELECT ON ALL TABLES IN SCHEMA shop TO app_readonly;
```

Проверка SCRAM в каталоге (superuser):

```sql
SELECT rolname, left(rolpassword, 20) AS pwd_prefix
FROM pg_authid WHERE rolname = 'app_readonly';
```

Ожидание: prefix `SCRAM-SHA-256$`

## Задание 3. Подключение

```bash
psql "postgresql://app_readonly:LabReadOnly2024!@localhost:5432/course" \
  -c "SELECT current_user, current_database();"
```

INSERT должен падать:

```bash
psql "postgresql://app_readonly:LabReadOnly2024!@localhost:5432/course" \
  -c "INSERT INTO shop.products (sku,name,price) VALUES ('x','y',1);"
```

## Задание 4. pg_hba review

```bash
docker exec mock-postgres grep -v '^#' /var/lib/postgresql/data/pg_hba.conf | grep -v '^$'
```

Документ `pg_hba-hardening.md` — **3 пункта**:

1. Заменить `trust` / широкий `0.0.0.0/0` на CIDR app subnet + `scram-sha-256`
2. Использовать `hostssl` для remote (после [09-lab-ssl](09-lab-ssl.md))
3. Явная строка `reject` в конце

Пример целевой строки:

```text
hostssl  course  app_readonly  10.0.1.0/24  scram-sha-256
```

## Задание 5. Запрет слабого (tabletop)

| Anti-pattern | Risk | Fix |
|--------------|------|-----|
| trust 0.0.0.0/0 | Anyone connects | reject + CIDR |
| shared superuser URL in app | Full compromise | shop_app role |
| password in git | leak | Vault |

## Критерии успеха

- [ ] Login app_readonly OK
- [ ] password_encryption = scram-sha-256
- [ ] pwd prefix SCRAM в pg_authid
- [ ] pg_hba hardening 3 пункта документированы

## Дальше

LDAP: [04-ldap-ad.md](04-ldap-ad.md).
