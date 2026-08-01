# 07. Comparing the Node event loop and Python asyncio

## A scenario from work

The shop team: FastAPI on `:8090` (asyncio + uvicorn), BFF on Node `:3096`. The tech lead asks: "Both are async — can we carry over one pattern?" A Python developer writes `time.sleep(5)` inside `async def` — FastAPI's event loop freezes. A Node developer calls `readFileSync` in Express — same story. In an architecture review someone asks: "How many concurrent requests can one Node process handle versus one uvicorn worker?" Without comparing [`python-async`](../python-async/README.md) and Node's libuv, the answer stays a vague "both are async."

This chapter is the **bridge between mock-exams tracks**. You already know asyncio coroutines and `await` from the Python course; here are the same ideas in Node: **a single JS thread**, **non-blocking I/O**, **the danger of sync blocking**, and a **thread pool** for "heavy" sync work.

## What you'll learn

- The parallels between the **libuv event loop** and the **asyncio event loop**.
- **Tasks** (`asyncio.create_task`) vs. **Promises** and `async/await`.
- **`await`** in Python and JavaScript — what they have in common.
- **Thread pools**: `run_in_executor` vs. the libuv worker pool / `worker_threads`.
- Why sync I/O kills both runtimes.
- Shop practice: FastAPI + Node BFF on a single diagram.

---

## Two runtimes on one diagram

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
| Language | JavaScript / TS | Python |
| Loop | libuv (C) | asyncio (Python; often uvloop) |
| Async syntax | Promise, async/await | coroutine, async/await |
| "Defer" | setImmediate, nextTick, Promise | `await asyncio.sleep(0)`, call_soon |
| HTTP server | http, Express, Fastify | uvicorn, Starlette, FastAPI |
| Sync block in handler | blocks the whole Node process | blocks the whole loop (1 worker) |

Neither is **magically parallel** for CPU work on a single worker/process.

---

## Concurrency model: one thread for "your" code

**Node:** V8 runs JS on a single thread; libuv handles I/O.

**asyncio:** the event loop runs on a single thread (typically); coroutines cooperatively yield at `await`.

```python
# python-async — illustration
import asyncio

async def fetch_items_label():
    await asyncio.sleep(0.01)  # simulate I/O
    return ["keyboard", "mouse"]

async def main():
    print("start")
    items = await fetch_items_label()
    print("items", items)

asyncio.run(main())
```

```javascript
// nodejs-basic — the same idea
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

`await` **doesn't create a thread** — it hands control back to the loop until the Future/Promise is ready.

---

## Tasks vs. Promises

| Python asyncio | Node.js |
|----------------|---------|
| `async def` coroutine | `async function` |
| `asyncio.create_task(coro())` | fire-and-forget: `void fn()` or a Promise without await |
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

Both **await** network I/O; while waiting on FastAPI/Postgres, the loop serves other requests **on the same worker**.

---

## Yielding control: sleep(0) and setImmediate

In [`python-async`](../python-async/README.md) you'll sometimes see:

```python
await asyncio.sleep(0)  # yield to event loop
```

The closest Node equivalents ([05-nexttick-setimmediate.md](05-nexttick-setimmediate.md)):

| Goal | Node | asyncio |
|------|------|---------|
| Yield after sync work | `setImmediate(fn)` | `await asyncio.sleep(0)` |
| Too-early defer | `process.nextTick` (use with care) | `loop.call_soon` |
| Microtask after a Promise | `queueMicrotask` | Future callbacks |

**Not equivalent:** `time.sleep(1)` in Python and `while busy` in JS — both **block** the loop.

---

## Sync I/O: a shared anti-pattern

| Bad (Python) | Bad (Node) |
|----------------|--------------|
| `open().read()` in `async def` | `readFileSync` in a handler |
| `time.sleep(5)` | `while (Date.now() < t) {}` |
| sync `requests.get` | sync `child_process.execSync` |

**Correct:**

| Python | Node |
|--------|------|
| `aiofiles`, async SQLAlchemy | `fs.promises`, an async pg driver |
| `httpx.AsyncClient` | `fetch`, `http.request` + Promise |
| `await asyncio.to_thread(fn)` (3.9+) | `worker_threads`, `setImmediate` chunks |

---

## Thread pools and executors

**Node's libuv** defaults to **4 threads** for certain operations (some fs, dns, crypto work). This is **not** "one thread per request" — the queue can grow.

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
// for heavy CPU work — don't block the main thread
```

