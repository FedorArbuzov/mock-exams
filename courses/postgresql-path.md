# PostgreSQL learning path (план мегакурсов)

План и статус переписывания ветки PostgreSQL в mock-exams: из **памяток** (~25–40 строк на урок) в **мегакурсы** (~150–250 строк, как [`go-basic`](go-basic/README.md)).

Общая карта репозитория: [README.md](README.md). DevOps-маршрут: [devops-path.md](devops-path.md).

## Проблема сейчас

| Трек | Уроков | Ср. строк/урок | Стиль |
|------|--------|----------------|-------|
| postgresql-basic | 15 | ~180 | ✅ мегакурс |
| postgresql-intermediate | 17 | ~180 | ✅ мегакурс |
| postgresql-advanced | 15 | ~110 | ✅ мегакурс |
| postgresql-developer | 15 | ~110 | ✅ мегакурс |
| postgresql-performance | 13 | ~110 | ✅ мегакурс |
| postgresql-ops | 13 | ~110 | ✅ мегакурс |
| postgresql-security | 14 | ~110 | ✅ мегакурс |
| **Итого** | **~102** | — | **✅ 102/102 мегакурс** |

Для сравнения: [`go-basic`](go-basic/README.md) — **~183 строки** на урок, сценарий с работы, антипаттерны, связи с другими курсами.

## Целевой стиль (эталон)

Каждый **теоретический** урок:

1. **Сценарий с работы** — инцидент, собес, code review, типичная путаница.
2. **Что вы узнаете** — 4–6 пунктов.
3. **Тело** — связный текст, диаграммы, таблицы где уместно, SQL с пояснением построчно.
4. **Типичные ошибки / антипаттерны**.
5. **Связи** — ссылки на deploy, fastapi, django, следующие главы.
6. **Чек-лист** — самопроверка перед лабой.

Каждая **лаба**:

1. Контекст («зачем это в проде»).
2. Предусловия (стенд, версия, схема).
3. Пошаговые задания с ожидаемым выводом.
4. «Что пошло не так» — 2–3 troubleshooting-сценария.
5. Критерии успеха (как сейчас, но подробнее).

Файл-образец после переписывания: [`postgresql-basic/01-architecture.md`](postgresql-basic/01-architecture.md).

## Схема маршрута

```text
postgresql-basic  →  postgresql-intermediate  →  postgresql-advanced
       │                      │
       ├── postgresql-developer (после basic, параллельно intermediate)
       │         миграции, JSONB, FTS, N+1, advisory locks
       │
       └── после intermediate (ветвление):
                 ├── postgresql-performance  (планировщик, индексы, pgbench)
                 ├── postgresql-ops          (pgBackRest, WAL-G, blue/green, on-call)
                 └── postgresql-security     (SCRAM, RLS, pgaudit, compliance)
```

Стенд: [`deploy/postgres`](../deploy/postgres/README.md) — порт **5432**, БД `course`, расширения по трекам (hypopg, pgaudit, pg_trgm).

## Очередь переписывания

### Фаза 1 — фундамент (P0) ✅

| # | Файл | Статус |
|---|------|--------|
| 1 | basic/01-architecture | ✅ |
| 2 | basic/02-lab-install | ✅ |
| 3 | basic/03-databases-schemas | ✅ |
| 4 | basic/04-lab-ddl | ✅ |
| 5 | basic/05-roles-privileges | ✅ |
| 6 | basic/06-lab-roles | ✅ |
| 7 | basic/07-connections-psql | ✅ |
| 8 | basic/08-lab-psql | ✅ |
| 9 | basic/09-indexes-explain | ✅ |
| 10 | basic/10-lab-indexes | ✅ |
| 11 | basic/11-transactions-mvcc | ✅ |
| 12 | basic/12-lab-mvcc | ✅ |
| 13 | basic/13-backup-pgdump | ✅ |
| 14 | basic/14-lab-backup | ✅ |
| 15 | basic/15-final-project | ✅ |

### Фаза 2 — эксплуатация (P1) ✅

