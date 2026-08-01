# 04. The event loop in Node: libuv phases

## A scenario from work

The BFF "freezes" for ten seconds — someone called `fs.readFileSync` on a large shop-catalog JSON in middleware. The load balancer marks the instance unhealthy, even though CPU isn't at 100%: the event loop is **busy** with synchronous code. In code review a junior adds `setImmediate` "so it doesn't block", without understanding the phases. In a test the log order is again `1, 4, 3, 2` — you already saw this in [`javascript-basic/24-event-loop`](../javascript-basic/24-event-loop.md), but a colleague from Python asks: "Where's your equivalent of `await asyncio.sleep(0)`?"

In the browser the event loop is described in terms of **macrotasks** and **microtasks**. In Node the V8 microtask model is the same, but **macrotasks** are broken down into **libuv phases** — a loop that manages timers, I/O, and `setImmediate`. Without this map you can't explain why the BFF stops accepting requests or why the order of `setTimeout` vs `setImmediate` depends on context.

## What you'll learn

- How **libuv** complements V8 in the Node.js runtime.
- The six **phases** of the event loop: timers, pending, poll, check, close, and "between phases".
- Where **microtasks** live in Node (Promise, `queueMicrotask`).
- A comparison with the **browser** model from javascript-basic/24.
- Why sync I/O and CPU loops **block** the whole process.
- Practical takeaways for an HTTP server and the BFF to `:8090`.

---

## V8 + libuv: two layers

```text
┌─────────────────────────────────────────┐
│  JavaScript (your code, one thread)     │
│  Call Stack                             │
└─────────────────┬───────────────────────┘
                  │
┌─────────────────▼───────────────────────┐
│  V8: microtasks (Promise, queueMicrotask)│
│  + process.nextTick (separate queue)     │
└─────────────────┬───────────────────────┘
                  │
┌─────────────────▼───────────────────────┐
│  libuv: event loop (macrotask phases)   │
│  + thread pool (part of fs, crypto, dns)│
└─────────────────────────────────────────┘
```

| Layer | Responsibility |
|------|-----------------|
| **V8** | Running JS, microtask queues |
| **libuv** | OS timers, network I/O (epoll/kqueue/IOCP), files, loop phases |
| **Thread pool** (default 4) | Some sync-looking async fs/crypto operations |

Network I/O (HTTP to FastAPI `:8090`) in Node does **not** block the JS thread — the callback arrives in the **poll** phase. A synchronous `while` or `readFileSync` blocks **everything**, including handling other BFF clients.

---

## Event loop phases (simplified model)

One libuv **tick** (simplified):

```text
   ┌──────────────┐
   │   timers     │  setTimeout, setInterval (due callbacks)
   └──────┬───────┘
          ▼
   ┌──────────────┐
   │ pending I/O  │  system deferred I/O callbacks
   └──────┬───────┘
          ▼
   ┌──────────────┐
   │    idle      │  internal libuv tasks
   └──────┬───────┘
          ▼
   ┌──────────────┐
   │    poll      │  new I/O events; fetch sockets; fs read complete
   └──────┬───────┘
          ▼
   ┌──────────────┐
   │    check     │  setImmediate callbacks
   └──────┬───────┘
          ▼
   ┌──────────────┐
   │ close cb     │  e.g. socket.on('close', …)
   └──────────────┘
```

Between **every** phase (and after poll) Node **drains the microtasks** and the **`process.nextTick` queue** — which is why a Promise `.then` can "outrun" `setTimeout(0)`.

### timers

Callbacks of timers whose threshold has elapsed. `setTimeout(fn, 0)` gets here **not instantly** — at the earliest after the current sync code and microtasks.

```javascript
setTimeout(() => console.log("timer phase"), 0);
```

### pending callbacks

Rare system-deferred operations (for example, some TCP errors). In practice think "system queue"; don't schedule your own code here.

### poll

The "warmest" phase for the backend:

- waits for new I/O (incoming HTTP on the BFF);
- runs callbacks of completed I/O (the FastAPI response arrived);
- may **block** waiting if there are no other tasks.

If the poll queue is empty and there's a `setImmediate`, the loop may move to **check** — hence the confusion about the order of `setTimeout(0)` vs `setImmediate` ([05-nexttick-setimmediate.md](05-nexttick-setimmediate.md)).

### check

**`setImmediate(fn)`** — "run after the current poll phase".

```javascript
setImmediate(() => console.log("check phase"));
```

### close callbacks

For example `socket.on('close', handler)`. Important for graceful shutdown ([02-process.md](02-process.md)).

---

## Microtasks in Node vs the browser

The model from [javascript-basic/24-event-loop](../javascript-basic/24-event-loop.md):

