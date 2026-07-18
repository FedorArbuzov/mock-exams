# 29. Debug mode, slow callback и profiling

## Введение: «в production всё медленно, но профайлер молчит»

Async-баги **не воспроизводятся** под нагрузкой: одна корутина блокирует loop на 200 ms — p99 скачет, stack trace показывает только `await`. Нужны **asyncio debug mode**, предупреждения **slow callback**, и инструменты **профилирования** event loop.

Связь: [28-lab-testing-async](28-lab-testing-async.md), production tuning — [30-uvloop-production](30-uvloop-production.md).

## Что вы узнаете

- **`PYTHONASYNCIODEBUG`**, `loop.set_debug(True)`.
- **Slow callback** warnings (> 100 ms по умолчанию).
- **`asyncio.all_tasks`**, диагностика зависших корутин.
- Profiling: `yappi`, `py-spy`, логирование task names.

---

## Debug mode

```python
import asyncio
import os

async def main():
    ...

# Способ 1: env
# PYTHONASYNCIODEBUG=1 python app.py

# Способ 2: явно
asyncio.run(main(), debug=True)  # Python 3.11+
```

| Эффект debug=True | |
|-------------------|---|
| Проверка unawaited coroutines | Warning при GC |
| Длинный `loop.slow_callback_duration` | Лог медленных callbacks |
| Отменённые tasks | Более подробные traceback |

**Не оставляйте** `debug=True` в production постоянно — overhead на bookkeeping.

---

## Slow callback

```python
import asyncio
import time

async def main():
    loop = asyncio.get_running_loop()
    loop.slow_callback_duration = 0.05  # 50 ms порог

    def blocking_callback():
        time.sleep(0.2)  # имитация sync в callback

    loop.call_soon(blocking_callback)
    await asyncio.sleep(0.5)

asyncio.run(main(), debug=True)
```

Вывод (при debug):

```
Executing <Handle ...> took 0.2 seconds
```

**Источник:** не только `call_soon`, но и **блокировка** между await — фактически любой sync CPU в coroutine.

---

## Найти зависшие tasks

```python
import asyncio

async def watchdog(interval: float = 5.0):
    while True:
        await asyncio.sleep(interval)
        tasks = asyncio.all_tasks()
        for t in tasks:
            if t.get_name().startswith("worker-"):
                print(t.get_name(), t.done(), t.get_coro())

async def main():
    asyncio.create_task(watchdog(), name="watchdog")
    # ... ваш сервис
```

В Python 3.11+ `Task.get_stack()` ограничен — используйте **логирование** на входе/выходе корутин.

---

## Task naming

```python
async def fetch_item(n: int):
    ...

task = asyncio.create_task(fetch_item(1), name=f"fetch-{n}")
```

Имена попадают в логи и `asyncio.all_tasks()` — бесценно при incident.

---

## Профилирование

### py-spy (production-safe sampling)

```bash
pip install py-spy
py-spy top --pid <uvicorn-pid>
py-spy record -o profile.svg --pid <pid> --duration 30
```

Не требует instrumentation; видит **где** CPU, включая C extensions.

### yappi (async-aware)

```bash
pip install yappi
```

```python
import yappi
import asyncio

async def workload():
    ...

yappi.set_clock_type("wall")
yappi.start()
asyncio.run(workload())
yappi.stop()
yappi.get_func_stats().print_all()
```

Фильтр по `await` time vs CPU time — ищите функции без await с большим wall time.

---

## Логирование await boundaries

```python
import logging
import time

log = logging.getLogger(__name__)

async def traced_fetch(name: str, coro):
    t0 = time.perf_counter()
    log.info("start %s", name)
    try:
        return await coro
    finally:
        log.info("done %s in %.3fs", name, time.perf_counter() - t0)
```

Structured logs + trace_id — связать slow request с конкретной корутиной.

---

## Типичные симптомы и диагноз

| Симптом | Вероятная причина | Инструмент |
|---------|-------------------|------------|
| p99 ↑, CPU низкий | blocking I/O в async | debug slow callback |
| Всё зависло | deadlock Lock/Semaphore | all_tasks dump |
| Утечка памяти | tasks never awaited | debug unawaited |
| Один endpoint медленный | sync ORM / pandas | py-spy flamegraph |
| После deploy хуже | pool exhaustion | pg_stat_activity, redis INFO |

---

## На стенде 8095

```python
import asyncio
import time
import httpx

async def poison():
    time.sleep(0.3)

async def probe():
    async with httpx.AsyncClient() as c:
        async with asyncio.timeout(2.0):
            await c.get("http://localhost:8095/health")

async def demo():
    asyncio.create_task(poison(), name="poison")
    await probe()  # задержится ~300ms при debug

asyncio.run(demo(), debug=True)
```

Уберите `poison` — probe снова быстрый. Так воспроизводите «один плохой сосед».

---

## В продакшене

- **Кратковременный** debug при расследовании, не 24/7.
- **OpenTelemetry** spans на каждый await HTTP/DB ([deploy/observability](../../deploy/observability/README.md)).
- Алерт на **event loop lag** (uvicorn + custom metric).
- Runbook: «slow callback» → grep blocking imports.

---

## Резюме

**Debug mode** и **slow callback warnings** — первая линия обороны против блокировки loop. **py-spy/yappi** — вторая. **Именованные tasks** и **structured logs** связывают симптом с кодом.

## Чек-лист

- Как включить asyncio debug?
- Что означает «Executing Handle took 0.2 seconds»?
- Как посмотреть все running tasks?
- Почему debug=True не для permanent production?

Следующий урок: [30. uvloop и production](30-uvloop-production.md).
