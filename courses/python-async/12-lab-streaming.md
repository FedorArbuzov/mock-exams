# 12. Лаба: streaming данных

## Цель лабы

Реализовать **async generator** для «пагинированной» загрузки с gateway, consumer с **early break**, корректный **cleanup**. Сравнить **peak memory** list vs stream (оценочно).

## Предварительно

- [11-async-generators](11-async-generators.md).
- Стенд **8095**, venv + httpx.

```bash
curl -s "http://localhost:8095/json?size=50" | head -c 200
```

---

## Задание 1. Async generator страниц

**Зачем:** lazy fetch вместо одного giant response.

`labs/12_stream_pages.py`:

```python
import asyncio
from contextlib import aclosing

import httpx

BASE = "http://localhost:8095"

async def fetch_pages(
    client: httpx.AsyncClient,
    sizes: list[int],
):
    """Имитация pagination: разные size на каждой «странице»."""
    for idx, size in enumerate(sizes):
        r = await client.get(f"{BASE}/json", params={"size": size})
        r.raise_for_status()
        body = r.json()
        yield idx, body["service"], body["items"]

async def main():
    sizes = [5, 10, 20, 50, 100]
    async with httpx.AsyncClient(timeout=30.0) as client:
        total = 0
        async for page, service, items in fetch_pages(client, sizes):
            total += len(items)
            print(f"page {page} service={service} items={len(items)}")
        print("total items:", total)

if __name__ == "__main__":
    asyncio.run(main())
```

**Что увидите:** 5 строк page summary, `total items: 185`.

---

## Задание 2. Early break + aclosing

**Зачем:** consumer control + guaranteed close.

```python
async def consume_partial():
    async with httpx.AsyncClient(timeout=30.0) as client:
        async with aclosing(fetch_pages(client, [10, 20, 30, 40])) as gen:
            async for page, service, items in gen:
                print(f"partial page {page}: {len(items)}")
                if page >= 1:
                    break
    print("partial done")

asyncio.run(consume_partial())
```

**Что увидите:** 2 страницы, `partial done`. В generator `finally` (если добавите) — cleanup message.

Добавьте в `fetch_pages`:

```python
    try:
        for idx, size in enumerate(sizes):
            ...
            yield idx, body["service"], body["items"]
    finally:
        print("fetch_pages cleanup")
```

**Что увидите:** `fetch_pages cleanup` даже при break.

---

## Задание 3. Materialized vs stream (concept)

**Зачем:** понять trade-off памяти.

```python
async def materialized(client, sizes):
    pages = []
    async for p in fetch_pages(client, sizes):
        pages.append(p)
    return pages

async def streaming_count(client, sizes):
    n = 0
    async for _, _, items in fetch_pages(client, sizes):
        n += len(items)
    return n
```

Запустите оба с `sizes = [100] * 10` (если gateway позволяет size=100).

**Что увидите:** одинаковый count; materialized держит **все** pages в RAM, streaming — только текущую page.

---

## Задание 4. Slow stream с fairness

**Зачем:** не блокировать loop в tight generator.

```python
async def slow_ticks(n: int):
    for i in range(n):
        await asyncio.sleep(0.1)
        await asyncio.sleep(0)  # yield to loop
        yield i

async def background():
    async for i in slow_ticks(5):
        print("tick", i)

async def with_parallel():
    asyncio.create_task(watch := asyncio.create_task(asyncio.sleep(0.05) or None))
    async for i in slow_ticks(3):
        print("main", i)
```

Упростите: запустите `slow_ticks` и параллельный `asyncio.create_task` печатающий «heartbeat» каждые 50ms.

**Что увидите:** heartbeat и ticks **interleave** — loop не blocked.

---

## Задание 5. Pipeline в Queue (preview)

**Зачем:** мост к [14-asyncio-queues](14-asyncio-queues.md).

```python
async def producer(q: asyncio.Queue, sizes: list[int]):
    async with httpx.AsyncClient(timeout=30) as client:
        async for page, svc, items in fetch_pages(client, sizes):
            await q.put((page, len(items)))
    await q.put(None)  # sentinel

async def consumer(q: asyncio.Queue):
    while True:
        item = await q.get()
        if item is None:
            break
        print("queued page", item)
        q.task_done()
```

Запустите producer и consumer как две tasks в одном `main()`.

**Что увидите:** consumer печатает по мере поступления страниц.

---

## Если не работает

| Симптом | Действие |
|---------|----------|
| `async for` TypeError | generator не async — проверьте `async def` + `yield` |
| Cleanup не печатается | используйте `aclosing` или дождитесь GC |
| size > 1000 rejected | gateway limit — уменьшите size |
| Generator hangs | client timeout; cancel с Ctrl+C |

---

## Критерии успеха

- [ ] fetch_pages yield 5 pages, total 185 items
- [ ] break + finally cleanup виден
- [ ] Понимаете RAM trade-off materialized vs stream
- [ ] heartbeat interleave с slow_ticks
- [ ] producer-consumer preview работает

---

## Уборка

Сохраните скрипты. Стенд оставьте для фазы 3.

---

## Вопросы для самопроверки

1. Когда async generator предпочтительнее `gather` всех страниц?
2. Что делает sentinel `None` в Queue?
3. Зачем `await asyncio.sleep(0)` в generator?
4. Как это связано с SSE в FastAPI?

Следующий урок: [13. Lock, Semaphore, Event](13-primitives-locks.md).
