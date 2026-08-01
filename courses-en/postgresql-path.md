# PostgreSQL learning path (mega-course plan)

The plan and status of rewriting the PostgreSQL branch in mock-exams: from **cheat sheets** (~25–40 lines per lesson) into **mega-courses** (~150–250 lines, like longer theory courses in this repo).

Overall repository map: [README.md](README.md). DevOps route: [devops-path.md](devops-path.md).

## The problem right now

| Track | Lessons | Avg. lines/lesson | Style |
|------|--------|----------------|-------|
| postgresql-basic | 15 | ~180 | ✅ mega-course |
| postgresql-intermediate | 17 | ~180 | ✅ mega-course |
| postgresql-advanced | 15 | ~110 | ✅ mega-course |
| postgresql-developer | 15 | ~110 | ✅ mega-course |
| postgresql-performance | 13 | ~110 | ✅ mega-course |
| postgresql-ops | 13 | ~110 | ✅ mega-course |
| postgresql-security | 14 | ~110 | ✅ mega-course |
| **Total** | **~102** | — | **✅ 102/102 mega-course** |

For comparison: longer theory courses in this repo aim for **~150–250 lines** per lesson (work scenario, antipatterns, cross-links). [`go-basic`](go-basic/README.md) is a **short on-ramp** (~6–8 h), not that format.

## Target style (reference)

Each **theory** lesson:

1. **Work scenario** — an incident, an interview, a code review, a common point of confusion.
2. **What you'll learn** — 4–6 points.
3. **Body** — coherent text, diagrams, tables where appropriate, SQL with a line-by-line explanation.
4. **Common mistakes / antipatterns**.
5. **Relations** — links to deploy, fastapi, django, the following chapters.
6. **Checklist** — self-check before the lab.

Each **lab**:

1. Context ("why this matters in production").
2. Preconditions (stack, version, schema).
3. Step-by-step tasks with the expected output.
4. "What went wrong" — 2–3 troubleshooting scenarios.
5. Success criteria (as now, but in more detail).

Sample file after the rewrite: [`postgresql-basic/01-architecture.md`](postgresql-basic/01-architecture.md).

## Path diagram

```text
postgresql-basic  →  postgresql-intermediate  →  postgresql-advanced
       │                      │
       ├── postgresql-developer (after basic, in parallel with intermediate)
       │         migrations, JSONB, FTS, N+1, advisory locks
       │
       └── after intermediate (branching):
                 ├── postgresql-performance  (planner, indexes, pgbench)
                 ├── postgresql-ops          (pgBackRest, WAL-G, blue/green, on-call)
                 └── postgresql-security     (SCRAM, RLS, pgaudit, compliance)
```

Stack: [`deploy/postgres`](../deploy/postgres/README.md) — port **5432**, DB `course`, extensions per track (hypopg, pgaudit, pg_trgm).

## Rewrite queue

### Phase 1 — foundation (P0) ✅

| # | File | Status |
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

### Phase 2 — operations (P1) ✅

| # | File | Status |
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

### Phase 3 — advanced (P2) ✅

| # | File | Status |
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

### Phase 4 — specializations (P3)

| Track | Focus | Status |
|------|-------|--------|
| developer | Flyway/Liquibase, N+1, JSONB, FTS, CI | ✅ **15 lessons** |
| **performance** | planner, JIT, auto_explain, hypopg, pgbench | ✅ **13 lessons** |
| ops | backup, pgBackRest, WAL-G, blue/green, on-call | ✅ **13 lessons** |
| security | threat model, SCRAM, RLS, encryption, audit | ✅ **14 lessons** |

## Relation to the backend tracks

| Course | Relation to Postgres |
|------|------------------|
| [fastapi](fastapi/README.md) | SQLAlchemy async, Alembic, [16-lab-postgres](fastapi/16-lab-postgres.md) |
| [django](django/README.md) | models, migrations, [07-models-basics](django/07-models-basics.md) |
| [sqlalchemy-deep](sqlalchemy-deep/README.md) | engine, pool, N+1, transactions |
| [python-async](python-async/README.md) | asyncpg, connection pool |
| [python-testing](python-testing/README.md) | testcontainers, integration DB |
| [kuber-intermediate](kuber-intermediate/README.md) | StatefulSet, CloudNativePG lab |
| [aws-intermediate](aws-intermediate/README.md) | RDS private |

## Scope estimate

- ~103 lessons × ~150 new lines ≈ **15k lines** of content.
- Recommended pace: **5–8 theory chapters + their labs** per iteration.
- Expand labs moderately: practice matters, but don't duplicate the theory.

## Branch status

**`postgresql-basic`** — mega-course (15 lessons).  
**`postgresql-intermediate`** — mega-course (17 lessons).  
**`postgresql-advanced`** — mega-course (15 lessons). The admin branch **basic → intermediate → advanced** (47 lessons) is complete.

**`postgresql-performance`** — mega-course (13 lessons).  
**`postgresql-ops`** — mega-course (13 lessons).  
**`postgresql-security`** — mega-course (14 lessons).  
**`postgresql-developer`** — mega-course (15 lessons).

**The PostgreSQL branch is complete:** 102 lessons in mega-course format (basic → intermediate → advanced → 4 specializations).