| # | Файл | Статус |
|---|------|--------|
| 1 | intermediate/01-configuration | ✅ |
| 2 | intermediate/02-lab-configuration | ✅ |
| 3 | intermediate/03-wal | ✅ |
| 4 | intermediate/04-lab-wal | ✅ |
| 5 | intermediate/05-streaming-replication | ✅ |
| 6 | intermediate/06-lab-streaming-replication | ✅ |
| 7 | intermediate/07-logical-replication | ✅ |
| 8 | intermediate/08-lab-logical-replication | ✅ |
| 9 | intermediate/09-pitr | ✅ |
| 10 | intermediate/10-lab-pitr | ✅ |
| 11 | intermediate/11-vacuum-bloat | ✅ |
| 12 | intermediate/12-lab-vacuum | ✅ |
| 13 | intermediate/13-monitoring | ✅ |
| 14 | intermediate/14-lab-monitoring | ✅ |
| 15 | intermediate/15-pgbouncer | ✅ |
| 16 | intermediate/16-lab-pgbouncer | ✅ |
| 17 | intermediate/17-final-project | ✅ |

### Фаза 3 — продвинутое (P2) ✅

| # | Файл | Статус |
|---|------|--------|
| 1 | advanced/01-patroni-ha | ✅ |
| 2 | advanced/02-lab-patroni | ✅ |
| 3 | advanced/03-partitioning | ✅ |
| 4 | advanced/04-lab-partitioning | ✅ |
| 5 | advanced/05-extensions | ✅ |
| 6 | advanced/06-lab-extensions | ✅ |
| 7 | advanced/07-security | ✅ |
| 8 | advanced/08-lab-security | ✅ |
| 9 | advanced/09-major-upgrade | ✅ |
| 10 | advanced/10-lab-upgrade | ✅ |
| 11 | advanced/11-troubleshooting | ✅ |
| 12 | advanced/12-lab-troubleshooting | ✅ |
| 13 | advanced/13-cloud-k8s | ✅ |
| 14 | advanced/14-lab-cloudnativepg | ✅ |
| 15 | advanced/15-final-project | ✅ |

### Фаза 4 — специализации (P3)

| Трек | Фокус | Статус |
|------|-------|--------|
| developer | Flyway/Liquibase, N+1, JSONB, FTS, CI | ✅ **15 уроков** |
| **performance** | planner, JIT, auto_explain, hypopg, pgbench | ✅ **13 уроков** |
| ops | backup, pgBackRest, WAL-G, blue/green, on-call | ✅ **13 уроков** |
| security | threat model, SCRAM, RLS, encryption, audit | ✅ **14 уроков** |

## Связь с backend-треками

| Курс | Связь с Postgres |
|------|------------------|
| [fastapi](fastapi/README.md) | SQLAlchemy async, Alembic, [16-lab-postgres](fastapi/16-lab-postgres.md) |
| [django](django/README.md) | models, migrations, [07-models-basics](django/07-models-basics.md) |
| [sqlalchemy-deep](sqlalchemy-deep/README.md) | engine, pool, N+1, transactions |
| [python-async](python-async/README.md) | asyncpg, connection pool |
| [python-testing](python-testing/README.md) | testcontainers, integration DB |
| [kuber-intermediate](kuber-intermediate/README.md) | StatefulSet, CloudNativePG lab |
| [aws-intermediate](aws-intermediate/README.md) | RDS private |

## Оценка объёма

- ~103 урока × ~150 новых строк ≈ **15k строк** контента.
- Рекомендуемый темп: **5–8 теоретических глав + лабы к ним** за итерацию.
- Лабы расширять умеренно: практика важна, но не дублировать теорию.

## Статус ветки

**`postgresql-basic`** — мегакурс (15 уроков).  
**`postgresql-intermediate`** — мегакурс (17 уроков).  
**`postgresql-advanced`** — мегакурс (15 уроков). Admin-ветка **basic → intermediate → advanced** (47 уроков) завершена.

**`postgresql-performance`** — мегакурс (13 уроков).  
**`postgresql-ops`** — мегакурс (13 уроков).  
**`postgresql-security`** — мегакурс (14 уроков).  
**`postgresql-developer`** — мегакурс (15 уроков).

**Ветка PostgreSQL завершена:** 102 урока в формате мегакурса (basic → intermediate → advanced → 4 специализации).
