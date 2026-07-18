# 07. Сравнение Node event loop и Python asyncio

## Сценарий с работы

Команда shop: FastAPI на `:8090` (asyncio + uvicorn), BFF на Node `:3096`. Tech lead: «Оба async — можно один паттерн переносить?» Python-разработчик пишет `time.sleep(5)` в `async def` — event loop FastAPI замирает. Node-разработчик вызывает `readFileSync` в Express — та же история. На архитектурном review спрашивают: «Сколько одновременных запросов выдержит один процесс Node vs один worker uvicorn?» Без сравнения [`python-async`](../python-async/README.md) и Node libuv ответы остаются «и там, и там async».

Эта глава — **мост между треками** mock-exams. Вы уже знаете asyncio coroutines и `await` из Python-курса; здесь — те же идеи на Node: **один поток JS**, **неблокирующий I/O**, **опасность sync блокировок**, **thread pool** для «тяжёлого» sync.

## Что вы узнаете

- Параллели между **libuv event loop** и **asyncio event loop**.
- **Tasks** (`asyncio.create_task`) vs **Promises** и `async/await`.
- **`await`** в Python и JavaScript — что общего.
- **Thread pool**: `run_in_executor` vs libuv worker pool / `worker_threads`.
- Почему sync I/O убивает оба runtime.
- Практика shop: FastAPI + Node BFF на одной схеме.

---

## Два runtime на одной диаграмме

```text
                    SHOP STACK (mock-exams)
┌─────────────────────────────────────────────────────────┐
│  React :5173  ──►  Node BFF :3096  ──►  FastAPI :8090   │
│                         │                    │          │
│                    libuv loop            asyncio loop   │
│                    V8 + microtasks       uvloop/selector  │
└─────────────────────────────────────────────────────────┘
```

| | **Node.js** | **Python asyncio** |
|---|-------------|---------------------|
| Язык | JavaScript / TS | Python |
| Loop | libuv (C) | asyncio (Python; часто uvloop) |
| Async syntax | Promise, async/await | coroutine, async/await |
| «Отложить» | setImmediate, nextTick, Promise | `await asyncio.sleep(0)`, call_soon |
| HTTP server | http, Express, Fastify | uvicorn, Starlette, FastAPI |
| Sync block in handler | blocks whole Node process | blocks whole loop (1 worker) |

Оба **не магически параллельны** для CPU на одном worker/process.

---

## Модель concurrency: один поток «вашего» кода

**Node:** V8 выполняет JS в одном потоке; libuv обрабатывает I/O.

**asyncio:** event loop в одном потоке (typical); coroutines cooperatively yield на `await`.

```python
# python-async — иллюстрация
import asyncio

async def fetch_items_label():
    await asyncio.sleep(0.01)  # имитация I/O
    return ["keyboard", "mouse"]

async def main():
    print("start")
    items = await fetch_items_label()
    print("items", items)

asyncio.run(main())
```

```javascript
// nodejs-basic — тот же смысл
async function fetchItemsLabel() {
  await new Promise((r) => setTimeout(r, 10));
  return ["keyboard", "mouse"];
}

async function main() {
  console.log("start");
  const items = await fetchItemsLabel();
  console.log("items", items);
}

await main();
```

`await` **не создаёт поток** — отдаёт управление loop до готовности Future/Promise.

---

## Tasks vs Promises

| Python asyncio | Node.js |
|----------------|---------|
| `async def` coroutine | `async function` |
| `asyncio.create_task(coro())` | fire-and-forget: `void fn()` или Promise без await |
| `asyncio.gather(a, b)` | `Promise.all([a(), b()])` |
| `asyncio.wait_for(coro, timeout=5)` | `AbortSignal.timeout(5000)` + fetch |
| Task cancellation | `AbortController`, `task.destroy()` (streams) |

FastAPI endpoint:

```python
@router.get("/items")
async def list_items(session: AsyncSession = Depends(...)):
    result = await session.execute(select(Item))
    return result.scalars().all()
```

Express BFF (preview, [21-express-routing.md](21-express-routing.md)):

```javascript
app.get("/api/shop/items", async (req, res) => {
  const upstream = await fetch(`${process.env.SHOP_API_URL}/api/v1/items`);
  const data = await upstream.json();
  res.json(data);
});
```

Оба **await** сетевой I/O; пока ждут FastAPI/Postgres, loop обслуживает другие запросы **на том же worker**.

---

## Yield control: sleep(0) и setImmediate

В [`python-async`](../python-async/README.md) иногда используют:

```python
await asyncio.sleep(0)  # yield to event loop
```

Ближайшие аналоги Node ([05-nexttick-setimmediate.md](05-nexttick-setimmediate.md)):

| Цель | Node | asyncio |
|------|------|---------|
| Yield после sync | `setImmediate(fn)` | `await asyncio.sleep(0)` |
| Слишком ранний defer | `process.nextTick` (осторожно) | `loop.call_soon` |
| Microtask после Promise | `queueMicrotask` | Future callbacks |

