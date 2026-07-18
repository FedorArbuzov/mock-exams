# 23. Sync vs async: когда что

## Введение

«Перепишем всё на async» — не всегда win. SQLAlchemy sync + threads vs async + event loop — tradeoffs.

## Что вы узнаете

- Decision matrix sync vs async ORM.
- Celery/sync scripts vs FastAPI/async.
- Hybrid architectures.

---

## Decision matrix

| Context | Recommendation |
|---------|----------------|
| FastAPI async routes | AsyncSession + asyncpg |
| Celery tasks | **sync** Session (prefork workers) |
| CLI scripts / migrations | sync |
| Django (default) | sync ORM |
| CPU-bound in route | multiprocessing, not async ORM |

[`python-celery`](../python-celery/README.md) — sync workers.

---

## Performance reality

Async wins when:

- Many **concurrent** I/O-bound waits
- Single process handles many connections

Sync fine when:

- Worker processes already parallel (Celery `-c 8`)
- Simple CRUD low concurrency

Measure — don't assume.

---

## Hybrid

```text
FastAPI (async) ──AsyncSession──► Postgres
Celery worker (sync) ──Session──► same Postgres
Alembic (sync) ──► migrations
```

Same schema, different session types.

---

## Blocking async route antipattern

```python
@app.get("/bad")
async def bad():
    with SyncSessionLocal() as s:  # BLOCKS LOOP
        ...
```

Use `run_in_executor` or switch to sync def route + threadpool — rare.

---

## SQLAlchemy 2.0 unified

Same `select()`, same models — only session class differs.

---

## Типичные ошибки

| Mistake | Fix |
|---------|-----|
| Async everywhere in Celery | sync Session |
| Mix drivers on same engine | separate engines |
| async for 3 req/s | sync simpler |

## Резюме

Async ORM for async web servers. Sync for workers, scripts, Alembic. Same models both paths. Profile before rewrite.

Далее: [24-lab-dual-engine](24-lab-dual-engine.md).
