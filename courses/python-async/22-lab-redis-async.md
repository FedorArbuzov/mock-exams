# 22. Лаба: Redis async cache

## Цель лабы

Реализовать **cache-aside** поверх данных из [20-lab-async-database](20-lab-async-database.md): читать агрегат `fetch_log` через Redis, инвалидировать при insert, измерить ускорение повторных запросов.

## Предварительно

- [21-redis-asyncio](21-redis-asyncio.md).
- Стенды: [`deploy/redis`](../../deploy/redis/README.md), [`deploy/postgres`](../../deploy/postgres/README.md).
- Таблица `fetch_log` заполнена (лаба 20).

```bash
cd deploy/redis && docker compose up -d
redis-cli -h localhost -p 6379 ping
```

---

## Задание 1. Базовый клиент и ключи

`labs/22_cache.py` (фрагмент):

```python
import asyncio
import json
import time

import redis.asyncio as redis
from sqlalchemy import text
from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker

DATABASE_URL = "postgresql+asyncpg://course:course@localhost:5432/course"
REDIS_URL = "redis://localhost:6379/0"
CACHE_KEY = "stats:fetch_log:summary"
CACHE_TTL = 30

engine = create_async_engine(DATABASE_URL, pool_size=5)
SessionLocal = async_sessionmaker(engine, expire_on_commit=False)

async def get_redis() -> redis.Redis:
    return redis.from_url(REDIS_URL, decode_responses=True)
```

---

## Задание 2. Load from DB

```python
async def load_summary_from_db() -> dict:
    async with SessionLocal() as session:
        r = await session.execute(text("""
            SELECT COUNT(*) AS cnt,
                   COALESCE(AVG(latency_ms), 0) AS avg_ms
            FROM fetch_log
        """))
        row = r.mappings().one()
        return {"count": row["cnt"], "avg_ms": float(row["avg_ms"])}
```

---

## Задание 3. Cache-aside get

```python
async def get_summary(rds: redis.Redis) -> dict:
    cached = await rds.get(CACHE_KEY)
    if cached:
        return json.loads(cached)

    data = await load_summary_from_db()
    await rds.setex(CACHE_KEY, CACHE_TTL, json.dumps(data))
    return data
```

**Запуск:**

```python
async def main():
    rds = await get_redis()
    try:
        t0 = time.perf_counter()
        first = await get_summary(rds)
        t1 = time.perf_counter()
        second = await get_summary(rds)
        t2 = time.perf_counter()
        print("first:", first, f"{(t1-t0)*1000:.1f}ms")
        print("second (cache):", second, f"{(t2-t1)*1000:.1f}ms")
    finally:
        await rds.aclose()

if __name__ == "__main__":
    asyncio.run(main())
```

**Что увидите:** второй вызов **< 5 ms** (Redis), первый — десятки ms (Postgres).

---

## Задание 4. Инвалидация при write

```python
async def insert_and_invalidate(rds: redis.Redis) -> None:
    async with SessionLocal() as session:
        await session.execute(
            text("INSERT INTO fetch_log (url, status_code, latency_ms) VALUES (:u, 200, 1.0)"),
            {"u": "http://localhost:8095/health"},
        )
        await session.commit()
    await rds.delete(CACHE_KEY)
    print("cache invalidated")

async def demo_invalidate():
    rds = await get_redis()
    await get_summary(rds)  # warm cache
    await insert_and_invalidate(rds)
    fresh = await get_summary(rds)
    print("after insert:", fresh)
    await rds.aclose()
```

**Что увидите:** `count` увеличился на 1 после invalidate.

---

## Задание 5. Concurrent readers (thundering herd lite)

**Зачем:** 10 корутин на cache miss — только одна должет идти в DB (упрощённо через lock).

```python
_lock = asyncio.Lock()

async def get_summary_safe(rds: redis.Redis) -> dict:
    cached = await rds.get(CACHE_KEY)
    if cached:
        return json.loads(cached)

    async with _lock:
        cached = await rds.get(CACHE_KEY)
        if cached:
            return json.loads(cached)
        data = await load_summary_from_db()
        await rds.setex(CACHE_KEY, CACHE_TTL, json.dumps(data))
        return data

async def concurrent_get():
    rds = await get_redis()
    await rds.delete(CACHE_KEY)
    results = await asyncio.gather(*[get_summary_safe(rds) for _ in range(10)])
    assert all(r == results[0] for r in results)
    print("all equal:", results[0])
    await rds.aclose()
```

**Что увидите:** одинаковый dict у всех 10; в логах Postgres — **один** тяжёлый SELECT (проверьте `log_min_duration` на стенде).

---

## Задание 6. TTL expiry

```python
async def demo_ttl():
    rds = await get_redis()
    await rds.setex("demo:ttl", 2, "x")
    print("ttl:", await rds.ttl("demo:ttl"))
    await asyncio.sleep(2.5)
    print("after sleep:", await rds.get("demo:ttl"))
    await rds.aclose()
```

**Что увидите:** `None` после истечения TTL.

---

## Если не работает

| Симптом | Действие |
|---------|----------|
| Connection refused 6379 | `docker compose ps` в deploy/redis |
| Cache всегда miss | проверьте `CACHE_KEY`, `decode_responses` |
| count=0 | выполните лабу 20 сначала |
| second call всё ещё slow | Redis не тот host; проверьте URL |

---

## Критерии успеха

- [ ] Cache hit быстрее cache miss (измерено)
- [ ] Insert + `delete` обновляет агрегат
- [ ] 10 concurrent get с lock — консистентный результат
- [ ] TTL demo работает
- [ ] `aclose()` вызывается

---

## Уборка

```bash
redis-cli -h localhost -p 6379 DEL stats:fetch_log:summary demo:ttl
```

---

## Вопросы для самопроверки

1. Почему `delete` после write, а не `set` сразу?
2. Чем in-process `Lock` отличается от Redis lock (Redlock)?
3. Когда TTL=30 слишком длинный для dashboard?
4. Где Redis в [36-capstone](36-capstone.md)?

Следующий урок: [23. Executors и blocking](23-executors-blocking.md).
