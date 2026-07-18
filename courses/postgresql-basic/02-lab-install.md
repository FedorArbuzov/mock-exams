# 02. Лаба: установка и первое подключение

## Зачем эта лаба

Прежде чем копать MVCC и репликацию, нужно **уверенно подключаться** к Postgres и понимать, что «сервер запущен» — не то же самое, что «я могу выполнить запрос». В проде половина тикетов «БД не работает» заканчивается: контейнер не healthy, неверный порт, опечатка в пароле, или `pg_hba.conf` не пускает с вашего IP.

Эта лаба поднимает учебный стенд из [`deploy/postgres`](../../deploy/postgres/README.md) и знакомит с `psql` — инструментом, которым вы будете пользоваться во всех следующих главах и на собесах.

## Предусловия

- Docker и Docker Compose установлены ([`containers-basic`](../containers-basic/README.md)).
- Репозиторий `mock-exams` склонирован локально.
- Порт **5432** на хосте свободен (или измените mapping в compose).

## Задание 1. Поднять Postgres в Docker

Из корня репозитория:

```bash
cd deploy/postgres
docker compose build
docker compose up -d
docker compose ps
```

**Ожидаемый результат:** сервис `postgres` в статусе `running` и healthcheck `healthy` (может занять 10–30 секунд после первого старта).

Проверка готовности без входа в контейнер:

```bash
docker exec mock-postgres pg_isready -U course -d course
```

Должно вернуть: `accepting connections`.

### Если не поднялось

| Симптом | Что проверить |
|---------|---------------|
| `port is already allocated` | Другой Postgres на 5432: `docker ps`, остановите конфликтующий сервис |
| `unhealthy` долго | `docker compose logs postgres` — ошибки инициализации PGDATA |
| `no such file` | Вы не в `deploy/postgres` или нет `docker-compose.yml` |

После смены образа с расширениями иногда нужен сброс volume — см. [deploy/postgres README](../../deploy/postgres/README.md).

## Задание 2. Первое подключение через psql

**С хоста** (если установлен клиент `psql`):

```bash
psql "postgresql://course:course@localhost:5432/course"
```

**Через контейнер** (работает всегда):

```bash
docker exec -it mock-postgres psql -U course -d course
```

Приглашение `course=#` означает: вы подключены к БД `course` как суперпользователь `course` (на учебном стенде это нормально; в проде приложение так не подключается — см. [05-roles-privileges](05-roles-privileges.md)).

Разбор URI:

```text
postgresql://course:course@localhost:5432/course
            │      │        │         │      └── database
            │      │        │         └── порт
            │      │        └── хост
            │      └── пароль
            └── пользователь (роль)
```

## Задание 3. Первые команды в psql

В интерактивной сессии:

```sql
SELECT version();
\conninfo
\l
\du
\q
```

| Команда | Что покажет |
|---------|-------------|
| `SELECT version()` | Версия PostgreSQL (ожидайте **16.x**) |
| `\conninfo` | Текущее подключение: хост, порт, user, database |
| `\l` | Список баз в **кластере** (не «на сервере в облаке» — в одном PGDATA) |
| `\du` | Роли (пользователи и группы) |
| `\q` | Выход |

**Связь с теорией:** список `\l` — это содержимое каталога `pg_database` из [01-architecture](01-architecture.md). Несколько баз — один postmaster, один каталог `PGDATA`.

## Задание 4. Файлы данных внутри контейнера

Убедитесь, что данные лежат там, где ожидаете:

```bash
docker exec mock-postgres psql -U course -c "SHOW data_directory;"
docker exec mock-postgres ls -la /var/lib/postgresql/data/pg_wal | head
```

Первая команда — путь PGDATA. Вторая — сегменты **WAL** (журнал). Даже без ваших таблиц WAL уже пишется: так Postgres обеспечивает durability.

Опционально — pgAdmin из того же compose:

- [http://localhost:5050](http://localhost:5050) — `admin@course.local` / `course`
- Add Server: host `postgres` (из сети compose) или `host.docker.internal` с хоста Windows

## Задание 5. Мини-проверка «я админ кластера»

```sql
SELECT current_user, current_database();
SHOW server_version;
SELECT datname FROM pg_database WHERE datistemplate = false;
```

Запомните: `course` — и имя роли, и имя БД на стенде. В реальном проекте роли и БД **разделяют** (app не называется как database).

## Критерии успеха

- [ ] `docker compose ps` — postgres healthy
- [ ] `pg_isready` → accepting connections
- [ ] `SELECT 1` и `SELECT version()` работают
- [ ] Можете объяснить URI `postgresql://course:course@localhost:5432/course` по частям
- [ ] Видели каталог `pg_wal` и понимаете, что это не «папка с бэкапами»

## Дальше

Теория объектов БД: [03-databases-schemas.md](03-databases-schemas.md).  
Практика DDL на схеме `shop`: [04-lab-ddl.md](04-lab-ddl.md).
