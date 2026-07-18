# 03. Лаба: первый async-скрипт

## Цель лабы

Создать **venv**, установить **httpx**, написать первый **`asyncio.run`** скрипт. Сравнить **последовательные** и **параллельные** запросы к mock gateway на **`localhost:8095`**. Зафиксировать wall-clock разницу.

## Предварительно

- Python **3.11+** (рекомендуется 3.12).
- Docker: стенд [`deploy/python-async`](../../deploy/python-async/README.md).

```bash
cd deploy/python-async
docker compose up -d --build
docker compose ps
curl -s http://localhost:8095/health
```

Ожидайте `{"service":"gateway","status":"ok"}` (или аналог). Smoke:

```bash
bash scripts/smoke.sh
# Windows: .\scripts\smoke.ps1
```

Рабочая папка для скриптов — любая; ниже `courses/python-async/labs/` (создайте сами).

```bash
cd courses/python-async
python -m venv .venv
# Linux/macOS: source .venv/bin/activate
# Windows: .\.venv\Scripts\Activate.ps1
pip install -r examples/requirements-lab.txt
```

---

## Задание 1. Sync baseline (urllib)

**Зачем:** числовой baseline до async.

Создайте `labs/01_sync_baseline.py`:

```python
import time
import urllib.request

BASE = "http://localhost:8095"
URLS = [
    f"{BASE}/slow?extra_ms=0",
    f"{BASE}/slow?extra_ms=50",
    f"{BASE}/slow?extra_ms=100",
]

def fetch(url: str) -> None:
    with urllib.request.urlopen(url, timeout=30) as r:
        r.read()

def main():
    t0 = time.perf_counter()
    for url in URLS:
        fetch(url)
    print(f"sync sequential: {time.perf_counter() - t0:.3f}s")

if __name__ == "__main__":
    main()
```

```bash
python labs/01_sync_baseline.py
```

**Что увидите:** ~**0.75–1.0 s** (сумма задержек ~200+250+300 ms + сеть).

**Если Connection refused:** `docker compose ps`, порт **8095** свободен.

---

## Задание 2. Async sequential

**Зачем:** тот же порядок URL, но `async`/`await`.

`labs/02_async_sequential.py`:

```python
import asyncio
import time

import httpx

BASE = "http://localhost:8095"
URLS = [
    f"{BASE}/slow?extra_ms=0",
    f"{BASE}/slow?extra_ms=50",
    f"{BASE}/slow?extra_ms=100",
]

async def fetch(client: httpx.AsyncClient, url: str) -> None:
    r = await client.get(url)
    r.raise_for_status()

async def main():
    t0 = time.perf_counter()
    async with httpx.AsyncClient(timeout=30.0) as client:
        for url in URLS:
            await fetch(client, url)
    print(f"async sequential: {time.perf_counter() - t0:.3f}s")

if __name__ == "__main__":
    asyncio.run(main())
```

**Что увидите:** время **≈ sync sequential** — async без параллелизма не ускоряет.

---

## Задание 3. Async parallel (gather)

**Зачем:** concurrent I/O — главный выигрыш asyncio.

`labs/03_async_parallel.py`:

```python
import asyncio
import time

import httpx

BASE = "http://localhost:8095"
URLS = [
    f"{BASE}/slow?extra_ms=0",
    f"{BASE}/slow?extra_ms=50",
    f"{BASE}/slow?extra_ms=100",
]

async def fetch(client: httpx.AsyncClient, url: str) -> dict:
    r = await client.get(url)
    r.raise_for_status()
    return r.json()

async def main():
    t0 = time.perf_counter()
    async with httpx.AsyncClient(timeout=30.0) as client:
        results = await asyncio.gather(*(fetch(client, u) for u in URLS))
    elapsed = time.perf_counter() - t0
    print(f"async parallel: {elapsed:.3f}s")
    print("delays:", [x.get("delay_ms") for x in results])

if __name__ == "__main__":
    asyncio.run(main())
```

**Что увидите:** ~**0.35–0.45 s** — близко к **max(delay)**, не sum.

---

## Задание 4. Проверка aggregate на gateway

**Зачем:** увидеть тот же паттерн «как в production gateway».

```bash
curl -s -w "\ntotal:%{time_total}s\n" http://localhost:8095/aggregate
curl -s -w "\ntotal:%{time_total}s\n" http://localhost:8095/aggregate-parallel
```

**Что увидите:** sequential ~**1 s**, parallel ~**0.5 s** (зависит от BASE_DELAY_MS upstream).

---

## Задание 5. Осознанная ошибка (опционально)

**Зачем:** закрепить warning «coroutine was never awaited».

```python
async def broken():
    async with httpx.AsyncClient() as client:
        client.get("http://localhost:8095/health")  # забыли await!

asyncio.run(broken())
```

**Что увидите:** `RuntimeWarning: coroutine 'AsyncClient.get' was never awaited`.

---

## Если не работает

| Симптом | Действие |
|---------|----------|
| `8095` refused | `cd deploy/python-async && docker compose up -d --build` |
| aggregate 502 | дождаться **healthy** всех сервисов (`docker compose ps`) |
| SSL errors | используйте `http://`, не `https://` |
| Очень долго | проверьте VPN/proxy; `httpx` без proxy по умолчанию |
| Windows firewall | разрешите Docker Desktop |

Подробнее: [`deploy/python-async/README.md`](../../deploy/python-async/README.md).

---

## Критерии успеха

- [ ] venv создан, `httpx` установлен
- [ ] sync sequential ~ сумма задержек
- [ ] async sequential ≈ sync (не быстрее)
- [ ] async parallel ≈ max задержки (значительно быстрее)
- [ ] `/aggregate` медленнее `/aggregate-parallel` на curl
- [ ] Понятно, зачем нужен `await` на `client.get`

---

## Уборка

Скрипты в `labs/` можно оставить для diff. Стенд:

```bash
cd deploy/python-async
docker compose down   # без -v, если другие курсы используют образы
```

---

## Вопросы для самопроверки

1. Почему async sequential не быстрее sync?
2. Что делает `asyncio.gather` в задании 3?
3. Зачем `async with httpx.AsyncClient`?
4. Как gateway реализует `/aggregate-parallel`? (подсказка: [`app.py`](../../deploy/python-async/mock-server/app.py))

Следующий урок: [04. Event loop](04-event-loop.md).