```javascript
console.log("1");
setTimeout(() => console.log("2"), 0);
Promise.resolve().then(() => console.log("3"));
console.log("4");
// 1, 4, 3, 2
```

| Concept | Browser | Node.js |
|-----------|---------|---------|
| Microtasks | Promise, queueMicrotask, MutationObserver | Promise, queueMicrotask |
| Macrotasks | setTimeout, I/O (simplified) | libuv phases + timers + I/O |
| Render | between tasks | no UI |
| `setImmediate` | no | check phase |
| `process.nextTick` | no | **before** microtasks (special queue) |

**Rule for the course:** after sync code → **all nextTick** → **all microtasks** → the next **macrotask/phase**.

`async/await` from javascript-basic [27-async-await](../javascript-basic/27-async-await.md) is syntactic sugar over Promise; the continuation after `await` = a microtask.

---

## Blocking the loop: the shop catalog

Bad BFF middleware:

```javascript
import { readFileSync } from "node:fs";

function loadCatalogSync() {
  const raw = readFileSync("./big-catalog.json", "utf8");
  return JSON.parse(raw);
}
```

While this code runs, **not a single** other request to the BFF is handled. Better:

```javascript
import { readFile } from "node:fs/promises";

async function loadCatalog() {
  const raw = await readFile("./big-catalog.json", "utf8");
  return JSON.parse(raw);
}
```

A heavy **JSON.parse** on 50 MB is still CPU-bound on the same thread — you need streams, worker threads, or offloading to the Python API ([08-async-io-patterns.md](08-async-io-patterns.md)).

Blocking demo:

```javascript
console.log("start");
const t0 = Date.now();
while (Date.now() - t0 < 3000) {
  /* busy wait */
}
console.log("end");
// 3 seconds — no HTTP, no timers
```

---

## I/O to FastAPI and the poll phase

When the BFF makes `fetch('http://localhost:8090/api/v1/items')`:

1. Sync code sends the request through libuv.
2. JS continues with other microtasks/macrotasks until the socket is ready.
3. The Promise callback/resolver fires — microtasks.
4. Your `await` continues — the Express handler returns JSON to the client.

This is **concurrency**, not JS **parallelism**. The OS and thread pool run in parallel; your code is one thread.

---

## Comparison with Python asyncio (preview)

| | Node libuv | asyncio |
|---|------------|---------|
| Model | callback / Promise / async-await | coroutines / await |
| Default loop | libuv | uvloop (optional) / selector |
| Sync blocking call | blocks the whole process | blocks the loop (needs an executor) |

Full comparison — [07-python-async-comparison.md](07-python-async-comparison.md).

---

## Practical takeaways for the BFF

1. **Don't use Sync APIs** on the hot path (`readFileSync`, `pbkdf2Sync`).
2. **Don't do CPU-heavy work** in a request handler without workers.
3. **Understand microtasks** — "log after the response" via `Promise.then` vs `setImmediate` can differ.
4. **Graceful shutdown** — stop accepting connections, wait for the poll queue ([02-process.md](02-process.md)).
5. **Monitor event loop lag** — the symptom "API is slow, CPU is low" is often a blocked loop.

---

## Common mistakes

**Thinking that "async function" = another thread.** Only I/O is offloaded; the body of an `async function` up to the first `await` is synchronous.

**Comparing Node only with the browser.** `setImmediate` and libuv phases are Node-specific; in interviews people confuse them with `setTimeout(0)`.

**`setTimeout(fn, 0)` as a "yield" under load.** Under load the order and delays are unstable; to break up CPU work use `setImmediate` or workers.

**Ignoring thread pool exhaustion.** 4 threads by default — many sync `bcrypt` calls in parallel — the libuv queue grows.

**Confusing unhandledRejection with "the loop hung".** The loop keeps spinning; a promise was simply rejected without a catch.

---

## Summary

The Node event loop = **V8 microtasks** + **libuv phases** (timers → pending → poll → check → close). I/O to FastAPI and BFF clients is handled asynchronously through poll; synchronous and CPU-bound code blocks the whole process. The browser 1-4-3-2 model still holds for Promise vs `setTimeout`; Node adds `setImmediate` and `nextTick`. The next lesson covers the order of these queues in detail.

## Checklist

- [ ] Name the five libuv phases and what runs in timers and check
- [ ] Why `readFileSync` in Express middleware is dangerous
- [ ] Reproduce the order 1, 4, 3, 2 and explain microtasks
- [ ] Why the poll phase matters for an HTTP server
- [ ] The difference between a browser macrotask and libuv phases in Node (in broad strokes)
- [ ] The link to javascript-basic/24 and python-async

Next lesson: [05. nextTick, queueMicrotask and setImmediate](05-nexttick-setimmediate.md).
