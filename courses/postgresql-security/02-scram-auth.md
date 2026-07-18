# 02. SCRAM-SHA-256

## Сценарий с работы

Аудит находит `password_encryption = md5` и строку `host all all 0.0.0.0/0 md5` в hba. Offline brute-force hash из утечённого PGDATA. Миграция на **SCRAM-SHA-256** + `hostssl ... scram-sha-256` — baseline для PG 14+.

SCRAM защищает **процесс аутентификации**; пароль всё равно должен быть сильным и храниться в secrets manager.

## Что вы узнаете

- Почему MD5 устарел
- `password_encryption` и создание ролей
- Ротация паролей
- `pg_hba.conf` без trust/md5 для remote

## Почему не MD5

| | MD5 (legacy) | SCRAM-SHA-256 |
|---|--------------|---------------|
| Хранение в PG | `md5` hash в `pg_authid` | SCRAM verifier |
| На wire | уязвим к replay/offline | challenge-response |
| PG default | до 13 | 14+ default |

```sql
SHOW password_encryption;  -- scram-sha-256
```

Новые роли:

```sql
CREATE ROLE app1 LOGIN PASSWORD 'StrongP@ssw0rd!';
```

Существующая роль с MD5 — пересоздать пароль:

```sql
ALTER ROLE legacy_app PASSWORD 'NewStrongP@ssw0rd!';
```

## SCRAM и transit

SCRAM защищает **аутентификацию** даже без TLS (лучше чем plaintext). **TLS всё равно обязателен** для данных запросов (`SELECT` results). Defense: SCRAM + `hostssl` ([09-lab-ssl](09-lab-ssl.md)).

## pg_hba hardening

```text
# TYPE   DATABASE   USER   ADDRESS          METHOD
hostssl  all        all    10.0.0.0/8       scram-sha-256
host     all        all    127.0.0.1/32     scram-sha-256
# reject all else
host     all        all    0.0.0.0/0        reject
```

Удалить:

```text
host all all 0.0.0.0/0 trust
host all all 0.0.0.0/0 md5
```

После правки: `SELECT pg_reload_conf();`

## Ротация паролей

```sql
ALTER ROLE app1 PASSWORD 'NewP@ssw0rd!';
```

1. Обновить Secret в Vault/K8s.
2. Rolling restart app pods / pooler reload.
3. Revoke старый secret после grace period.

PgBouncer: `auth_file` sync или `auth_query`.

## Проверка метода auth

```sql
SELECT rolname, rolpassword IS NOT NULL AS has_password
FROM pg_authid
WHERE rolname = 'app1';
```

`rolpassword` начинается с `SCRAM-SHA-256$` — SCRAM.

Подключение с неверным паролем — `password authentication failed` (не раскрывать user exists в app logs).

## Типичные ошибки

1. SCRAM в PG, но hba `md5` — downgrade.
2. `trust` для Docker network `0.0.0.0/0` «временно» на год.
3. Один пароль app + migrator + human.
4. Пароль в CI log при `flyway -password=`.

## Чек-лист

- [ ] SCRAM vs MD5 — почему
- [ ] SCRAM не заменяет TLS для data
- [ ] Hash только в PGDATA / pg_authid
- [ ] hba без trust remote
- [ ] Процесс ротации пароля

## Дальше

Лаба: [03-lab-scram.md](03-lab-scram.md).
