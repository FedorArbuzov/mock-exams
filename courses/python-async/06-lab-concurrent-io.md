# 06. Лаба: concurrent I/O

## Цель лабы

Закрепить **Tasks**, **TaskGroup** и **gather** на mock gateway. Построить «мини-dashboard»: параллельно загрузить **health**, **json**, **slow** endpoints. Измерить latency и обработать **случайный 503** на `/fail`.

## Предварительно

- Пройдены [02-coroutines-await](02-coroutines-await.md), [05-tasks-taskgroup](05-tasks-taskgroup.md).
- Стенд **8095** поднят ([`deploy/python-async`](../../deploy/python-async/README.md)).
- venv с `httpx` ([`examples/requirements-lab.txt`](examples/requirements-lab.txt)).

```bash
curl -s http://localhost:8095/health
curl -s "http://localhost:8095/fail?rate=0.5"
```

---

## Задание 1. Dashboard через asyncio.gather

**Зачем:** параллельные независимые GET без TaskGroup.

`labs/06_dashboard_gather.py`:

```python
import asyncio
import time

import httpx

BASE = "http://localhost:8095"

async def fetch_path(client: httpx.AsyncClient, path: str) -> dict:
    r = await client.get(f"{BASE}{path}")
    r.raise_for_status()
    return r.json()

async def main():
    t0 = time.perf_counter()
    async with httpx.AsyncClient(timeout=30.0) as client:
        health, payload, slow = await asyncio.gather(
            fetch_path(client, "/health"),
            fetch_path(client, "/json?size=10"),
            fetch_path(client, "/slow?extra_ms=0"),
        )
    elapsed = time.perf_counter() - t0
    print(f"gather elapsed: {elapsed:.3f}s")
    print("health service:", health.get("service"))
    print("json items:", len(payload.get("items", [])))
    print("slow delay_ms:", slow.get("delay_ms"))

if __name__ == "__main__":
    asyncio.run(main())
```

**Что увидите:** elapsed ≈ **max** из задержек (~200–350 ms), не сумма.

---

## Задание 2. Тот же dashboard через TaskGroup

**Зачем:** structured concurrency, доступ к `.result()` после блока.

`labs/06_dashboard_taskgroup.py`:

```python
import asyncio
import time

import httpx

BASE = "http://localhost:8095"

async def fetch_path(client: httpx.AsyncClient, path: str) -> dict:
    r = await client.get(f"{BASE}{path}")
    r.raise_for_status()
    return r.json()

async def main():
    t0 = time.perf_counter()
    async with httpx.AsyncClient(timeout=30.0) as client:
        async with asyncio.TaskGroup() as tg:
            t_health = tg.create_task(fetch_path(client, "/health"))
            t_json = tg.create_task(fetch_path(client, "/json?size=10"))
            t_slow = tg.create_task(fetch_path(client, "/slow?extra_ms=50"))
    elapsed = time.perf_counter() - t0
    print(f"TaskGroup elapsed: {elapsed:.3f}s")
    print(t_health.result(), t_json.result()["items"][:3], t_slow.result()["delay_ms"])

if __name__ == "__main__":
    asyncio.run(main())
```

**Что увидите:** время сопоставимо с gather (~250–400 ms).

---

## Задание 3. create_task + staggered await

**Зачем:** schedule раньше, await позже.

```python
async def staggered(client: httpx.AsyncClient):
    t0 = time.perf_counter()
    tasks = [
        asyncio.create_task(fetch_path(client, "/slow?extra_ms=0")),
        asyncio.create_task(fetch_path(client, "/slow?extra_ms=100")),
        asyncio.create_task(fetch_path(client, "/slow?extra_ms=200")),
    ]
    # все три уже бегут
    await asyncio.sleep(0.05)
    results = [await t for t in tasks]
    print(f"staggered: {time.perf_counter() - t0:.3f}s")
    return results
```

Вызовите из `main()` внутри `async with httpx.AsyncClient`.

**Что увидите:** ~**300 ms** (max extra), не 300+ сумма.

---

## Задание 4. Retry на /fail

**Зачем:** partial failure — типичный production кейс.

```python
import random

async def fetch_with_retry(
    client: httpx.AsyncClient,
    path: str,
    attempts: int = 5,
) -> dict:
    last_exc = None
    for i in range(attempts):
        try:
            r = await client.get(f"{BASE}{path}")
            r.raise_for_status()
            return r.json()
        except httpx.HTTPStatusError as e:
            last_exc = e
            await asyncio.sleep(0.05 * (i + 1))
    raise last_exc

async def main():
    async with httpx.AsyncClient(timeout=30.0) as client:
        data = await fetch_with_retry(client, "/fail?rate=0.7")
        print("success:", data)
```

**Что увидите:** иногда success с первого раза; иногда после 2–3 retry; редко exception после 5 попыток.

---

## Задание 5. ExceptionGroup (опционально, 3.11+)

**Зачем:** поведение TaskGroup при ошибке.

```python
async def ok():
    return 1

async def boom():
    await asyncio.sleep(0.01)
    raise ValueError("fail")

async def demo_exception_group():
    try:
        async with asyncio.TaskGroup() as tg:
            tg.create_task(ok())
            tg.create_task(boom())
    except* ValueError as eg:
        print("caught:", eg.exceptions)
```

**Что увидите:** `ExceptionGroup` / `except*` ловит ошибку из child; sibling **ok** была отменена.

---

## Если не работает

| Симптом | Действие |
|---------|----------|
| gather/TaskGroup ~ sum delays | запросы идут **последовательно** — проверьте `await` внутри цикла |
| 503 всегда | `/fail?rate=0.3` — снизьте rate |
| TaskGroup AttributeError | Python < 3.11 — используйте только gather |
| httpx ConnectError | стенд не поднят |

---

## Критерии успеха

- [ ] gather dashboard быстрее sequential (~3×) из лабы 03
- [ ] TaskGroup даёт сопоставимое время
- [ ] staggered create_task — max delay, не sum
- [ ] retry на `/fail` иногда успешен
- [ ] Понимаете, когда TaskGroup отменяет siblings

---

## Уборка

Файлы `labs/06_*.py` сохраните. Ключи Redis/Postgres не используются.

---

## Вопросы для самопроверки

1. Почему в задании 1 elapsed ≈ max, а не sum?
2. Что произойдёт, если в TaskGroup одна task raise без `except*`?
3. Зачем retry с backoff на `/fail`?
4. Как gateway делает parallel aggregate? См. [18-lab-parallel-fetch](18-lab-parallel-fetch.md).

Следующий урок: [07. Cancellation и timeouts](07-cancellation-timeouts.md).
