# 11. Async generators и async for

## Введение: «скачали 2 GB JSON в память — OOMKill»

Сервис загружал **пагинированный** API в list comprehension — **2 GB** RSS, pod **OOMKilled**. Решение: **async generator**, который **yield**-ит страницы по мере **await** fetch — память **O(page size)**, backpressure через **async for**.

Streaming lab — [12-lab-streaming](12-lab-streaming.md); HTTP chunking — [25-websockets-sse](../fastapi/25-websockets-sse.md) (SSE/WebSocket на уровне API).

## Что вы узнаете

- **`async def` + `yield`** → async generator.
- **`async for`** и протокол **`__anext__`**.
- **`asyncio.sleep(0)`** yield для fairness.
- **`aclosing`** (3.10+) для guaranteed close.

---

## Async generator syntax

```python
import asyncio

async def count_to(n: int):
    for i in range(n):
        await asyncio.sleep(0.05)
        yield i

async def main():
    async for value in count_to(5):
        print("got", value)

asyncio.run(main())
```

| Sync generator | Async generator |
|----------------|-----------------|
| `def gen(): yield x` | `async def gen(): yield x` |
| `for x in gen()` | `async for x in gen()` |
| `next(gen())` | `await anext(gen())` |

**Lazy:** код между yield выполняется **только** когда consumer запрашивает следующий элемент.

---

## Пагинация HTTP как stream

```python
import httpx

BASE = "http://localhost:8095"

async def json_pages(client: httpx.AsyncClient, max_pages: int = 5):
    for page in range(max_pages):
        r = await client.get(f"{BASE}/json", params={"size": 10})
        r.raise_for_status()
        data = r.json()
        yield page, data["items"]

async def consume():
    async with httpx.AsyncClient(timeout=30) as client:
        total = 0
        async for page, items in json_pages(client, 3):
            total += len(items)
            print(f"page {page}: {len(items)} items")
        print("total items:", total)
```

На `/json` size ограничен query — для больших объёмов см. будущие главы про backpressure ([32-backpressure-semaphores](32-backpressure-semaphores.md)).

---

## async for и break / cancel

```python
async def stream_events():
    try:
        for i in range(1000):
            await asyncio.sleep(0.01)
            yield {"seq": i}
    finally:
        print("generator cleanup")

async def consumer():
    async for event in stream_events():
        if event["seq"] >= 3:
            break
    print("consumer done")
```

**break** из `async for` → **`GeneratorExit`** / **`aclose`** на generator — **finally** в generator **выполнится** (важно закрыть subscriptions).

---

## aclosing (3.10+)

```python
from contextlib import aclosing

async def main():
    async with aclosing(count_to(100)) as gen:
        async for i in gen:
            if i > 2:
                break
    # gen.aclose() guaranteed
```

Без **`aclosing`** при break generator может не закрыться сразу (зависит от GC).

---

## Merge streams (pattern)

```python
import asyncio

async def ticker(name: str, interval: float):
    n = 0
    while True:
        await asyncio.sleep(interval)
        n += 1
        yield f"{name}:{n}"

async def merge_first(*gens, limit: int = 5):
    # упрощённый merge — для prod см. asyncio.Queue
    pending = {asyncio.create_task(anext(g)): g for g in gens}
    count = 0
    while pending and count < limit:
        done, _ = await asyncio.wait(pending.keys(), return_when=asyncio.FIRST_COMPLETED)
        for task in done:
            gen = pending.pop(task)
            try:
                value = task.result()
                count += 1
                yield value
                pending[asyncio.create_task(anext(gen))] = gen
            except StopAsyncIteration:
                pass
```

Для production merge — **Queue** ([14-asyncio-queues](14-asyncio-queues.md)).

---

## Связь с SSE / WebSocket

FastAPI **StreamingResponse** может читать async generator:

```python
async def event_stream():
    for i in range(10):
        await asyncio.sleep(0.5)
        yield f"data: {{\"n\": {i}}}\n\n".encode()

# return StreamingResponse(event_stream(), media_type="text/event-stream")
```

Async generator — **building block**; wire format — HTTP/SSE layer ([25-websockets-sse](../fastapi/25-websockets-sse.md)).

---

## Типичные ошибки

| Ошибка | Последствие | Решение |
|--------|-------------|---------|
| `for x in async_gen()` | TypeError | `async for` |
| `yield` без await в long loop | block loop | `await asyncio.sleep(0)` |
| Не закрыть generator | leak subscription | `aclosing` / `finally` |
| Materialize all pages in list | OOM | stream consume |
| Async gen from sync code | cannot iterate | `asyncio.run` consumer |

---

## Резюме

**Async generators** производят значения **lazy** через **`yield`** и **`await`**. Consumer — **`async for`**. Идеальны для **пагинации**, **event streams**, **bounded memory**. Закрывайте generator через **`finally`** или **`aclosing`**.

## Чек-лист

- Чем async generator отличается от list of await?
- Что выполнится при `break` из async for?
- Зачем `aclosing`?
- Как `/json` на 8095 использовать как paginated source?

Следующий урок: [12. Лаба: streaming данных](12-lab-streaming.md).
