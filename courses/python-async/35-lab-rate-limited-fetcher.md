# 35. Лаба: rate-limited fetcher

## Цель лабы

Построить fetcher URL с **`asyncio.Semaphore`**, **retry с backoff**, **timeout** и отчётом метрик. Источник URL — mock gateway **8095** и статический список paths.

## Предварительно

- [32-backpressure-semaphores](32-backpressure-semaphores.md), [17-async-http-httpx](17-async-http-httpx.md).
- Стенд [`deploy/python-async`](../../deploy/python-async/README.md).
- `pip install httpx`

```bash
cd deploy/python-async && docker compose up -d
```

Эталон: [`examples/fetch_parallel.py`](examples/fetch_parallel.py).

---

## Задание 1. Список targets

```python
PATHS = [
    "/health",
    "/json?size=5",
    "/json?size=10",
    "/slow?extra_ms=0",
    "/slow?extra_ms=50",
    "/slow?extra_ms=100",
    "/fail?rate=0.3",
] * 3  # 21 request
BASE = "http://localhost:8095"
CONCURRENCY = 5
```

---

## Задание 2. Fetch с semaphore + timeout

`labs/35_fetcher.py`:

```python
import asyncio
import time
from dataclasses import dataclass

import httpx

@dataclass
class FetchResult:
    url: str
    status: int | None
    latency_ms: float
    error: str | None = None

async def fetch_one(
    sem: asyncio.Semaphore,
    client: httpx.AsyncClient,
    path: str,
    attempts: int = 3,
) -> FetchResult:
    url = f"{BASE}{path}"
    async with sem:
        last_err = None
        for i in range(attempts):
            t0 = time.perf_counter()
            try:
                async with asyncio.timeout(10.0):
                    r = await client.get(url)
                latency = (time.perf_counter() - t0) * 1000
                if r.status_code >= 500:
                    last_err = f"HTTP {r.status_code}"
                    await asyncio.sleep(0.05 * (2 ** i))
                    continue
                return FetchResult(url, r.status_code, latency)
            except (TimeoutError, httpx.HTTPError) as e:
                last_err = str(e)
                await asyncio.sleep(0.05 * (2 ** i))
        return FetchResult(url, None, 0.0, last_err)
```

---

## Задание 3. Parallel run + summary

```python
async def run_fetcher(paths: list[str]) -> list[FetchResult]:
    sem = asyncio.Semaphore(CONCURRENCY)
    async with httpx.AsyncClient(timeout=30.0) as client:
        return await asyncio.gather(*[
            fetch_one(sem, client, p) for p in paths
        ])

def summarize(results: list[FetchResult]) -> None:
    ok = [r for r in results if r.error is None]
    fail = [r for r in results if r.error]
    latencies = [r.latency_ms for r in ok]
    print(f"ok={len(ok)} fail={len(fail)}")
    if latencies:
        print(f"latency ms: min={min(latencies):.0f} p50={sorted(latencies)[len(latencies)//2]:.0f} max={max(latencies):.0f}")

async def main():
    t0 = time.perf_counter()
    results = await run_fetcher(PATHS)
    summarize(results)
    print(f"wall-clock: {(time.perf_counter()-t0)*1000:.0f}ms")

if __name__ == "__main__":
    asyncio.run(main())
```

**Запуск:** `python labs/35_fetcher.py`

**Что увидите:** `ok` ≈ 18–21 (fail random на `/fail`); wall-clock **меньше** суммы всех slow, больше чем один slow — из-за sem=5.

---

## Задание 4. Сравнение concurrency 1 vs 10

```python
async def benchmark_concurrency():
    for n in (1, 5, 10):
        global CONCURRENCY
        CONCURRENCY = n
        t0 = time.perf_counter()
        await run_fetcher(PATHS[:9])
        print(f"concurrency={n} elapsed={(time.perf_counter()-t0)*1000:.0f}ms")
```

**Что увидите:** рост n уменьшает elapsed до плато (upstream/latency bound).

---

## Задание 5. Запись в Postgres (опционально)

Подключите insert из [20-lab-async-database](20-lab-async-database.md) — одна строка на `FetchResult` в `fetch_log`.

---

## Задание 6. Тест semaphore

```python
@pytest.mark.asyncio
async def test_semaphore_limits_parallelism():
    max_active = 0
    active = 0
    sem = asyncio.Semaphore(2)
    lock = asyncio.Lock()

    async def worker():
        nonlocal active, max_active
        async with sem:
            async with lock:
                active += 1
                max_active = max(max_active, active)
            await asyncio.sleep(0.05)
            async with lock:
                active -= 1

    await asyncio.gather(*[worker() for _ in range(6)])
    assert max_active <= 2
```

---

## Если не работает

| Симптом | Действие |
|---------|----------|
| Все fail | gateway down; `curl localhost:8095/health` |
| elapsed ≈ sum | semaphore не используется в fetch_one |
| Много TimeoutError | увеличьте timeout или снизьте CONCURRENCY |
| 21 fail на /fail | ожидаемо часть fail; retry должен помочь |

---

## Критерии успеха

- [ ] Semaphore ограничивает in-flight (тест или логи)
- [ ] Retry спасает часть `/fail` запросов
- [ ] Summary выводит ok/fail и latency stats
- [ ] concurrency 10 быстрее 1 на 9 slow paths
- [ ] Понимаете связь с gateway `/aggregate-parallel`

---

## Уборка

Сохраните скрипт для capstone.

---

## Вопросы для самопроверки

1. Почему semaphore внутри retry loop занимает слот дольше?
2. Как бы вы добавили global rate limit между процессами?
3. Что изменится при 10 000 URL?
4. Какие части войдут в [36-capstone](36-capstone.md)?

Следующий урок: [36. Capstone](36-capstone.md).