**Не аналог:** `time.sleep(1)` в Python и `while busy` в JS — **блокируют** loop.

---

## Sync I/O: общий антипаттерн

| Плохо (Python) | Плохо (Node) |
|----------------|--------------|
| `open().read()` в `async def` | `readFileSync` в handler |
| `time.sleep(5)` | `while (Date.now() < t) {}` |
| sync `requests.get` | sync `child_process.execSync` |

**Правильно:**

| Python | Node |
|--------|------|
| `aiofiles`, async SQLAlchemy | `fs.promises`, async pg driver |
| `httpx.AsyncClient` | `fetch`, `http.request` + Promise |
| `await asyncio.to_thread(fn)` (3.9+) | `worker_threads`, `setImmediate` chunks |

---

## Thread pool и executor

**Node libuv** — default **4 threads** для некоторых операций (часть fs, dns, crypto). Это **не** «каждый запрос в поток» — очередь может расти.

**Python:**

```python
import asyncio

def parse_heavy_json(raw: str) -> dict:
    # CPU + sync work
    ...

async def handler():
    data = await asyncio.to_thread(parse_heavy_json, raw)
    return data
```

**Node 20+:**

```javascript
import { Worker } from "node:worker_threads";
// для тяжёлого CPU — не блокировать main thread
```

Для shop BFF типичный JSON от `:8090` мал — достаточно async fetch. Thread pool важен при **bcrypt**, image resize, больших sync fs.

---

## Масштабирование процессов

| Подход | Python | Node |
|--------|--------|------|
| Несколько workers | `uvicorn --workers 4` | cluster module, PM2, k8s replicas |
| Один worker async | 1 asyncio loop | 1 libuv loop |
| Очереди фоновых задач | Celery | BullMQ ([nodejs-advanced](../javascript-path.md)) |

BFF и FastAPI **масштабируют горизонтально** одинаково: больше pod/replica, load balancer, stateless JWT.

---

## Порядок microtasks: общий язык V8

JavaScript Promise microtasks в Node **как в браузере** ([javascript-basic/24](../javascript-basic/24-event-loop.md)). Python asyncio имеет **свои** правила scheduling Task — при **сквозной** отладке shop не смешивайте модели в одной голове без таблицы.

Классика **1, 4, 3, 2** — только JS; в Python эквivalent требует аккуратного `call_soon` / Task scheduling — см. [`python-async`](../python-async/README.md).

На собеседовании важнее **принцип**: sync → scheduled callbacks → await points.

---

## Shop: сквозной сценарий

1. React `GET /api/shop/items` → BFF `:3096`.
2. BFF `await fetch('http://localhost:8090/api/v1/items')` — Node poll, не block.
3. FastAPI `async def` — await DB, return JSON.
4. BFF трансформирует (опционально) → React render.

Задержка в шаге 2 при **sync** парсинге 10 MB в BFF — страдают **все** пользователи BFF, хотя FastAPI здоров. Мониторинг: latency BFF vs upstream ([`observability-basic`](../observability-basic/README.md) — позже).

---

## Типичные ошибки

**«FastAPI async — значит Python параллельный».** Один worker — один loop; `def` endpoint с sync ORM блокирует.

**«Node async — значит многопоточный JS».** Поток один; I/O параллелится OS/libuv.

**Смешивать `requests` в asyncio и `fetch` без await в Express.** Оба блокируют или leak unhandled rejection.

**Дублировать бизнес-логику в BFF «потому что async удобнее».** Контракт остаётся на FastAPI; BFF — адаптер ([01-landscape.md](01-landscape.md)).

**Игнорировать `--workers` vs один Node process.** Сравнивайте **один process к одному process** или **pod к pod**.

---

## Резюме

Node **libuv** и Python **asyncio** решают одну задачу: **много I/O на одном потоке** без блокировки на ожидании сети и диска. **`await`** в обоих языках приостанавливает coroutine/async function. **Tasks/Promises** планируют параллельную работу на одном loop. **Sync sleep/read** — антипаттерн в обоих. **Thread pool / to_thread / worker_threads** — для CPU и legacy sync. Shop mock-exams связывает FastAPI `:8090` и Node BFF — один домен, две модели loop, общие правила не блокировать.

## Чек-лист

- [ ] Объясните одним абзацем параллель asyncio и libuv
- [ ] Аналог `asyncio.gather` в JavaScript
- [ ] Чем `time.sleep` в `async def` похож на busy-wait в Node
- [ ] Зачем `asyncio.to_thread` и когда Node worker_threads
- [ ] Почему BFF и FastAPI масштабируют replicas, а не «threads внутри»
- [ ] Прочитали оглавление [`python-async`](../python-async/README.md)

Следующий урок: [08. Асинхронный I/O: паттерны](08-async-io-patterns.md).
