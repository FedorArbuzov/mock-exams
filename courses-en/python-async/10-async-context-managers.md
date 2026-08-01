# 10. Async context managers

## Intro: "the httpx client leaked — an hour later, Too many open files"

A service created an **`httpx.AsyncClient()`** on **every** request in an `async def` handler without a `close()`. Under load the **FDs** ran out, and new connections got **EMFILE**. The correct pattern is **one client per lifespan** or **`async with AsyncClient()`** scoped to the request.

This chapter covers **`async with`**, **`@asynccontextmanager`**, **`__aenter__`/`__aexit__`**. Relation to the FastAPI lifespan — [`deploy/fastapi`](../../deploy/fastapi/README.md); mock gateway — [`app.py`](../../deploy/python-async/mock-server/app.py).

## What you'll learn

- The **async context manager** protocol.
- The **`contextlib.asynccontextmanager`** decorator.
- **Nested** async with and the cleanup order.
- The FastAPI **lifespan** as an application-level context.

---

## async with — the basic syntax

```python
import asyncio

class AsyncResource:
    async def __aenter__(self):
        print("acquire")
        return self

    async def __aexit__(self, exc_type, exc, tb):
        print("release", exc_type)
        return False  # don't suppress the exception

async def main():
    async with AsyncResource() as r:
        print("using", r)
        await asyncio.sleep(0.01)

asyncio.run(main())
```

| Method | When it's called |
|-------|------------------|
| `__aenter__` | entering `async with` |
| `__aexit__` | exiting (normal or exception) |
| return True from `__aexit__` | suppress the exception (careful) |

**Cleanup order:** LIFO with nested `async with` — like a sync `with`.

---

## asynccontextmanager

```python
from contextlib import asynccontextmanager
import asyncio

@asynccontextmanager
async def temporary_connection(host: str):
    print(f"connect {host}")
    conn = {"host": host, "open": True}
    try:
        yield conn
    finally:
        conn["open"] = False
        print(f"disconnect {host}")

async def main():
    async with temporary_connection("db") as c:
        assert c["open"]
        await asyncio.sleep(0.01)

asyncio.run(main())
```

**yield** separates setup and teardown. The code **after yield** in `finally` is guaranteed cleanup even on cancel ([07-cancellation-timeouts](07-cancellation-timeouts.md)).

---

## httpx.AsyncClient

```python
import httpx

async def fetch_many(urls: list[str]):
    async with httpx.AsyncClient(timeout=10.0, limits=httpx.Limits(max_connections=20)) as client:
        tasks = [client.get(u) for u in urls]
        # tasks are coroutines; you need await gather
        responses = await asyncio.gather(*[client.get(u) for u in urls])
    # client closed — connections released
    return responses
```

| Pattern | Scope |
|---------|-------|
| `async with AsyncClient()` per request | simple, more expensive on TCP |
| **One client in lifespan** | production default ([17](17-async-http-httpx.md)) |
| Global client without close | **leak** |

Mock gateway lifespan:

```python
@asynccontextmanager
async def lifespan(app: FastAPI):
    app.state.client = httpx.AsyncClient(timeout=30.0)
    yield
    await app.state.client.aclose()
```

---

## asyncio.Lock as a context manager

```python
lock = asyncio.Lock()

async def critical():
    async with lock:
        # exclusive section — others await lock.acquire()
        await asyncio.sleep(0.01)
```

See [13-primitives-locks](13-primitives-locks.md).

---

## Nested contexts

```python
async def nested():
    async with httpx.AsyncClient() as client:
        async with asyncio.timeout(5.0):
            r = await client.get("http://localhost:8095/slow?extra_ms=0")
            return r.json()
```

**Exit order:** timeout context → httpx client. On a cancel inside — the `__aexit__` methods are still called.

---

## FastAPI lifespan = app context

```python
from contextlib import asynccontextmanager
from fastapi import FastAPI

@asynccontextmanager
async def lifespan(app: FastAPI):
    app.state.pool = await create_pool()
    yield
    await app.state.pool.close()

app = FastAPI(lifespan=lifespan)
```

One **startup**, one **shutdown** — an analog of `async with` for the whole application. See [24-lifespan-background](../fastapi/24-lifespan-background.md).

---

## SQLAlchemy async session

```python
async with SessionLocal() as session:
    result = await session.execute(select(User).limit(10))
    await session.commit()
# session closed
```

Keep the session **short** ([27-async-patterns](../fastapi/27-async-patterns.md)); not one session for hours of a websocket.

---

## Common mistakes

| Mistake | Consequence | Solution |
|--------|-------------|---------|
| Forgot `async with` | FD leak | always a context manager |
| `with` instead of `async with` | TypeError / no await cleanup | the correct protocol |
| Suppress in `__aexit__` | hidden bugs | return False by default |
| Long work **before** yield in a generator | blocks setup | minimize in setup |
| Client per 1000 tasks without limits | connection storm | Limits + Semaphore |

---

## Summary

**Async context managers** guarantee **await cleanup** on exit, cancel or exception. **`httpx.AsyncClient`**, **DB session**, **locks** — via **`async with`**. Application-wide resources — the **FastAPI lifespan** or `@asynccontextmanager` at the `main()` level.

## Checklist

- What is called first on an exception inside `async with`?
- Why `finally` after `yield` in asynccontextmanager?
- Where does the mock gateway create the httpx client?
- Why is a global AsyncClient without aclose dangerous?

Next lesson: [11. Async generators and async for](11-async-generators.md).
