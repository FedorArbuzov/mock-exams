# 31. FastAPI bridge: asyncio in ASGI

## Intro: “I understand asyncio, but not where it lives in FastAPI”

You’ve covered the event loop, httpx, asyncpg, Redis. **FastAPI** is a thin layer: **Starlette** runs your coroutine as an **ASGI** task, **Depends** injects async sessions, **lifespan** starts pools. This chapter is a map between pure asyncio and [`deploy/fastapi`](../../deploy/fastapi/README.md).

Deeper in the FastAPI course: [27-async-patterns](../fastapi/27-async-patterns.md). Capstone ties it together — [36-capstone](36-capstone.md).

## What you'll learn

- How a **request** becomes a **Task** on the event loop.
- **`async def` vs `def`** endpoints.
- **lifespan**, **Depends**, background tasks.
- Typical startup/shutdown sequence.

---

## ASGI → coroutine

```mermaid
sequenceDiagram
  participant U as Uvicorn
  participant S as Starlette
  participant F as FastAPI route
  participant DB as asyncpg pool
  U->>S: HTTP request
  S->>F: await endpoint()
  F->>DB: await session.execute
  DB-->>F: rows
  F-->>S: JSONResponse
  S-->>U: ASGI send
```

One **worker process** = one loop serving **many** concurrent requests — as long as they **await**.

---

## async def vs def

```python
from fastapi import FastAPI
import time

app = FastAPI()

@app.get("/async-ok")
async def async_ok():
    await asyncio.sleep(0.01)
    return {"mode": "async"}

@app.get("/sync-blocking")
def sync_blocking():
    time.sleep(0.5)  # blocks the loop in an async worker!
    return {"mode": "bad"}

@app.get("/sync-threadpool")
def sync_in_thread():
    time.sleep(0.5)  # Starlette run_in_threadpool — loop stays free
    return {"mode": "threadpool"}
```

| Handler type | Behavior |
|--------------|----------|
| `async def` | coroutine on the loop |
| `def` | **threadpool** by default (does not block the loop) |
| `async def` + sync blocking | **blocks the loop** — worst case |

**Rule:** either **fully async** inside `async def`, or plain **`def`** for sync.

---

## Lifespan: pools and clients

```python
from contextlib import asynccontextmanager
from fastapi import FastAPI
from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker
import redis.asyncio as redis


engine = create_async_engine(
    "postgresql+asyncpg://course:course@localhost:5432/course",
    pool_size=5,
)
SessionLocal = async_sessionmaker(engine, expire_on_commit=False)

@asynccontextmanager
async def lifespan(app: FastAPI):
    app.state.redis = redis.from_url("redis://localhost:6379/0", decode_responses=True)
    yield
    await app.state.redis.aclose()
    await engine.dispose()

app = FastAPI(lifespan=lifespan)
```

The analogue of your lab [08-lab-graceful-shutdown](08-lab-graceful-shutdown.md) at the framework level.

---

## Depends + async session

```python
from fastapi import Depends
from sqlalchemy.ext.asyncio import AsyncSession

async def get_db() -> AsyncSession:
    async with SessionLocal() as session:
        yield session

@app.get("/users/count")
async def users_count(db: AsyncSession = Depends(get_db)):
    result = await db.execute(text("SELECT COUNT(*) FROM users"))
    return {"count": result.scalar_one()}
```

`yield` in Depends — closes the session **after the response** (unless an error earlier).

---

## httpx in the app

```python
@app.get("/proxy-health")
async def proxy_health(request: Request):
    client: httpx.AsyncClient = request.app.state.http
    r = await client.get("http://gateway:8095/health")
    return r.json()
```

Create `httpx.AsyncClient` in **lifespan**, not per request ([17-async-http-httpx](17-async-http-httpx.md)).

---

## Background tasks

```python
from fastapi import BackgroundTasks

async def write_audit_log(msg: str):
    await asyncio.sleep(0.01)
    print("audit:", msg)

@app.post("/order")
async def create_order(bg: BackgroundTasks):
    bg.add_task(write_audit_log, "order created")
    return {"status": "accepted"}
```

**Limitation:** `BackgroundTasks` run after the response — on **SIGKILL** of the pod you lose the task. Critical work belongs in a **queue** (Celery/Kafka).

---

## Relation to deploy/fastapi

```bash
cd deploy/fastapi
docker compose up -d
curl http://localhost:8090/health
```

Stack: API + Postgres from [`deploy/postgres`](../../deploy/postgres/README.md). Compare with the teaching gateway **8095** — HTTP fan-out only, no DB.

---

## Common mistakes in FastAPI async

| Mistake | Fix |
|---------|-----|
| `requests` in `async def` | httpx AsyncClient |
| Session for the whole request + outbound HTTP | short DB scope |
| Global sync Redis | redis.asyncio in lifespan |
| `create_task` without await on shutdown | lifespan cancel + gather |
| 1 worker, CPU 100% | more workers ([30-uvloop-production](30-uvloop-production.md)) |

---

## Summary

**FastAPI** does not replace asyncio — it **schedules** your coroutines in ASGI. **lifespan** = startup/shutdown pools; **Depends** = injection; **`def`** endpoints = threadpool escape hatch. Loop knowledge from this course explains the recommendations in [27-async-patterns](../fastapi/27-async-patterns.md).

## Checklist

- Why is `time.sleep` dangerous in an `async def` endpoint?
- Where should you create httpx.AsyncClient?
- What does `yield` do in async Depends?
- When are BackgroundTasks not enough?

Next lesson: [32. Backpressure and Semaphore](32-backpressure-semaphores.md).
