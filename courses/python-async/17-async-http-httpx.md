# 17. Async HTTP с httpx

## Введение: «requests в async endpoint — p99 30 секунд»

Интеграция с legacy billing через **`requests.get`** внутри **`async def invoice()`**. Под 50 RPS event loop **blocked** — healthcheck fail, Kubernetes **restart loop**. Замена на **`httpx.AsyncClient`** + shared client в **lifespan** — p99 вернулся к норме.

Эта глава — **httpx API**, **timeouts**, **limits**, **retries**, **connection pooling**. Практика — [18-lab-parallel-fetch](18-lab-parallel-fetch.md); FastAPI anti-patterns — [27-async-patterns](../fastapi/27-async-patterns.md); mock gateway — [`deploy/python-async`](../../deploy/python-async/README.md).

## Что вы узнаете

- **`AsyncClient`** lifecycle и **connection pool**.
- **Timeout** layers: connect, read, write, pool.
- **Limits** и **Semaphore** together.
- **Error handling** и retry policies.

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
| sync only | sync **и** async API |
| no HTTP/2 optional | HTTP/2 opt-in |

**Никогда** `requests` в hot `async def` path.

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

Комбинируйте с **`asyncio.timeout`** ([07-cancellation-timeouts](07-cancellation-timeouts.md)) для business deadline.

```python
async with asyncio.timeout(1.0):
    r = await client.get("/slow?extra_ms=5000")
```

---

## Limits — connection pool

```python
limits = httpx.Limits(
    max_connections=20,
    max_keepalive_connections=10,
    keepalive_expiry=30.0,
)

async with httpx.AsyncClient(limits=limits) as client:
    ...
```

| Параметр | Смысл |
|----------|--------|
| max_connections | total TCP (host) |
| max_keepalive_connections | reuse pool |
| keepalive_expiry | close idle |

**+ Semaphore** для limit **logical** parallel requests ([13-primitives-locks](13-primitives-locks.md)).

---

## Shared client in lifespan (production)

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

Mock gateway использует тот же паттерн ([`app.py`](../../deploy/python-async/mock-server/app.py)).

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

Лаба [18](18-lab-parallel-fetch.md) воспроизводит это с замером времени.

---

## Retries и /fail

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

Стенд: `/fail?rate=0.5` — тренировка ([06-lab-concurrent-io](06-lab-concurrent-io.md)).

---

## Streaming responses

```python
async with httpx.AsyncClient() as client:
    async with client.stream("GET", f"{BASE}/json?size=100") as response:
        response.raise_for_status()
        async for chunk in response.aiter_bytes():
            ...  # process chunk
```

Для large payloads — не `.content` целиком ([11-async-generators](11-async-generators.md)).

---

## HTTP/2 (optional)

```python
async with httpx.AsyncClient(http2=True) as client:
    ...
```

Нужен `pip install httpx[http2]`. Mock стенд — HTTP/1.1 достаточно.

---

## Типичные ошибки

| Ошибка | Последствие | Решение |
|--------|-------------|---------|
| New client per request | TCP handshake storm | lifespan singleton |
| timeout=None default hang | stuck forever | explicit Timeout |
| read entire 500MB body | OOM | stream |
| No raise_for_status | silent 503 | check status |
| gather без bound on 10k URLs | FD exhaustion | Semaphore + Queue |

---

## Резюме

**httpx.AsyncClient** — стандарт async HTTP в Python ecosystem. **Один client на app**, явные **Timeout** и **Limits**, parallel через **gather/TaskGroup**. Retries — осознанно на idempotent GET. Streaming — для large bodies.

## Чек-лист

- Почему requests блокирует event loop?
- Что закрывает `await client.aclose()`?
- Разница httpx timeout и asyncio.timeout?
- Как gateway делает sequential vs parallel aggregate?

Следующий урок: [18. Лаба: parallel fetch](18-lab-parallel-fetch.md).
