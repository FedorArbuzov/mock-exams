# 27. Async patterns: пулы, executor и блокирующие ловушки

## Введение: «async endpoint, но latency как у sync»

Профилирование показало: `async def report()` внутри вызывал **pandas** и **sync psycopg2** — event loop стоял 800 ms, все остальные запросы ждали. **Async** в FastAPI не магия: один поток uvicorn обслуживает тысячи корутин, пока они **await** I/O. Блокирующий CPU или sync socket убивает параллелизм.

Связь с [`postgresql-developer`](../postgresql-developer/README.md): пул соединений и время удержания сессии влияют на throughput так же, как в sync приложениях.

## Что вы узнаете

- **asyncpg** pool через SQLAlchemy `create_async_engine`.
- Когда использовать **`asyncio.to_thread` / `run_in_executor`**.
- Антипаттерны: sync ORM, `requests`, `time.sleep` в `async def`.
- Размер пула и `pool_pre_ping`.

---

## Event loop в одном процессе

```mermaid
flowchart LR
  subgraph loop [Event loop]
    R1[Request A await DB]
    R2[Request B await Redis]
    R3[Request C BLOCKED]
  end
  R3 -->|sync CPU| Stall[Все ждут]
```

| Безопасно в async | Опасно в async |
|-------------------|----------------|
| `await session.execute()` | `session.execute()` sync |
| `await redis.get()` | `redis.Redis()` sync client |
| `await httpx.AsyncClient` | `requests.get()` |
| `await asyncio.sleep(1)` | `time.sleep(1)` |

---

## SQLAlchemy async + asyncpg pool

```python
from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker

engine = create_async_engine(
    "postgresql+asyncpg://course:course@postgres:5432/course",
    pool_size=10,
    max_overflow=20,
    pool_pre_ping=True,
    pool_recycle=3600,
)

SessionLocal = async_sessionmaker(engine, expire_on_commit=False)
```

| Параметр | Смысл |
|----------|--------|
| `pool_size` | постоянные соединения на процесс |
| `max_overflow` | доп. соединения при пике |
| `pool_pre_ping` | `SELECT 1` перед выдачей — мёртвые conn |
| `pool_recycle` | не держать conn дольше (firewall/NAT) |

**Формула (грубо):** `workers × (pool_size + max_overflow)` ≤ `max_connections` PostgreSQL минус запас.

На стенде compose: один uvicorn worker — `pool_size=5` достаточно для лаб.

```bash
docker exec mock-fastapi-postgres psql -U course -d course \
  -c "SHOW max_connections;"
```

---

## Держите сессию коротко

```python
# хорошо: dependency yield
async def get_db():
    async with SessionLocal() as session:
        yield session

# плохо: одна сессия на весь websocket часами
```

Долгие транзакции блокируют строки в БД ([MVCC](../postgresql-basic/12-lab-mvcc.md)).

---

## run_in_executor / asyncio.to_thread

Sync библиотека без async аналога:

```python
import asyncio
from functools import partial

def resize_image(path: str) -> bytes:
    # PIL, CPU-bound
    ...

@router.post("/upload")
async def upload(file: UploadFile):
    data = await file.read()
    # не блокируем loop
    result = await asyncio.to_thread(resize_image, "/tmp/img.png")
    return {"size": len(result)}
```

| Вариант | Когда |
|---------|-------|
| `asyncio.to_thread` (3.9+) | I/O-light CPU, legacy sync func |
| `ProcessPoolExecutor` | тяжёлый CPU (numpy, pdf) |
| Переписать на async | httpx, asyncpg, aioredis |

```python
loop = asyncio.get_running_loop()
await loop.run_in_executor(None, partial(sync_fn, arg1, kw=2))
```

`None` executor — default ThreadPool; для CPU лучше **ProcessPool**.

---

## Несколько await параллельно

```python
import asyncio

async def get_dashboard(user_id: int, db: AsyncSession):
    items_coro = db.execute(select(Item).where(Item.owner_id == user_id))
    stats_coro = db.execute(select(func.count()).select_from(Item))
    items_res, stats_res = await asyncio.gather(items_coro, stats_coro)
    return items_res.scalars().all(), stats_res.scalar()
```

**Осторожно:** одна `AsyncSession` — не два параллельных `execute` на ней; используйте отдельные сессии или последовательные await.

---

## Sync endpoint как escape hatch

```python
@router.get("/legacy-sync")
def legacy_sync():
    return {"ok": True}
```

FastAPI запустит sync `def` в **threadpool** — приемлемо для редких тяжёлых вызовов, не для hot path.

---

## httpx vs requests

```python
# async
async with httpx.AsyncClient(timeout=10.0) as client:
    r = await client.get("https://api.example.com/data")

# sync в async def — ЗАПРЕЩЕНО на hot path
# requests.get(...)  # блокирует loop
```

---

## Диагностика на стенде

```bash
# latency под нагрузкой (установите hey или ab)
hey -n 200 -c 20 http://localhost:8090/api/v1/items

docker compose logs api | tail -20
```

Если p99 скачет при малой нагрузке — ищите блокировки в `async def`.

---

## Типичные ошибки

| Ошибка | Последствие | Решение |
|--------|-------------|---------|
| `time.sleep` в middleware async | freeze | `asyncio.sleep` |
| Огромный `pool_size` | исчерпали max_connections PG | расчёт workers×pool |
| Глобальная одна Session | race, stale data | per-request session |
| CPU в thread pool без лимита | GIL contention | process pool / worker |

---

## Резюме

**Async FastAPI** эффективен при **await I/O**. Блокирующий код — **`asyncio.to_thread`** или отдельные sync endpoints/workers. **asyncpg pool** настраивайте под число workers и лимит PostgreSQL. Кэш и rate limit — [28-redis-cache](28-redis-cache.md).

## Чек-лист

- Почему `requests` в `async def` опасен?
- Что делает `pool_pre_ping`?
- Когда ProcessPool лучше ThreadPool?

Далее: [28-redis-cache](28-redis-cache.md).
