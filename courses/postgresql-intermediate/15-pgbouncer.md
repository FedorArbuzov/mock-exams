# 15. PgBouncer и connection pooling

## Сценарий с работы

Kubernetes: 50 подов × pool 20 = **1000** клиентских соединений к Postgres при `max_connections=100`. Новые поды в CrashLoop — `FATAL: sorry, too many clients already`. Подняли `max_connections` до 500 — OOM killer на VM. Правильный ход: **PgBouncer** между app и Postgres — тысячи клиентов, десятки server connections ([basic/07-connections-psql](../postgresql-basic/07-connections-psql.md)).

## Что вы узнаете

- Зачем pooler при process-per-connection модели Postgres
- Режимы pool: session, transaction, statement
- Ограничения transaction mode для ORM
- Конфиг и auth
- Single point of failure и HA pooler

## Проблема

```text
Без pooler:
  1000 app connections → 1000 backend processes → RAM + context switch

С PgBouncer:
  1000 client connections → PgBouncer → 20–50 server connections → Postgres
```

PgBouncer — лёгкий multiplexer; **не** query cache и не замена Postgres.

## Режимы pool

| Mode | Backend занят | Типичное использование |
|------|---------------|------------------------|
| **session** | Всю сессию клиента | Миграции, `LISTEN`, temp tables, legacy app |
| **transaction** | Только на время transaction | Web API, stateless workers |
| **statement** | На один statement | Редко; ломает multi-statement transactions |

**Transaction mode** — default для FastAPI/Django при коротких request-scoped transactions.

```text
Client BEGIN → backend assigned
COMMIT → backend returned to pool
Client SET search_path → может «потеряться» между transactions
```

## Конфиг (фрагмент)

```ini
[databases]
course = host=postgres port=5432 dbname=course

[pgbouncer]
listen_addr = 0.0.0.0
listen_port = 6432
auth_type = scram-sha-256
auth_file = /etc/pgbouncer/userlist.txt
pool_mode = transaction
max_client_conn = 1000
default_pool_size = 20
min_pool_size = 5
reserve_pool_size = 5
server_reset_query = DISCARD ALL
```

| Параметр | Смысл |
|----------|-------|
| `max_client_conn` | Макс. клиентов к PgBouncer |
| `default_pool_size` | Server conns **на user+database** |
| `server_reset_query` | Очистка session state при возврате backend |

`max_client_conn` >> `default_pool_size` — норма; клиенты ждут в очереди PgBouncer, не в Postgres.

## Ограничения transaction mode

- **Prepared statements** — конфликт имён при переиспользовании backend. Решения: `max_prepared_statements` (новые версии), отключить prepare в driver (`statement_cache_size=0` в asyncpg), session mode для проблемных клиентов.
- **`SET` session variables** — не переносятся; use `SET LOCAL` в transaction или `server_reset_query`.
- **`LISTEN/NOTIFY`, temp tables, advisory locks** — session mode или осторожность.
- **Cursors** с hold — session mode.

SQLAlchemy 2 / asyncpg: проверьте docs для pooling через PgBouncer.

## Auth

`auth_file` — user/password pairs. Или `auth_query` к таблице `pgbouncer.get_auth()` на Postgres.

Приложение подключается к **6432**, не 5432:

```text
postgresql://shop_app:pass@pgbouncer:6432/course
```

Роли и GRANT — на Postgres как раньше ([basic/05-roles-privileges](../postgresql-basic/05-roles-privileges.md)).

## HA и SPOF

PgBouncer на одном хосте — single point of failure. Варианты:

- два PgBouncer за LB;
- sidecar PgBouncer в K8s pod (меньше sharing);
- RDS Proxy в AWS.

## vs application pool

| | App pool (SQLAlchemy) | PgBouncer |
|---|----------------------|-----------|
| Где | В каждом pod | Централизованно |
| Server conns | pods × pool_size | default_pool_size |
| Лучше когда | Мало pods | Много pods / serverless |

Часто **оба**: маленький app pool + PgBouncer.

## Типичные ошибки

1. `default_pool_size = 500` «чтобы не ждать» — убили Postgres.
2. Transaction mode + heavy prepared statements без настройки driver.
3. Подключать миграции через transaction pooler — DDL/session issues.
4. Забыть `server_reset_query` — утечка `search_path` между клиентами.

## Чек-лист

- [ ] transaction vs session pool
- [ ] Prepared statements issue
- [ ] PgBouncer SPOF — mitigation
- [ ] `max_client_conn` vs `default_pool_size`
- [ ] Миграции — напрямую на 5432

## Дальше

Лаба: [16-lab-pgbouncer.md](16-lab-pgbouncer.md).
