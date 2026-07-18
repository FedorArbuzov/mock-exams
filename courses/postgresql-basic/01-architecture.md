# 01. Архитектура PostgreSQL

## Сценарий с работы

Вторник, 11:00. В Slack пишут: «Postgres тормозит, поднимите ещё один инстанс». Вы открываете Docker Compose, добавляете второй контейнер с Postgres — и через час получаете **две несвязанные базы** с разными данными. На созвоне коллега говорит «создай database для staging» — вы делаете `CREATE DATABASE` и думаете, что подняли отдельный сервер. DBA спрашивает: «Сколько backend-процессов на проде?» — вы отвечаете «ну, один Postgres», и это тоже не то.

Такие путаницы случаются, когда нет картины **процессов**, **файлов на диске** и **терминов** (cluster, instance, database, schema). Этот урок — фундамент для всей ветки PostgreSQL в mock-exams: от [basic](README.md) до [advanced](../postgresql-advanced/README.md), [developer](../postgresql-developer/README.md) и [performance](../postgresql-performance/README.md).

Стенд курса: [`deploy/postgres`](../../deploy/postgres/README.md) — `docker compose up`, порт `5432`, пользователь `course`.

## Что вы узнаете

- Процессную модель: postmaster, фоновые воркеры, backend на каждое соединение.
- Что такое **кластер** (instance) и где лежат данные на диске.
- Разницу между **database**, **schema** и «отдельным сервером».
- Зачем нужны `postgresql.conf`, `pg_hba.conf` и каталоги `pg_catalog`.
- Как устроены major/minor версии и чем Postgres отличается от MySQL на уровне идей.

## Процессная модель: не потоки, а процессы

PostgreSQL — **многопроцессная** СУБД. Главный процесс называется **postmaster** (в логах и документации иногда «postgres»). Он не выполняет ваши запросы сам — он **принимает подключения** и **порождает дочерние процессы**.

```text
postmaster (главный процесс)
├── background writer   — сбрасывает «грязные» страницы из shared_buffers на диск
├── checkpointer      — контрольные точки (checkpoint)
├── WAL writer        — запись WAL на диск
├── autovacuum launcher — запускает autovacuum worker'ов
├── stats collector   — статистика для pg_stat_*
└── backend process   — по одному на каждое клиентское подключение
```

**Почему это важно на практике**

Каждое TCP-соединение из приложения = **отдельный OS-процесс** внутри Postgres. Процесс потребляет память (буферы, `work_mem` на запросы). Сотня соединений — ещё терпимо; **тысячи** — типичная история «Postgres съел всю RAM», хотя запросы простые.

Отсюда правило, которое всплывёт снова в [intermediate/15-pgbouncer](../postgresql-intermediate/15-pgbouncer.md): при большом числе клиентов нужен **connection pool** (PgBouncer, pooler в ORM, pgx pool с ограничением). Пул держит мало реальных соединений к Postgres, а приложения «делят» их.

| Вопрос на собесе | Короткий ответ |
|------------------|----------------|
| Сколько backend на 100 соединений? | 100 (если нет пула) |
| Кто выполняет `SELECT`? | Backend-процесс вашей сессии |
| Что делает postmaster при `SELECT`? | Ничего с запросом — только управление |

Сравнение: MySQL InnoDB исторически больше опирался на **потоки** на соединение; SQLite — вообще встраиваемая библиотека в процесс приложения. Postgres сознательно выбрал изоляцию процессов: падение одного backend не валит весь сервер.

## Файлы данных: один кластер = один PGDATA

Все данные одного **кластера** лежат в каталоге **PGDATA** (часто `/var/lib/postgresql/data` в Docker). Пока postmaster запущен с этим каталогом — это **один инстанс** Postgres.

| Путь (типично) | Содержимое |
|----------------|------------|
| `PGDATA` | Корень кластера |
| `base/` | Файлы таблиц пользовательских БД (по OID базы) |
| `global/` | Общие системные каталоги (роли, таблиспейсы) |
| `pg_wal/` | WAL — журнал изменений (Write-Ahead Log) |
| `postgresql.conf` | Параметры сервера |
| `postgresql.auto.conf` | Параметры из `ALTER SYSTEM` |
| `pg_hba.conf` | Кто и **как** может подключиться |
| `pg_ident.conf` | Сопоставление OS-пользователя → DB-роль |

WAL — центральная идея **надёжности**: сначала запись в журнал, потом изменение страниц данных. Об этом подробнее в [intermediate/04-lab-wal](../postgresql-intermediate/04-lab-wal.md) и [11-transactions-mvcc](11-transactions-mvcc.md).

**Проверка в лабе** ([02-lab-install](02-lab-install.md)):

```sql
SHOW data_directory;
```

```bash
docker exec mock-postgres ls -la /var/lib/postgresql/data/pg_wal | head
```

Вы увидите сегменты WAL — даже на пустой учебной БД журнал уже работает.

## Кластер, база данных, схема — не путать

Терминология Postgres путает новичков, потому что слово **cluster** в документации — не Kubernetes cluster и не «кластер реплик» (хотя репликация тоже бывает).

| Термин | Что это на самом деле |
|--------|------------------------|
| **Instance / cluster** | Запущенный postmaster + один каталог PGDATA |
| **Database** | Изолированное пространство имён внутри кластера: свои схемы, свои объекты; **нет** cross-database запросов в одном SQL |
| **Schema** | Namespace внутри БД: `public`, `app`, `audit` |
| **Table** | Таблица внутри схемы: `app.orders` |

