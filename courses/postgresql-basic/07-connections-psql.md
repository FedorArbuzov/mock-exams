# 07. Подключение: psql, URI, пулы

## Сценарий с работы

Пятница, релиз. Kubernetes поднял 80 подов FastAPI, каждый с `pool_size=20` — теоретически **1600** соединений к Postgres при `max_connections=100`. Очередь, таймауты, «random» 500 в логах. Другой инцидент: DBA смотрит `pg_stat_activity` — 200 сессий `psql`, потому что никто не ставил `application_name` и непонятно, кто держит `idle in transaction`.

Эта глава — как **правильно подключаться**: URI, клиент `psql`, лимиты, SSL и зачем нужен пул (PgBouncer — в [intermediate](../postgresql-intermediate/15-pgbouncer.md)).

## Что вы узнаете

- Формат connection URI и полезные query-параметры
- Команды `psql` для ежедневной работы
- `application_name` и диагностика в `pg_stat_activity`
- Почему тысячи прямых соединений — антипаттерн
- `sslmode` для локалки и прода

## Connection URI

```text
postgresql://shop_writer:writer_pass@localhost:5432/course?sslmode=prefer&application_name=shop-api
```

| Компонент | Пример | Заметка |
|-----------|--------|---------|
| Схема | `postgresql://` | Синоним `postgres://` |
| User / password | `shop_writer:writer_pass` | URL-encode спецсимволы в пароле |
| Host / port | `localhost:5432` | В K8s — service name |
| Database | `course` | Не путать с именем кластера |
| Query params | `sslmode`, `connect_timeout` | См. ниже |

Полезные параметры:

```text
?connect_timeout=5
&application_name=shop-api
&options=-csearch_path%3Dshop
```

`options=-csearch_path=shop` задаёт схему для сессии (альтернатива `SET search_path` в SQL).

В Python ([fastapi/16-lab-postgres](../fastapi/16-lab-postgres.md)):

```python
DATABASE_URL = "postgresql+asyncpg://shop_writer:writer_pass@localhost:5432/course"
```

Префикс `postgresql+asyncpg` — диалект SQLAlchemy; на сервер уходит обычный Postgres protocol.

## psql — швейцарский нож админа

| Команда | Действие |
|---------|----------|
| `\?` | Справка по meta-командам |
| `\h CREATE TABLE` | SQL help |
| `\conninfo` | Текущее подключение |
| `\dt shop.*` | Таблицы схемы |
| `\d shop.products` | Колонки, индексы, FK |
| `\dp shop.*` | Права (ACL) |
| `\timing on` | Время выполнения запросов |
| `\x auto` | Вертикальный вывод широких строк |
| `\e` | Открыть редактор (запрос из файла) |
| `\i file.sql` | Выполнить файл |
| `\copy` | Импорт/экспорт **от имени клиента** |
| `\watch 2` | Повторять запрос каждые 2 сек |

**`\copy` vs `COPY`:** `COPY` — сервер читает/пишет файл **на сервере** (нужны суперправа или `pg_read_server_files`). `\copy` — поток через клиент: безопасно с ноутбука в RDS.

Пример экспорта ([08-lab-psql](08-lab-psql.md)):

```sql
\copy (SELECT * FROM shop.products) TO 'products.csv' CSV HEADER
```

## application_name

```sql
SET application_name = 'gitlab-ci-migrate';
```

или в URI: `?application_name=shop-api`.

В `pg_stat_activity`:

```sql
SELECT pid, application_name, usename, state, left(query, 60)
FROM pg_stat_activity
WHERE datname = 'course';
```

В проде по имени отличают: API, Celery worker, миграция, Metabase. Без этого — «кто-то держит lock» без ответа.

## Лимиты подключений и память

```sql
SHOW max_connections;   -- часто 100
SHOW work_mem;            -- на операцию сортировки/hash в запросе
```

Каждое соединение — backend-процесс ([01-architecture](01-architecture.md)). Память **не** `max_connections × work_mem` всегда, но при тяжёлых запросах пики опасны.

| Подход | Когда |
|--------|-------|
| Пул в приложении (SQLAlchemy pool, pgx pool) | Десятки воркеров, ограниченный размер |
| PgBouncer transaction pooling | Сотни/тысячи клиентов, короткие транзакции |
| Увеличить `max_connections` до 5000 | Почти никогда |

Правило: **считайте** `pods × pool_size < max_connections` с запасом на admin и репликацию.

## SSL / TLS

| sslmode | Поведение |
|---------|-----------|
| `disable` | Без TLS — только локальная разработка |
| `prefer` | TLS если сервер умеет |
| `require` | TLS обязателен |
| `verify-full` | TLS + проверка hostname CA — **production** |

RDS, Aurora, managed Postgres — `verify-full` и корпоративный CA. Лаба SSL — [security/09-lab-ssl](../postgresql-security/09-lab-ssl.md).

## Типичные ошибки

1. Новый микросервис на каждый pod без пула — исчерпание `max_connections`.
2. Долгоживущие сессии ORM с открытой транзакцией — блокировка vacuum ([11-transactions-mvcc](11-transactions-mvcc.md)).
3. `sslmode=disable` в проде «потому что так в туториале».
4. `COPY '/tmp/file'` на RDS — нет доступа к файловой системе сервера; используйте `\copy`.

## Чек-лист

- [ ] Собираю URI из частей и знаю query params
- [ ] Умею `\d`, `\dt`, `\dp`, `\timing`
- [ ] Знаю разницу `\copy` и `COPY`
- [ ] Ставлю `application_name` для диагностики
- [ ] Понимаю, почему 10 000 прямых connections — плохая идея

## Дальше

Лаба: [08-lab-psql.md](08-lab-psql.md).
