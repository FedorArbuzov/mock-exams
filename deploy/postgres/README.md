# PostgreSQL для курсов

## Запуск

```bash
cd deploy/postgres
docker compose build
docker compose up -d
```

Подключение:

```bash
psql "postgresql://course:course@localhost:5432/course"
```

Windows: `docker exec -it mock-postgres psql -U course -d course`

## pgAdmin

[http://localhost:5050](http://localhost:5050) — `admin@course.local` / `course`

Add server: host `postgres` (из pgAdmin container) или `host.docker.internal` (с хоста).

## Расширения (мини-курсы)

Образ собирается из [`Dockerfile`](Dockerfile) и включает:

| Расширение | Курсы |
|---|---|
| `pg_stat_statements` | basic, intermediate, performance |
| `hypopg` | postgresql-performance |
| `pgaudit` | postgresql-security |
| `pg_trgm`, `btree_gin` | postgresql-developer (FTS, JSONB) |

После смены образа пересоберите и пересоздайте volume:

```bash
docker compose down -v
docker compose build --no-cache
docker compose up -d
```

## Flyway / Liquibase (postgresql-developer)

- [Flyway CLI](https://flywaydb.org/download) — Java 17+
- [Liquibase CLI](https://www.liquibase.org/download) — опционально для урока 05

Примеры: [`courses/postgresql-developer/examples`](../../courses/postgresql-developer/examples/).

## MinIO (postgresql-ops, опционально)

```bash
docker compose -f docker-compose.yml -f docker-compose.ops.yml up -d
```

Console: [http://localhost:9001](http://localhost:9001) — `minioadmin` / `minioadmin`

## Сброс данных

```bash
docker compose down -v
```

## Реплика (intermediate)

Второй инстанс на порту 5433 — см. [postgresql-intermediate/06-lab-streaming-replication.md](../../courses/postgresql-intermediate/06-lab-streaming-replication.md).
