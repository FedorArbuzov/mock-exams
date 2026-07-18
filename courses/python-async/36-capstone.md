# 36. Capstone: async pipeline aggregator

## Бриф

**4–6 часов.** Соберите сервис-агрегатор, который:

1. Принимает список **source paths** (или preset).
2. **Параллельно** fetch через httpx с **semaphore + retry + timeout**.
3. **Парсит** JSON (и считает простые метрики).
4. **Сохраняет** audit в **PostgreSQL** (asyncpg/SQLAlchemy).
5. Кэширует summary в **Redis** с TTL.
6. Экспортирует **метрики** (stdout или `/metrics` text).
7. Корректно **shutdown** (close clients, dispose engine).

Стенды: [`deploy/python-async`](../../deploy/python-async/README.md) (**8095**), [`deploy/postgres`](../../deploy/postgres/README.md), [`deploy/redis`](../../deploy/redis/README.md). Опционально упаковка по образцу [`deploy/fastapi`](../../deploy/fastapi/README.md).

---

## Архитектура

```mermaid
flowchart LR
  CLI[CLI / HTTP trigger]
  ORCH[Orchestrator]
  HTTP[httpx AsyncClient]
  PG[(fetch_log + aggregates)]
  R[(Redis summary)]
  GW[Gateway 8095]
  CLI --> ORCH
  ORCH --> HTTP
  HTTP --> GW
  ORCH --> PG
  ORCH --> R
```

| Модуль | Ответственность |
|--------|-----------------|
| `config.py` | URLs, limits, DSN |
| `fetcher.py` | semaphore, retry ([35-lab-rate-limited-fetcher](35-lab-rate-limited-fetcher.md)) |
| `parser.py` | extract items count, delay_ms |
| `store.py` | async insert batch ([20-lab-async-database](20-lab-async-database.md)) |
| `cache.py` | cache-aside summary ([22-lab-redis-async](22-lab-redis-async.md)) |
| `main.py` | lifespan, orchestration, metrics |

---

## Фаза 1. Скелет (45 min)

```bash
mkdir -p capstone/aggregator
cd capstone/aggregator
python -m venv .venv
pip install httpx sqlalchemy asyncpg redis pytest pytest-asyncio
```

`main.py`:

```python
import asyncio
import signal
from contextlib import asynccontextmanager

from aggregator.config import Settings
from aggregator.pipeline import run_pipeline

shutdown = asyncio.Event()

@asynccontextmanager
async def app_lifespan(settings: Settings):
    # init engine, redis, httpx — yield — cleanup
    yield
    # await engine.dispose(), redis.aclose(), client.aclose()

async def main():
    settings = Settings()
    async with app_lifespan(settings):
        worker = asyncio.create_task(run_pipeline(settings, shutdown), name="pipeline")
        await shutdown.wait()
        worker.cancel()
        await asyncio.gather(worker, return_exceptions=True)

def on_signal():
    shutdown.set()

if __name__ == "__main__":
    loop = asyncio.new_event_loop()
    for sig in (signal.SIGINT, signal.SIGTERM):
        try:
            loop.add_signal_handler(sig, on_signal)
        except NotImplementedError:
            pass
    loop.run_until_complete(main())
```

Windows: Enter-to-shutdown как в [08-lab-graceful-shutdown](08-lab-graceful-shutdown.md).

---

## Фаза 2. Fetch + parse (60 min)

Переиспользуйте [`examples/fetch_parallel.py`](examples/fetch_parallel.py) и лабу **35**.

```python
@dataclass
class ParsedRecord:
    url: str
    status: int
    latency_ms: float
    item_count: int | None
    delay_ms: int | None

def parse_json_payload(data: dict) -> tuple[int | None, int | None]:
    items = data.get("items")
    delay = data.get("delay_ms")
    return (len(items) if isinstance(items, list) else None, delay)
```

**Критерий:** 15+ paths за один run, ok rate > 80% при `fail?rate=0.3`.

