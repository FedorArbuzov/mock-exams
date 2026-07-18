# 10. Async context managers

## Введение: «httpx client утёк — через час Too many open files»

Сервис создавал **`httpx.AsyncClient()`** на **каждый** request в `async def` handler без `close()`. Под нагрузкой **FD** исчерпались, новые соединения — **EMFILE**. Правильный паттерн — **один client на lifespan** или **`async with AsyncClient()`** на scope запроса.

Эта глава — **`async with`**, **`@asynccontextmanager`**, **`__aenter__`/`__aexit__`**. Связь с FastAPI lifespan — [`deploy/fastapi`](../../deploy/fastapi/README.md); mock gateway — [`app.py`](../../deploy/python-async/mock-server/app.py).

## Что вы узнаете

- Протокол **async context manager**.
- **`contextlib.asynccontextmanager`** decorator.
- **Nested** async with и порядок cleanup.
- **Lifespan** FastAPI как application-level context.

---

## async with — базовый синтаксис

```python
import asyncio

class AsyncResource:
    async def __aenter__(self):
        print("acquire")
        return self

    async def __aexit__(self, exc_type, exc, tb):
        print("release", exc_type)
        return False  # не suppress exception

async def main():
    async with AsyncResource() as r:
        print("using", r)
        await asyncio.sleep(0.01)

asyncio.run(main())
```

| Метод | Когда вызывается |
|-------|------------------|
| `__aenter__` | вход в `async with` |
| `__aexit__` | выход (normal или exception) |
| return True из `__aexit__` | suppress exception (осторожно) |

**Порядок cleanup:** LIFO при вложенных `async with` — как sync `with`.

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

**yield** разделяет setup и teardown. Код **после yield** в `finally` — guaranteed cleanup даже при cancel ([07-cancellation-timeouts](07-cancellation-timeouts.md)).

---

## httpx.AsyncClient

```python
import httpx

async def fetch_many(urls: list[str]):
    async with httpx.AsyncClient(timeout=10.0, limits=httpx.Limits(max_connections=20)) as client:
        tasks = [client.get(u) for u in urls]
        # tasks — coroutines; нужен await gather
        responses = await asyncio.gather(*[client.get(u) for u in urls])
    # client closed — connections released
    return responses
```

| Паттерн | Scope |
|---------|-------|
| `async with AsyncClient()` per request | простой, дороже по TCP |
| **One client in lifespan** | production default ([17](17-async-http-httpx.md)) |
| Global client без close | **утечка** |

Mock gateway lifespan:

```python
@asynccontextmanager
async def lifespan(app: FastAPI):
    app.state.client = httpx.AsyncClient(timeout=30.0)
    yield
    await app.state.client.aclose()
```

---

## asyncio.Lock as context manager

```python
lock = asyncio.Lock()

async def critical():
    async with lock:
        # exclusive section — другие await lock.acquire()
        await asyncio.sleep(0.01)
```

См. [13-primitives-locks](13-primitives-locks.md).

---

## Nested contexts

```python
async def nested():
    async with httpx.AsyncClient() as client:
        async with asyncio.timeout(5.0):
            r = await client.get("http://localhost:8095/slow?extra_ms=0")
            return r.json()
```

**Exit order:** timeout context → httpx client. Cancel внутри — `__aexit__` всё равно вызываются.

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

Один раз **startup**, один раз **shutdown** — аналог `async with` для всего приложения. См. [24-lifespan-background](../fastapi/24-lifespan-background.md).

---

## SQLAlchemy async session

```python
async with SessionLocal() as session:
    result = await session.execute(select(User).limit(10))
    await session.commit()
# session closed
```

Держите session **коротко** ([27-async-patterns](../fastapi/27-async-patterns.md)); не один session на websocket-часы.

---

## Типичные ошибки

| Ошибка | Последствие | Решение |
|--------|-------------|---------|
| Забыли `async with` | leak FD | always context manager |
| `with` вместо `async with` | TypeError / no await cleanup | правильный протокол |
| Suppress в `__aexit__` | скрытые баги | return False default |
| Long work **до** yield в generator | блок setup | минимум в setup |
| Client per 1000 tasks без limits | connection storm | Limits + Semaphore |

---

## Резюме

**Async context managers** гарантируют **await cleanup** при exit, cancel или exception. **`httpx.AsyncClient`**, **DB session**, **locks** — через **`async with`**. Application-wide resources — **FastAPI lifespan** или `@asynccontextmanager` на уровне `main()`.

## Чек-лист

- Что вызывается первым при exception внутри `async with`?
- Зачем `finally` после `yield` в asynccontextmanager?
- Где mock gateway создаёт httpx client?
- Почему global AsyncClient без aclose опасен?

Следующий урок: [11. Async generators и async for](11-async-generators.md).
