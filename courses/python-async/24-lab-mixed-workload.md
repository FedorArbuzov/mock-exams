# 24. Лаба: mixed CPU + I/O workload

## Цель лабы

Собрать pipeline: **parallel HTTP** (8095) + **CPU hash** в ProcessPool + **запись** в Postgres. Сравнить три варианта: CPU в loop (плохо), `to_thread`, `ProcessPoolExecutor`.

## Предварительно

- [23-executors-blocking](23-executors-blocking.md), [18-lab-parallel-fetch](18-lab-parallel-fetch.md).
- Стенды: **8095**, [`deploy/postgres`](../../deploy/postgres/README.md).
- `pip install httpx sqlalchemy asyncpg`

```bash
cd deploy/python-async && docker compose up -d
cd deploy/postgres && docker compose up -d
```

---

## Задание 1. CPU worker

```python
import hashlib

def compute_digest(payload: bytes, rounds: int = 50_000) -> str:
    h = hashlib.sha256()
    for i in range(rounds):
        h.update(payload)
        h.update(str(i).encode())
    return h.hexdigest()
```

---

## Задание 2. Fetch + process pipeline

`labs/24_mixed.py`:

```python
import asyncio
import time
from concurrent.futures import ProcessPoolExecutor

import httpx
from sqlalchemy import text
from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker

BASE = "http://localhost:8095"
DATABASE_URL = "postgresql+asyncpg://course:course@localhost:5432/course"

engine = create_async_engine(DATABASE_URL, pool_size=5)
SessionLocal = async_sessionmaker(engine, expire_on_commit=False)

PATHS = ["/json?size=20", "/json?size=30", "/slow?extra_ms=0"]

async def fetch_one(client: httpx.AsyncClient, path: str) -> bytes:
    r = await client.get(f"{BASE}{path}")
    r.raise_for_status()
    return r.content

async def save_digest(digest: str, path: str) -> None:
    async with SessionLocal() as session:
        await session.execute(
            text("INSERT INTO fetch_log (url, status_code, latency_ms) VALUES (:u, 200, 0)"),
            {"u": f"digest:{path}:{digest[:8]}"},
        )
        await session.commit()
```

---

## Задание 3. Вариант A — CPU в loop (антипаттерн)

```python
async def pipeline_blocking_cpu(client: httpx.AsyncClient) -> float:
    t0 = time.perf_counter()
    for path in PATHS:
        data = await fetch_one(client, path)
        digest = compute_digest(data)  # блокирует loop!
        await save_digest(digest, path)
    return time.perf_counter() - t0
```

Запустите и замерьте. Параллельный health-check во время pipeline **задержится**.

---

## Задание 4. Вариант B — asyncio.to_thread

```python
async def pipeline_thread(client: httpx.AsyncClient) -> float:
    t0 = time.perf_counter()
    for path in PATHS:
        data = await fetch_one(client, path)
        digest = await asyncio.to_thread(compute_digest, data)
        await save_digest(digest, path)
    return time.perf_counter() - t0
```

**Что увидите:** HTTP concurrent с фоновым probe; CPU offload не freeze loop.

---

## Задание 5. Вариант C — ProcessPool + gather

```python
async def pipeline_process(client: httpx.AsyncClient) -> float:
    t0 = time.perf_counter()
    async with httpx.AsyncClient(timeout=30.0) as c:
        payloads = await asyncio.gather(*[fetch_one(c, p) for p in PATHS])

    loop = asyncio.get_running_loop()
    with ProcessPoolExecutor(max_workers=2) as pool:
        digests = await asyncio.gather(*[
            loop.run_in_executor(pool, compute_digest, p) for p in payloads
        ])

    await asyncio.gather(*[
        save_digest(d, p) for d, p in zip(digests, PATHS)
    ])
    return time.perf_counter() - t0
```

**Что увидите:** fetch фаза ≈ max latency; CPU фаза параллельна на 2 workers.

---

## Задание 6. Probe: loop responsiveness

```python
async def probe_loop(client: httpx.AsyncClient, stop: asyncio.Event):
    while not stop.is_set():
        t0 = time.perf_counter()
        await client.get(f"{BASE}/health")
        print(f"probe latency: {(time.perf_counter()-t0)*1000:.0f}ms")
        await asyncio.sleep(0.2)

async def compare():
    stop = asyncio.Event()
    async with httpx.AsyncClient(timeout=30.0) as client:
        probe = asyncio.create_task(probe_loop(client, stop))
        print("blocking:", await pipeline_blocking_cpu(client))
        stop.set()
        await probe

if __name__ == "__main__":
    asyncio.run(compare())
```

**Что увидите:** при blocking CPU probe скачет до **сотен ms**; при to_thread — стабильно низкий.

---

## Если не работает

| Симптом | Действие |
|---------|----------|
| ProcessPool pickle error | `if __name__ == "__main__"` guard |
| Windows spawn slow | уменьшите `rounds` в compute_digest |
| Postgres connection error | лаба 20 schema |
| 8095 down | deploy/python-async smoke |

---

## Критерии успеха

- [ ] Три варианта замерены (время выведено)
- [ ] Probe показывает freeze на blocking CPU
- [ ] ProcessPool быстрее sequential CPU на 3 payload
- [ ] Digests записаны в fetch_log
- [ ] Понимаете trade-off thread vs process

---

## Уборка

Оставьте стенды для следующих лаб.

---

## Вопросы для самопроверки

1. Почему gather fetch перед process pool быстрее цикла for?
2. Сколько process workers оптимально на 4-core laptop?
3. Когда to_thread достаточно вместо ProcessPool?
4. Как это переносится в FastAPI? [31-fastapi-bridge](31-fastapi-bridge.md)

Следующий урок: [25. Subprocess и файлы](25-subprocess-files.md).