---

## Фаза 3. Store + cache (60 min)

Таблицы:

```sql
-- уже есть fetch_log; добавьте
CREATE TABLE IF NOT EXISTS run_summary (
    id SERIAL PRIMARY KEY,
    run_id UUID NOT NULL,
    total INT,
    ok INT,
    fail INT,
    avg_latency_ms REAL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);
```

После run:

- INSERT batch в `fetch_log`.
- INSERT одна строка `run_summary`.
- `SETEX aggregator:last_summary` в Redis.

---

## Фаза 4. Metrics (30 min)

```python
def emit_metrics(run_id: str, ok: int, fail: int, elapsed: float) -> None:
    print(f"METRIC run_id={run_id} ok={ok} fail={fail} elapsed_s={elapsed:.2f}")
```

Опционально: Prometheus client `aggregator_ok_total`, `aggregator_latency_seconds`.

---

## Фаза 5. Тесты (45 min)

Минимум из [28-lab-testing-async](28-lab-testing-async.md):

- unit: `parse_json_payload`, retry с AsyncMock
- unit: cache hit skips DB
- integration (`RUN_INTEGRATION=1`): один fetch к `/health`

```bash
pytest tests/ -v
RUN_INTEGRATION=1 pytest tests/test_integration.py -v
```

---

## Фаза 6. Hardening (60 min)

| Задача | Ссылка |
|--------|--------|
| Semaphore sizing | [32-backpressure-semaphores](32-backpressure-semaphores.md) |
| Debug slow path | [29-debug-profiling](29-debug-profiling.md) |
| Breaker на `/fail` | [34-system-design-async](34-system-design-async.md) |
| CLI args: `--concurrency`, `--paths-file` | argparse |

Опционально: HTTP trigger через FastAPI ([31-fastapi-bridge](31-fastapi-bridge.md)) — `POST /aggregate` запускает pipeline в `BackgroundTasks` (осознайте ограничения).

---

## Критерии приёмки capstone

- [ ] Параллельный fetch с лимитом concurrency
- [ ] Retry + timeout на нестабильных paths
- [ ] Postgres: fetch_log + run_summary
- [ ] Redis: cached last summary с TTL
- [ ] Graceful shutdown без leaked connections
- [ ] ≥ 5 unit-тестов, ≥ 1 integration
- [ ] README в `capstone/` с командами запуска *(локальный, не корень курса)*
- [ ] Wall-clock заметно ниже sequential (замерьте оба режима)

---

## Поднять стенды

```bash
cd deploy/python-async && docker compose up -d
cd deploy/postgres && docker compose up -d
cd deploy/redis && docker compose up -d
```

Smoke:

```bash
curl -s http://localhost:8095/health
docker exec mock-postgres psql -U course -d course -c "SELECT 1"
redis-cli -h localhost -p 6379 ping
```

---

## Rubric (самооценка)

| Уровень | Признаки |
|---------|----------|
| Pass | fetch + store, без cache/tests |
| Good | + Redis + tests + shutdown |
| Excellent | + metrics + breaker + docs + sequential vs parallel benchmark |
| Staff-ish | + idempotent rerun, run_id dedup, OTEL spans |

---

## Что сдавать

1. Репозиторий/папка `capstone/aggregator`.
2. Скрин или лог одного успешного run с метриками.
3. Вывод `pytest`.
4. Параграф: «что бы улучшил в production» (workers, queue, OTEL).

---

## Дальше

- Развернуть как сервис в [`deploy/fastapi`](../../deploy/fastapi/README.md).
- Пройти [interview-cheatsheet](interview-cheatsheet.md) и [33-interview-qa](33-interview-qa.md).
- Сравнить с [27-async-patterns](../fastapi/27-async-patterns.md) в реальном API.

Поздравляем — вы прошли курс **python-async** (уроки 19–36). Вернуться к фазе 1: [01-sync-vs-async](01-sync-vs-async.md).
