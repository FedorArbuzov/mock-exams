# 31. FastAPI bridge: asyncio в ASGI

## Введение: «понимаю asyncio, но не понимаю, где это в FastAPI»

Вы прошли event loop, httpx, asyncpg, Redis. **FastAPI** — тонкий слой: **Starlette** вызывает вашу корутину как **ASGI** task, **Depends** инжектит async сессии, **lifespan** стартует pools. Эта глава — карта соответствий между чистым asyncio и [`deploy/fastapi`](../../deploy/fastapi/README.md).

Углублённо в курсе FastAPI: [27-async-patterns](../fastapi/27-async-patterns.md). Capstone собирает всё вместе — [36-capstone](36-capstone.md).

## Что вы узнаете

- Как **request** становится **Task** на event loop.
- **`async def` vs `def`** endpoints.
- **lifespan**, **Depends**, background tasks.
- Типичная startup/shutdown последовательность.

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

Один **worker process** = один loop обслуживает **много** concurrent requests — пока они **await**.

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
    time.sleep(0.5)  # блокирует loop в async worker!
    return {"mode": "bad"}

@app.get("/sync-threadpool")
def sync_in_thread():
    time.sleep(0.5)  # Starlette run_in_threadpool — loop свободен
    return {"mode": "threadpool"}
```

| Тип handler | Поведение |
|-------------|-----------|
| `async def` | корутина на loop |
| `def` | **threadpool** по умолчанию (не блокирует loop) |
| `async def` + sync blocking | **блокирует loop** — худший вариант |

**Правило:** либо **полностью async** внутри `async def`, либо обычный **`def`** для sync.

---

## Lifespan: pools и clients

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

Аналог вашей лабы [08-lab-graceful-shutdown](08-lab-graceful-shutdown.md) на уровне framework.

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

`yield` в Depends — **after response** закрывает сессию (если не ошибка раньше).

---

## httpx в приложении

```python
@app.get("/proxy-health")
async def proxy_health(request: Request):
    client: httpx.AsyncClient = request.app.state.http
    r = await client.get("http://gateway:8095/health")
    return r.json()
```

Создайте `httpx.AsyncClient` в **lifespan**, не на каждый request ([17-async-http-httpx](17-async-http-httpx.md)).

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

**Ограничение:** `BackgroundTasks` после response — при **SIGKILL** pod потеряете task. Критичное — **queue** (Celery/Kafka).

---

## Связь с deploy/fastapi

```bash
cd deploy/fastapi
docker compose up -d
curl http://localhost:8090/health
```

Стек: API + Postgres из [`deploy/postgres`](../../deploy/postgres/README.md). Сравните с учебным gateway **8095** — там только HTTP fan-out без БД.

---

## Типичные ошибки в FastAPI async

| Ошибка | Fix |
|--------|-----|
| `requests` в `async def` | httpx AsyncClient |
| Session на весь request + внешний HTTP | короткий DB scope |
| Global sync Redis | redis.asyncio в lifespan |
| `create_task` без await при shutdown | lifespan cancel + gather |
| 1 worker, CPU 100% | больше workers ([30-uvloop-production](30-uvloop-production.md)) |

---

## Резюме

**FastAPI** не заменяет asyncio — он **планирует** ваши корутины в ASGI. **lifespan** = startup/shutdown pools; **Depends** = injection; **`def`** endpoints = threadpool escape hatch. Знание loop из этого курса объясняет рекомендации [27-async-patterns](../fastapi/27-async-patterns.md).

## Чек-лист

- Чем опасен `time.sleep` в `async def` endpoint?
- Где создавать httpx.AsyncClient?
- Что делает `yield` в async Depends?
- Когда BackgroundTasks недостаточно?

Следующий урок: [32. Backpressure и Semaphore](32-backpressure-semaphores.md).
