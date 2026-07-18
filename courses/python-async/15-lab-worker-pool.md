# 15. Лаба: worker pool

## Цель лабы

Построить **producer-consumer** pipeline: **50 jobs** → **Queue(maxsize=10)** → **5 workers** → HTTP POST/GET на gateway. Ограничить in-flight **Semaphore(8)**. Graceful shutdown с **sentinels**.

## Предварительно

- [13-primitives-locks](13-primitives-locks.md), [14-asyncio-queues](14-asyncio-queues.md).
- Стенд **8095**, httpx.

```bash
curl -s http://localhost:8095/hits
```

---

## Задание 1. Базовый worker pool

**Зачем:** bounded concurrency без 50 одновременных tasks.

`labs/15_worker_pool.py`:

```python
import asyncio
import time

import httpx

BASE = "http://localhost:8095"
NUM_JOBS = 50
NUM_WORKERS = 5
QUEUE_SIZE = 10
SEM = asyncio.Semaphore(8)

async def handle_job(client: httpx.AsyncClient, job_id: int) -> tuple[int, int]:
    async with SEM:
        extra = (job_id * 17) % 150
        r = await client.get(f"{BASE}/slow", params={"extra_ms": extra})
        r.raise_for_status()
        delay = r.json()["delay_ms"]
        return job_id, delay

async def worker(
    wid: int,
    client: httpx.AsyncClient,
    q: asyncio.Queue,
    results: list,
):
    while True:
        job_id = await q.get()
        if job_id is None:
            q.task_done()
            print(f"worker {wid} exit")
            break
        try:
            jid, delay = await handle_job(client, job_id)
            results.append((jid, delay))
            print(f"worker {wid} job {jid} delay={delay}")
        finally:
            q.task_done()

async def producer(q: asyncio.Queue):
    for job_id in range(NUM_JOBS):
        await q.put(job_id)
    print("producer done")

async def main():
    q: asyncio.Queue = asyncio.Queue(maxsize=QUEUE_SIZE)
    results: list = []
    t0 = time.perf_counter()

    async with httpx.AsyncClient(timeout=30.0) as client:
        workers = [
            asyncio.create_task(worker(i, client, q, results))
            for i in range(NUM_WORKERS)
        ]
        await producer(q)
        for _ in range(NUM_WORKERS):
            await q.put(None)
        await q.join()
        await asyncio.gather(*workers)

    elapsed = time.perf_counter() - t0
    print(f"completed {len(results)} jobs in {elapsed:.2f}s")
    print(f"avg delay reported: {sum(d for _, d in results)/len(results):.0f}ms")

if __name__ == "__main__":
    asyncio.run(main())
```

```bash
python labs/15_worker_pool.py
```

**Что увидите:** ~50 строк worker output, total time **существенно меньше** чем 50 × avg delay (parallelism), но **больше** чем один job.

---

## Задание 2. Сравнение с naive gather

**Зачем:** увидеть разницу без queue.

```python
async def naive_gather():
    async with httpx.AsyncClient(timeout=30) as client:
        t0 = time.perf_counter()
        await asyncio.gather(*(handle_job(client, i) for i in range(20)))
        print("naive 20 jobs:", time.perf_counter() - t0)
```

**Что увидите:** naive может быть **быстрее wall-clock** для 20 jobs (больше parallelism), но при **500** jobs — risk для upstream. Queue + workers — **контролируемый** throughput.

---

## Задание 3. Наблюдение backpressure

**Зачем:** maxsize=10 ограничивает producer.

Добавьте в producer:

```python
    for job_id in range(NUM_JOBS):
        await q.put(job_id)
        if job_id % 10 == 0:
            print(f"queue size ~{q.qsize()}")
```

**Что увидите:** `qsize` не превышает **maxsize** (10); producer блокируется на `put`.

---

## Задание 4. /hits counter

**Зачем:** убедиться, что jobs реально hit gateway.

```bash
curl -s http://localhost:8095/hits
# запустите pool
curl -s http://localhost:8095/hits
```

**Что увидите:** счётчик вырос на ~50 (может быть stateful per upstream в compose — смотрите gateway routing).

---

## Задание 5. Shutdown под нагрузкой

**Зачем:** Ctrl+C во время run — workers должны exit после sentinels (если успели enqueue). Для stress: уменьшите NUM_JOBS до 200, прервите — обсудите partial results.

---

## Если не работает

| Симптом | Действие |
|---------|----------|
| join hangs | забыли task_done или sentinel count |
| Semaphore не limit | handle_job вне sem |
| 502 на slow | дождаться healthy стенда |
| qsize always 0 | consumer быстрее — OK |

---

## Критерии успеха

- [ ] 50 jobs completed, len(results)==50
- [ ] 5 workers, каждый получил sentinel и exit
- [ ] Queue maxsize ограничивает producer
- [ ] Semaphore(8) — не более 8 concurrent handle_job
- [ ] Понимаете trade-off gather vs pool

---

## Уборка

Оставьте скрипт для capstone. Redis/Postgres не трогали.

---

## Вопросы для самопроверки

1. Зачем и Queue maxsize, и Semaphore?
2. Сколько tasks живёт одновременно в этом design?
3. Как масштабировать на несколько pods?
4. Связь с [`deploy/redis`](../../deploy/redis/README.md) для distributed queue?

Следующий урок: [16. Structured concurrency](16-structured-concurrency.md).
