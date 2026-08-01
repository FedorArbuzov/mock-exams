# 15. Lab: worker pool

## Lab goal

Build a **producer-consumer** pipeline: **50 jobs** → **Queue(maxsize=10)** → **5 workers** → HTTP POST/GET to the gateway. Limit in-flight with a **Semaphore(8)**. Graceful shutdown with **sentinels**.

## Prerequisites

- [13-primitives-locks](13-primitives-locks.md), [14-asyncio-queues](14-asyncio-queues.md).
- The **8095** stand, httpx.

```bash
curl -s http://localhost:8095/hits
```

---

## Task 1. A basic worker pool

**Why:** bounded concurrency without 50 concurrent tasks.

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

**What you'll see:** ~50 lines of worker output, total time **substantially less** than 50 × avg delay (parallelism), but **more** than a single job.

---

## Task 2. Comparison with a naive gather

**Why:** to see the difference without a queue.

```python
async def naive_gather():
    async with httpx.AsyncClient(timeout=30) as client:
        t0 = time.perf_counter()
        await asyncio.gather(*(handle_job(client, i) for i in range(20)))
        print("naive 20 jobs:", time.perf_counter() - t0)
```

**What you'll see:** naive may be **faster in wall-clock** for 20 jobs (more parallelism), but with **500** jobs it's a risk for the upstream. Queue + workers — **controlled** throughput.

---

## Task 3. Observing backpressure

**Why:** maxsize=10 limits the producer.

Add to the producer:

```python
    for job_id in range(NUM_JOBS):
        await q.put(job_id)
        if job_id % 10 == 0:
            print(f"queue size ~{q.qsize()}")
```

**What you'll see:** `qsize` doesn't exceed **maxsize** (10); the producer blocks on `put`.

---

## Task 4. The /hits counter

**Why:** to confirm the jobs actually hit the gateway.

```bash
curl -s http://localhost:8095/hits
# run the pool
curl -s http://localhost:8095/hits
```

**What you'll see:** the counter grew by ~50 (it may be stateful per upstream in compose — check the gateway routing).

---

## Task 5. Shutdown under load

**Why:** Ctrl+C during the run — the workers should exit after the sentinels (if they managed to enqueue). For stress: reduce NUM_JOBS to 200, interrupt — discuss the partial results.

---

## If it doesn't work

| Symptom | Action |
|---------|----------|
| join hangs | forgot task_done or the sentinel count |
| Semaphore doesn't limit | handle_job outside the sem |
| 502 on slow | wait for a healthy stand |
| qsize always 0 | the consumer is faster — OK |

---

## Success criteria

- [ ] 50 jobs completed, len(results)==50
- [ ] 5 workers, each got a sentinel and exited
- [ ] Queue maxsize limits the producer
- [ ] Semaphore(8) — no more than 8 concurrent handle_job
- [ ] You understand the gather vs pool trade-off

---

## Cleanup

Keep the script for the capstone. Redis/Postgres were not touched.

---

## Self-check questions

1. Why both a Queue maxsize and a Semaphore?
2. How many tasks are alive at once in this design?
3. How to scale to multiple pods?
4. Relation to [`deploy/redis`](../../deploy/redis/README.md) for a distributed queue?

Next lesson: [16. Structured concurrency](16-structured-concurrency.md).
