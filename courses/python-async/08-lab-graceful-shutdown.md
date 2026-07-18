# 08. Лаба: graceful shutdown

## Цель лабы

Написать мини-сервис с **долгими tasks** и корректным **shutdown**: по **SIGINT/SIGTERM** отменить tasks, дождаться cleanup, закрыть **httpx** client. Смоделировать поведение uvicorn при деплое.

## Предварительно

- [07-cancellation-timeouts](07-cancellation-timeouts.md).
- Стенд **8095** для «долгих» `/slow` запросов.
- Python 3.11+.

```bash
pip install httpx
curl -s http://localhost:8095/health
```

---

## Задание 1. Worker с бесконечным циклом

**Зачем:** типичный background consumer.

`labs/08_worker.py` (фрагмент — допишите shutdown):

```python
import asyncio
import signal
from contextlib import asynccontextmanager

import httpx

BASE = "http://localhost:8095"
shutdown_event = asyncio.Event()

async def poll_once(client: httpx.AsyncClient, n: int) -> None:
    print(f"[{n}] start")
    try:
        r = await client.get(f"{BASE}/slow?extra_ms=200")
        r.raise_for_status()
        print(f"[{n}] ok delay={r.json().get('delay_ms')}")
    except asyncio.CancelledError:
        print(f"[{n}] cancelled — cleanup")
        raise

async def worker(client: httpx.AsyncClient, name: str):
    n = 0
    while not shutdown_event.is_set():
        n += 1
        try:
            async with asyncio.timeout(5.0):
                await poll_once(client, n)
        except TimeoutError:
            print(f"[{name}] timeout on iteration {n}")
        await asyncio.sleep(0.1)

async def main():
    async with httpx.AsyncClient(timeout=30.0) as client:
        tasks = [
            asyncio.create_task(worker(client, "A"), name="worker-A"),
            asyncio.create_task(worker(client, "B"), name="worker-B"),
        ]
        await shutdown_event.wait()
        print("shutting down...")
        for t in tasks:
            t.cancel()
        await asyncio.gather(*tasks, return_exceptions=True)
        print("done")

def request_shutdown():
    shutdown_event.set()

if __name__ == "__main__":
    loop = asyncio.new_event_loop()
    asyncio.set_event_loop(loop)
    for sig in (signal.SIGINT, signal.SIGTERM):
        try:
            loop.add_signal_handler(sig, request_shutdown)
        except NotImplementedError:
            pass  # Windows: см. задание 3
    try:
        loop.run_until_complete(main())
    finally:
        loop.close()
```

**Запуск:** `python labs/08_worker.py`, через **5–10 s** нажмите **Ctrl+C**.

**Что увидите:** `shutting down...`, сообщения `cancelled — cleanup`, `done`.

---

## Задание 2. Таймаут на «зависший» poll

**Зачем:** без `asyncio.timeout` один hung HTTP блокирует cancel до httpx timeout.

Измените `extra_ms=5000` и `asyncio.timeout(1.0)` — убедитесь, что iteration завершается по **TimeoutError**, loop остаётся responsive.

**Что увидите:** `[worker-A] timeout on iteration N` каждые ~1 s, Ctrl+C всё ещё работает быстро.

---

## Задание 3. Windows: signal handler fallback

**Зачем:** `add_signal_handler` не везде.

```python
# альтернатива для Windows lab
import threading

def wait_keyboard():
    input("Press Enter to shutdown...\n")
    shutdown_event.set()

# в main() перед await shutdown_event.wait():
threading.Thread(target=wait_keyboard, daemon=True).start()
```

**Что увидите:** Enter триггерит тот же shutdown path, что SIGINT на Linux.

---

## Задание 4. TaskGroup shutdown pattern

**Зачем:** structured batch с cancel.

```python
async def run_batch(client: httpx.AsyncClient):
    try:
        async with asyncio.TaskGroup() as tg:
            for i in range(3):
                tg.create_task(poll_once(client, i))
    except* Exception as eg:
        print("errors:", eg.exceptions)
```

Запустите batch, прервите **Ctrl+C** во время выполнения — siblings должны cancel.

---

## Задание 5. Сравнение с gateway lifecycle

Откройте [`deploy/python-async/mock-server/app.py`](../../deploy/python-async/mock-server/app.py) — **`lifespan`** закрывает `httpx.AsyncClient` при остановке контейнера:

```bash
cd deploy/python-async
docker compose restart gateway
docker compose logs gateway --tail 20
```

**Что увидите:** чистый restart без leaked connections (на уровне процесса).

---

## Если не работает

| Симптом | Действие |
|---------|----------|
| Ctrl+C не останавливает | Windows — задание 3; проверьте `CancelledError` re-raise |
| Worker не exit | `gather(..., return_exceptions=True)` после cancel |
| Hang после shutdown | httpx timeout слишком большой — уменьшите |
| SIGTERM в Docker | `docker stop gateway` — grace period 10s |

---

## Критерии успеха

- [ ] Ctrl+C / Enter → `shutting down` → workers cancel
- [ ] `CancelledError` не проглочен (re-raise в poll_once)
- [ ] `asyncio.timeout` прерывает slow extra_ms=5000
- [ ] Понимаете аналог с FastAPI lifespan + httpx
- [ ] TaskGroup batch прерывается при cancel

---

## Уборка

Остановите скрипт. Стенд можно оставить для следующих лаб.

---

## Вопросы для самопроверки

1. Зачем `gather(..., return_exceptions=True)` после mass cancel?
2. Почему shutdown_event лучше, чем `while True` без флага?
3. Что делает uvicorn при SIGTERM с running request?
4. Как lifespan в mock gateway связан с этой лабой?

Следующий урок: [09. gather vs TaskGroup](09-gather-vs-taskgroup.md).
