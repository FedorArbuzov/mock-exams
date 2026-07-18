# 18. Лаба: parallel fetch

## Цель лабы

Воспроизвести логику gateway **`/aggregate`** и **`/aggregate-parallel`** локально: три upstream JSON fetch **sequential vs parallel**, замер **wall-clock**, обработка **503** на одном upstream. Закрепить **httpx**, **gather**, **TaskGroup**, **Semaphore**.

## Предварительно

- [09-gather-vs-taskgroup](09-gather-vs-taskgroup.md), [17-async-http-httpx](17-async-http-httpx.md).
- Стенд **8095** healthy.

```bash
curl -s -w "\nseq:%{time_total}s\n" http://localhost:8095/aggregate
curl -s -w "\npar:%{time_total}s\n" http://localhost:8095/aggregate-parallel
```

Запишите baseline: sequential ~**1 s**, parallel ~**0.5 s**.

---

## Задание 1. Три «upstream» URL

**Зачем:** имитация microservices A/B/C через один gateway (разные path/delay).

```python
UPSTREAMS = [
    "http://localhost:8095/slow?extra_ms=0",   # ~200ms base
    "http://localhost:8095/slow?extra_ms=50",  # ~250ms
    "http://localhost:8095/slow?extra_ms=100", # ~300ms
]
# или /json?size=5 для всех трёх — ближе к gateway aggregate
JSON_UPSTREAMS = [
    "http://localhost:8095/json?size=5",
] * 3
```

Gateway fan-out идёт на **slow-a/b/c** внутри compose; с хоста используйте **slow** с разным extra_ms как proxy.

---

## Задание 2. Sequential aggregator

`labs/18_sequential.py`:

```python
import asyncio
import time

import httpx

UPSTREAMS = [
    "http://localhost:8095/json?size=5",
    "http://localhost:8095/json?size=5",
    "http://localhost:8095/json?size=5",
]

async def fetch_one(client: httpx.AsyncClient, url: str) -> dict:
    r = await client.get(url)
    r.raise_for_status()
    return r.json()

async def aggregate_sequential(client: httpx.AsyncClient) -> list[dict]:
    results = []
    for url in UPSTREAMS:
        results.append(await fetch_one(client, url))
    return results

async def main():
    t0 = time.perf_counter()
    async with httpx.AsyncClient(timeout=30.0) as client:
        data = await aggregate_sequential(client)
    print(f"sequential: {time.perf_counter() - t0:.3f}s")
    print("services:", [d.get("service") for d in data])

if __name__ == "__main__":
    asyncio.run(main())
```

**Что увидите:** ~**0.6–1.0 s** (сумма upstream delays через gateway routing).

---

## Задание 3. Parallel aggregator (gather)

`labs/18_parallel_gather.py`:

```python
async def aggregate_parallel_gather(client: httpx.AsyncClient) -> list[dict]:
    return list(await asyncio.gather(*(fetch_one(client, u) for u in UPSTREAMS)))

async def main():
    t0 = time.perf_counter()
    async with httpx.AsyncClient(timeout=30.0) as client:
        data = await aggregate_parallel_gather(client)
    print(f"parallel gather: {time.perf_counter() - t0:.3f}s")
```

**Что увидите:** ~**0.25–0.4 s** — близко к **max** delay, сопоставимо с `/aggregate-parallel`.

---

## Задание 4. Parallel через TaskGroup

```python
async def aggregate_parallel_tg(client: httpx.AsyncClient) -> list[dict]:
    async with asyncio.TaskGroup() as tg:
        tasks = [tg.create_task(fetch_one(client, u)) for u in UPSTREAMS]
    return [t.result() for t in tasks]
```

**Что увидите:** время ≈ gather version.

---

## Задание 5. Semaphore + 12 URLs

**Зачем:** many upstreams с лимитом.

```python
SEM = asyncio.Semaphore(4)
URLS = [f"http://localhost:8095/slow?extra_ms={i*10}" for i in range(12)]

async def fetch_limited(client, url):
    async with SEM:
        return await fetch_one(client, url)

async def main():
    t0 = time.perf_counter()
    async with httpx.AsyncClient(timeout=30) as client:
        await asyncio.gather(*(fetch_limited(client, u) for u in URLS))
    print(f"12 urls sem4: {time.perf_counter() - t0:.3f}s")
```

**Что увидите:** batches по ~4 concurrent — время между pure gather(12) и sequential.

---

## Задание 6. Partial failure

**Зачем:** один upstream `/fail`, остальные ok.

```python
MIXED = [
    "http://localhost:8095/json?size=3",
    "http://localhost:8095/fail?rate=1.0",
    "http://localhost:8095/json?size=3",
]

async def demo_partial():
    async with httpx.AsyncClient(timeout=30) as client:
        results = await asyncio.gather(
            *(fetch_one(client, u) for u in MIXED),
            return_exceptions=True,
        )
        for i, r in enumerate(results):
            print(i, "ok" if not isinstance(r, Exception) else type(r).__name__)
```

**Что увидите:** `[0 ok, 1 HTTPStatusError, 2 ok]` — degraded aggregate pattern ([09-gather-vs-taskgroup](09-gather-vs-taskgroup.md)).

---

## Задание 7. Сверка с gateway source

Прочитайте [`app.py`](../../deploy/python-async/mock-server/app.py) функции `aggregate` и `aggregate_parallel`. Ваш parallel gather **изomorphic** gateway logic.

---

## Если не работает

| Симптом | Действие |
|---------|----------|
| parallel ≈ sequential | requests не concurrent — один client, gather ok? |
| 502 aggregate | `docker compose ps` — upstream healthy |
| fail lab always errors | `/fail?rate=0.3` |
| TaskGroup on 3.10 | используйте только gather |

---

## Критерии успеха

- [ ] sequential slower ~2× parallel (для 3 upstreams)
- [ ] parallel ≈ curl `/aggregate-parallel` order of magnitude
- [ ] TaskGroup и gather — сопоставимое время
- [ ] Semaphore(4) на 12 urls — bounded concurrency
- [ ] partial failure с return_exceptions понятен
- [ ] Прочитан source gateway aggregate*

---

## Уборка

```bash
# опционально
cd deploy/python-async && docker compose down
```

Скрипты `labs/18_*.py` — база для [36-capstone](36-capstone.md).

---

## Вопросы для самопроверки

1. Почему sequential time ≈ sum, parallel ≈ max?
2. Когда TaskGroup лучше gather для aggregate?
3. Как вернуть 200 с partial data при одном 503?
4. Чем этот курс глубже [27-async-patterns](../fastapi/27-async-patterns.md)?
5. Как добавить Redis cache к aggregate ([28-redis-cache](../fastapi/28-redis-cache.md))?

**Фаза 1–3 завершена.** Дальше — блокирующий код и executors ([19-asyncpg-database](19-asyncpg-database.md)).