`CREATE DATABASE staging;` — это **не** новый сервер в Docker. Это вторая база **в том же** postmaster, на тех же файлах PGDATA, с тем же `postgresql.conf`. Для настоящей изоляции staging/prod используют **разные инстансы** (другой контейнер, другой RDS, другой PGDATA) — см. [ops/06-blue-green](../postgresql-ops/06-blue-green.md).

```text
Один кластер (PGDATA)
├── database: course      ← наш стенд mock-exams
├── database: postgres    ← служебная
└── database: template1   ← шаблон для CREATE DATABASE
        └── schema: public
                └── table: ...
```

В приложениях ([fastapi](../../deploy/fastapi/README.md), [django](../../deploy/django/README.md)) в connection string указывают **имя database** (`course`), не «имя кластера».

## Системные каталоги

Метаданные Postgres хранятся в **системных таблицах** (каталогах). Напрямую их редко трогают; для людей есть представления в `pg_catalog` и `information_schema`.

| Каталог / представление | Назначение |
|-------------------------|------------|
| `pg_database` | Список баз в кластере |
| `pg_class` | Таблицы, индексы, sequence (relation) |
| `pg_roles` / `pg_authid` | Роли, атрибуты, пароли |
| `pg_stat_user_tables` | Статистика по таблицам (живые/мёртвые строки) |

Пример из [08-lab-psql](08-lab-psql.md):

```sql
SELECT datname FROM pg_database WHERE datistemplate = false;
SELECT relname, relkind FROM pg_class WHERE relnamespace = 'public'::regnamespace LIMIT 10;
```

Понимание каталогов пригодится, когда в [performance](../postgresql-performance/README.md) будете копать статистику планировщика, а в [security](../postgresql-security/README.md) — права и аудит.

## Конфигурация и безопасность подключений

**`postgresql.conf`** — размер памяти, WAL, логирование, autovacuum. Меняется через файл или `ALTER SYSTEM` ([intermediate/01-configuration](../postgresql-intermediate/01-configuration.md)).

**`pg_hba.conf`** (host-based authentication) — **первая линия обороны**: с какого IP, под каким пользователем, к какой БД, каким методом (scram-sha-256, cert, peer). Ошибка в hba — симптом «connection refused» или «no pg_hba.conf entry», хотя Postgres запущен. Подробнее в [05-roles-privileges](05-roles-privileges.md) и [security/02-scram-auth](../postgresql-security/02-scram-auth.md).

Типичная строка для локального стенда:

```text
# TYPE  DATABASE  USER    ADDRESS        METHOD
host    all       all     0.0.0.0/0      scram-sha-256
```

После правки hba — `SELECT pg_reload_conf();` или `pg_ctl reload`.

## Версии: major и minor

В курсе ориентир — **PostgreSQL 16** (образ в `deploy/postgres`).

| Тип обновления | Пример | Как обновлять |
|----------------|--------|---------------|
| **Minor** | 16.2 → 16.3 | Пакет/образ + restart (иногда reload) |
| **Major** | 16 → 17 | `pg_upgrade` или dump/restore; тест миграций |

Major-апгрейд — отдельный проект: совместимость расширений, downtime, откат ([advanced/09-major-upgrade](../postgresql-advanced/09-major-upgrade.md)). Minor — рутина DevOps.

Проверка:

```sql
SELECT version();
SHOW server_version_num;
```

## PostgreSQL vs MySQL / SQLite (уровень идей)

| | PostgreSQL | MySQL (InnoDB) | SQLite |
|---|------------|----------------|--------|
| Модель | Процессы, один кластер — много БД | Потоки, привычная «одна БД на инстанс» | Файл в приложении |
| MVCC | Версии строк (xmin/xmax) | Undo log | Упрощённая блокировка |
| WAL / журнал | WAL | Redo log | Journal mode |
| Репликация | Physical + logical | Binlog (logical) | Ограниченная |
| Типичное место | Основная БД приложения | Legacy, часть SaaS | Edge, тесты, mobile |

Если вы пришли из [django](../django/README.md) или [sqlalchemy-deep](../sqlalchemy-deep/README.md) — ORM скрывает движок, но **поведение транзакций и блокировок** зависит от СУБД. Глава [11-transactions-mvcc](11-transactions-mvcc.md) как раз про это.

## Типичные ошибки новичков

1. **«Подниму второй Postgres в compose без понимания PGDATA»** — получите два независимых кластера; репликации между ними нет, пока вы её не настроите.
2. **«CREATE DATABASE = новый сервер»** — нет, только новое пространство имён в том же кластере.
3. **«Открою 500 соединений из воркеров»** — 500 backend-процессов; без пула память и context switch убьют latency.
4. **Правка только `postgresql.conf`, забыли `pg_hba.conf`** — Postgres запущен, клиент не пускает.

## Чек-лист

- [ ] Могу нарисовать схему: postmaster → backend на соединение.
- [ ] Знаю, где WAL и зачем он нужен (durability).
- [ ] Отличаю cluster/instance от database и schema.
- [ ] Понимаю роль `pg_hba.conf` при «не подключается».
- [ ] Знаю, что major upgrade ≠ minor patch.

## Дальше

Следующий шаг — руки на стенде: [02-lab-install.md](02-lab-install.md) (Docker, `psql`, первые метакоманды).

Связанные курсы: [containers-basic](../containers-basic/README.md) (Docker), [fastapi/16-lab-postgres](../fastapi/16-lab-postgres.md) (подключение из приложения).
