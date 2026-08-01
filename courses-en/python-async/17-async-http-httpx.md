# 17. Async HTTP with httpx

## Intro: "requests in an async endpoint — p99 of 30 seconds"

An integration with legacy billing via **`requests.get`** inside **`async def invoice()`**. Under 50 RPS the event loop was **blocked** — healthcheck fail, Kubernetes **restart loop**. Replacing it with **`httpx.AsyncClient`** + a shared client in the **lifespan** — and p99 returned to normal.

This chapter covers the **httpx API**, **timeouts**, **limits**, **retries**, **connection pooling**. Practice — [18-lab-parallel-fetch](18-lab-parallel-fetch.md); FastAPI anti-patterns — [27-async-patterns](../fastapi/27-async-patterns.md); mock gateway — [`deploy/python-async`](../../deploy/python-async/README.md).

## What you'll learn

- The **`AsyncClient`** lifecycle and **connection pool**.
- **Timeout** layers: connect, read, write, pool.
- **Limits** and a **Semaphore** together.
- **Error handling** and retry policies.

---

## Minimal AsyncClient

```python
import asyncio
import httpx

BASE = "http://localhost:8095"

async def main():
    async with httpx.AsyncClient(base_url=BASE, timeout=10.0) as client:
        r = await client.get("/health")
        r.raise_for_status()
        print(r.json())

asyncio.run(main())
```

| vs requests | httpx async |
|-------------|-------------|
| blocking socket | await non-blocking |
| sync only | sync **and** async API |
| no HTTP/2 optional | HTTP/2 opt-in |

**Never** use `requests` in a hot `async def` path.

---

## Timeouts (defense in depth)

```python
timeout = httpx.Timeout(
    connect=2.0,
    read=5.0,
    write=5.0,
    pool=2.0,
)

async with httpx.AsyncClient(timeout=timeout) as client:
    r = await client.get(f"{BASE}/slow?extra_ms=3000")
```

Combine with **`asyncio.timeout`** ([07-cancellation-timeouts](07-cancellation-timeouts.md)) for a business deadline.

```python
async with asyncio.timeout(1.0):
    r = await client.get("/slow?extra_ms=5000")
```

---

## Limits — the connection pool

```python
limits = httpx.Limits(
    max_connections=20,
    max_keepalive_connections=10,
    keepalive_expiry=30.0,
)

async with httpx.AsyncClient(limits=limits) as client:
    ...
```

| Parameter | Meaning |
|----------|--------|
| max_connections | total TCP (host) |
| max_keepalive_connections | reuse pool |
| keepalive_expiry | close idle |

**+ Semaphore** to limit the **logical** parallel requests ([13-primitives-locks](13-primitives-locks.md)).

---

## Shared client in the lifespan (production)

```python
from contextlib import asynccontextmanager
from fastapi import FastAPI
import httpx

@asynccontextmanager
async def lifespan(app: FastAPI):
    app.state.http = httpx.AsyncClient(
        timeout=httpx.Timeout(10.0),
        limits=httpx.Limits(max_connections=50),
    )
    yield
    await app.state.http.aclose()

app = FastAPI(lifespan=lifespan)

@app.get("/proxy")
async def proxy():
    r = await app.state.http.get("http://localhost:8095/health")
    return r.json()
```

The mock gateway uses the same pattern ([`app.py`](../../deploy/python-async/mock-server/app.py)).

---

## Parallel fetch pattern

```python
async def fetch_all(client: httpx.AsyncClient, paths: list[str]):
    async def one(path: str):
        r = await client.get(path)
        r.raise_for_status()
        return r.json()

    return await asyncio.gather(*(one(p) for p in paths))
```

Gateway `/aggregate-parallel`:

```python
results = await asyncio.gather(*(fetch(u) for u in urls))
```

The [18](18-lab-parallel-fetch.md) lab reproduces this with time measurement.

---

## Retries and /fail

```python
import httpx

async def get_with_retry(client: httpx.AsyncClient, url: str, attempts: int = 3):
    for i in range(attempts):
        try:
            r = await client.get(url)
            r.raise_for_status()
            return r.json()
        except httpx.HTTPStatusError as e:
            if e.response.status_code not in (503, 429) or i == attempts - 1:
                raise
            await asyncio.sleep(0.1 * (2 ** i))
```

Stand: `/fail?rate=0.5` — practice ([06-lab-concurrent-io](06-lab-concurrent-io.md)).

---

## Streaming responses

```python
async with httpx.AsyncClient() as client:
    async with client.stream("GET", f"{BASE}/json?size=100") as response:
        response.raise_for_status()
        async for chunk in response.aiter_bytes():
            ...  # process chunk
```

For large payloads — not `.content` all at once ([11-async-generators](11-async-generators.md)).

---

## HTTP/2 (optional)

```python
async with httpx.AsyncClient(http2=True) as client:
    ...
```

Requires `pip install httpx[http2]`. For the mock stand HTTP/1.1 is enough.

---

## Common mistakes

| Mistake | Consequence | Solution |
|--------|-------------|---------|
| New client per request | TCP handshake storm | lifespan singleton |
| timeout=None default hang | stuck forever | explicit Timeout |
| read entire 500MB body | OOM | stream |
| No raise_for_status | silent 503 | check status |
| gather without a bound on 10k URLs | FD exhaustion | Semaphore + Queue |

---

## Summary

**httpx.AsyncClient** is the standard for async HTTP in the Python ecosystem. **One client per app**, explicit **Timeout** and **Limits**, parallelism via **gather/TaskGroup**. Retries — deliberately, on idempotent GETs. Streaming — for large bodies.

## Checklist

- Why does requests block the event loop?
- What does `await client.aclose()` close?
- The difference between an httpx timeout and asyncio.timeout?
- How does the gateway do a sequential vs parallel aggregate?

Next lesson: [18. Lab: parallel fetch](18-lab-parallel-fetch.md).