For the shop BFF, the typical JSON payload from `:8090` is small — an async fetch is enough. Thread pools matter for **bcrypt**, image resizing, or large sync fs operations.

---

## Scaling processes

| Approach | Python | Node |
|--------|--------|------|
| Multiple workers | `uvicorn --workers 4` | cluster module, PM2, k8s replicas |
| Single async worker | 1 asyncio loop | 1 libuv loop |
| Background task queues | Celery | BullMQ ([nodejs-advanced](../javascript-path.md)) |

BFF and FastAPI **scale horizontally** the same way: more pods/replicas, a load balancer, stateless JWTs.

---

## Microtask ordering: V8's shared language

JavaScript Promise microtasks in Node work **just like in the browser** ([javascript-basic/24](../javascript-basic/24-event-loop.md)). Python asyncio has **its own** Task scheduling rules — when debugging shop end-to-end, don't mix the two mental models without a reference table.

The classic **1, 4, 3, 2** is JS-only; the Python equivalent needs careful `call_soon` / Task scheduling — see [`python-async`](../python-async/README.md).

For interviews, what matters more is the **principle**: sync → scheduled callbacks → await points.

---

## Shop: an end-to-end scenario

1. React `GET /api/shop/items` → BFF `:3096`.
2. BFF `await fetch('http://localhost:8090/api/v1/items')` — Node polls, doesn't block.
3. FastAPI `async def` — awaits the DB, returns JSON.
4. BFF transforms the response (optionally) → React renders it.

A delay in step 2 caused by **sync** parsing of a 10 MB payload in the BFF hurts **every** BFF user, even though FastAPI itself is healthy. Monitoring: BFF latency vs. upstream latency ([`observability-basic`](../observability-basic/README.md) — later).

---

## Common mistakes

**"FastAPI is async, so Python is parallel."** One worker is one loop; a `def` endpoint with a sync ORM blocks it.

**"Node is async, so JS is multithreaded."** There's a single thread; I/O is parallelized by the OS/libuv.

**Mixing `requests` inside asyncio, or `fetch` without await in Express.** Both either block or leak an unhandled rejection.

**Duplicating business logic in the BFF "because async is convenient."** The contract still lives in FastAPI; the BFF is an adapter ([01-landscape.md](01-landscape.md)).

**Ignoring `--workers` vs. a single Node process.** Compare **one process to one process**, or **pod to pod**.

---

## Summary

Node's **libuv** and Python's **asyncio** solve the same problem: **lots of I/O on a single thread** without blocking while waiting on the network or disk. **`await`** in both languages suspends the coroutine/async function. **Tasks/Promises** schedule parallel work on a single loop. **Sync sleep/read** is an anti-pattern in both. **Thread pools / to_thread / worker_threads** exist for CPU work and legacy sync code. The shop mock-exams tie FastAPI `:8090` and the Node BFF together — one domain, two loop models, the same rule: don't block.

## Checklist

- [ ] Explain the asyncio/libuv parallel in one paragraph
- [ ] Know the JavaScript equivalent of `asyncio.gather`
- [ ] Understand how `time.sleep` in `async def` resembles a busy-wait in Node
- [ ] Know why `asyncio.to_thread` exists and when to reach for Node's worker_threads
- [ ] Understand why BFF and FastAPI scale via replicas, not "threads inside"
- [ ] Read through the [`python-async`](../python-async/README.md) table of contents

Next lesson: [08. Async I/O: patterns](08-async-io-patterns.md).
