# 09. Лаба: SSL

## Зачем эта лаба

Включить TLS на PostgreSQL, подключиться с `sslmode=require`, спланировать **verify-full** в K8s — без этого SCRAM защищает только пароль, а данные запросов идут в clear.

## Предусловия

- [08-encryption](08-encryption.md)
- [`examples/ssl/README.md`](examples/ssl/README.md)
- OpenSSL на хосте

## Задание 1. Генерация сертификата

```bash
cd courses/postgresql-security/examples/ssl
openssl req -new -x509 -days 365 -nodes -text \
  -out server.crt -keyout server.key -subj "/CN=mock-postgres"
chmod 600 server.key
```

Ожидание: файлы `server.crt`, `server.key` созданы.

## Задание 2. Включение ssl в Postgres

Смонтируйте volume и добавьте command в compose (см. README в `examples/ssl/`):

```yaml
volumes:
  - ./examples/ssl:/var/lib/postgresql/ssl:ro
command:
  - "-c"
  - "ssl=on"
  - "-c"
  - "ssl_cert_file=/var/lib/postgresql/ssl/server.crt"
  - "-c"
  - "ssl_key_file=/var/lib/postgresql/ssl/server.key"
```

Перезапустите:

```bash
docker compose -f deploy/postgres/docker-compose.yml up -d --force-recreate
```

Проверка внутри:

```sql
SHOW ssl;  -- on
```

## Задание 3. Подключение с TLS

```bash
psql "postgresql://course:course@localhost:5432/course?sslmode=require" \
  -c "SELECT ssl_is_used();"
```

Ожидание: `ssl_is_used()` = `t` (PG 15+). На старых версиях — успешное подключение без ошибки SSL.

Без ssl (если hba позволяет host):

```bash
psql "postgresql://course:course@localhost:5432/course?sslmode=disable" -c "SELECT 1;"
```

Зафиксируйте: работает или отклоняется — зависит от hba.

## Задание 4. hostssl only (hardening)

Добавьте в pg_hba (tabletop или реально):

```text
hostssl  all  all  10.0.0.0/8  scram-sha-256
host     all  all  0.0.0.0/0   reject
```

После `pg_reload_conf()` — `sslmode=disable` должен **fail**.

## Задание 5. verify-full в K8s (tabletop)

Опишите deployment shop-api:

| Шаг | Действие |
|-----|----------|
| 1 | Secret `db-ca` с корпоративным CA (не self-signed prod) |
| 2 | Mount в `/etc/ssl/certs/db-ca.crt` |
| 3 | `sslmode=verify-full&sslrootcert=...` |
| 4 | Hostname в cert = DNS RDS endpoint |

Self-signed в лабе — `verify-full` упадёт без `-k`/`sslrootcert` с вашим CA. Для лабы достаточно `require`.

## Troubleshooting

| Ошибка | Причина | Fix |
|--------|---------|-----|
| `server does not support SSL` | ssl=off | command ssl=on + restart |
| `could not read certificate` | wrong path/mount | проверить volume |
| `private key file permissions` | key world-readable | chmod 600 |
| `certificate verify failed` | self-signed + verify-full | ca.crt или require |

## Критерии успеха

- [ ] `SHOW ssl` = on
- [ ] Подключение `sslmode=require` OK
- [ ] Документирован план verify-full в K8s
- [ ] Понимание hostssl vs host

## Дальше

RLS: [10-rls-audit.md](10-rls-audit.md).
