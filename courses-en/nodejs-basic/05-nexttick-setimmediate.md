# 05. `process.nextTick`, `queueMicrotask` and `setImmediate`

## A scenario from work

BFF code review: a senior asks to replace `process.nextTick(() => sendMetrics())` with `setImmediate`, because "nextTick starves I/O". A junior asks: "Isn't `queueMicrotask` the same thing?" In the test logs the order `nextTick → Promise → setImmediate → setTimeout` doesn't match the expectations from [`javascript-basic/24-event-loop`](../javascript-basic/24-event-loop.md). In interviews this is a Node classic: explain the difference between **nextTick**, **microtask** and **setImmediate** in a single file.

This chapter goes deeper into [04-event-loop-libuv.md](04-event-loop-libuv.md). Three "run later" mechanisms, but **not in the same queue**. Confusion breaks metrics, tests, and debugging of async middleware before Express ([22-middleware.md](22-middleware.md)).

## What you'll learn

- The **`process.nextTick`** queue — priority and the risk of starvation.
- **`queueMicrotask`** and **`Promise.then`** — the same family of V8 microtasks.
- **`setImmediate`** vs **`setTimeout(0)`** — check vs timers phase.
- The output order in combined examples.
- When to use which in BFF application code.
- Antipatterns and the link to [`python-async`](../python-async/README.md) (`call_soon` / `await asyncio.sleep(0)`).

---

## Map of the queues (Node)

After the current synchronous code (call stack empty):

```text
1. process.nextTick queue     ← drain to the end (careful!)
2. microtask queue            ← Promise, queueMicrotask (to the end)
3. macrotask / libuv phase    ← setTimeout, I/O, setImmediate, …
```

Between libuv **phases** items 1–2 run again. That's why nextTick and microtasks are "everywhere between" macrotasks.

| API | Queue type | libuv phase |
|-----|-------------|------------|
| `process.nextTick(fn)` | nextTick | between any phases |
| `queueMicrotask(fn)` | microtask | after nextTick, before macrotask |
| `Promise.then(fn)` | microtask | same |
| `setTimeout(fn, 0)` | timer macrotask | timers |
| `setImmediate(fn)` | check macrotask | check (after poll) |

---

## process.nextTick

A historical Node API — runs **before** V8 microtasks:

```javascript
console.log("sync start");

process.nextTick(() => {
  console.log("nextTick 1");
  process.nextTick(() => console.log("nextTick 2"));
});

Promise.resolve().then(() => console.log("promise"));

console.log("sync end");
```

**Typical output:**

```text
sync start
sync end
nextTick 1
nextTick 2
promise
```

`nextTick 2` scheduled inside a nextTick runs **before** the Promise — because the nextTick queue doesn't hand control to microtasks until it's empty (in practice — be careful with recursion).

### Why nextTick in real code

- Emulating "async" before Promises in old code.
- Emitting an error asynchronously: `process.nextTick(() => { throw err; })`.
- **Not** for deferring heavy work — it starves I/O.

### Starvation (I/O starvation)

```javascript
function spinNextTick() {
  process.nextTick(spinNextTick);
}
spinNextTick();
// setImmediate and I/O never get control
```

You must not do this in production. To "defer to the next loop tick", prefer **`setImmediate`**.

---

## queueMicrotask and Promise

ECMAScript standard; in Node they behave as in the browser ([javascript-basic/24](../javascript-basic/24-event-loop.md)):

```javascript
queueMicrotask(() => console.log("microtask A"));
Promise.resolve().then(() => console.log("microtask B"));
console.log("sync");
// sync, microtask A, microtask B (registration order)
```

`async/await`:

```javascript
async function f() {
  console.log("f start");
  await Promise.resolve();
  console.log("f after await");
}

console.log("before f");
f();
console.log("after f");
// before f, f start, after f, f after await
```

The continuation after `await` is a microtask. For "run after the current sync code" in modern code, prefer **queueMicrotask** or **Promise**, not nextTick — unless there's a Node-specific reason.

---

## setImmediate vs setTimeout(0)

The classic example **from the main module** (not from an I/O callback):

```javascript
setTimeout(() => console.log("timeout"), 0);
setImmediate(() => console.log("immediate"));
console.log("sync");
```

The order is **`sync`**, then **not stably guaranteed** between `timeout` and `immediate` — it depends on the Node version, load, and phases. Often `timeout` first, sometimes `immediate`.

From an **I/O callback** (for example, after `fs.readFile`):

```javascript
import { readFile } from "node:fs";

readFile(import.meta.filename, () => {
  setTimeout(() => console.log("timeout"), 0);
  setImmediate(() => console.log("immediate"));
});
// Almost always: immediate, then timeout
```

Why: after the poll phase the loop moves to **check** (`setImmediate`) before going back to **timers**.

### When to use setImmediate

- Break a long sync loop into chunks (a legacy pattern before worker_threads).
- "After the current I/O" — defer without blocking poll with the next nextTick storm.

```javascript
let i = 0;
function chunk() {
  while (i < 1_000_000 && Date.now() - start < 5) {
    i++;
  }
  if (i < 1_000_000) setImmediate(chunk);
  else console.log("done", i);
}
const start = Date.now();
chunk();
```

---

## Summary example for interviews

```javascript
console.log("1");

setTimeout(() => console.log("2"), 0);

setImmediate(() => console.log("3"));

process.nextTick(() => console.log("4"));

Promise.resolve().then(() => console.log("5"));

queueMicrotask(() => console.log("6"));

console.log("7");
```

**The guaranteed part:**

```text
1
7
4          ← nextTick
5          ← Promise microtask
6          ← queueMicrotask (after 5, registration order)
2 and 3    ← timeout vs immediate — after everything above; the 2/3 order may vary in main
```

Compare with the classic **1, 4, 3, 2** from javascript-basic — there was no nextTick/setImmediate there; **5 and 6** are microtasks between sync and timers.

---

## Table: what to choose in the BFF

| Task | Recommendation |
|--------|--------------|
| After the current promise chain | `.then` / `await` |
| One-off after sync, ES standard | `queueMicrotask` |
| Node-only defer without starving I/O | `setImmediate` |
| Legacy / emit err async | `process.nextTick` (rarely) |
| Delay of N ms | `setTimeout` |
| Don't block the loop on CPU | worker_threads, not a nextTick loop |

---

## Comparison with Python asyncio (briefly)

| Node | asyncio (see [python-async](../python-async/README.md)) |
|------|-----------------------------------------------------------|
| `process.nextTick` | `loop.call_soon` (closer, but not identical) |
| `queueMicrotask` / Promise | `asyncio.create_task` / Future done callbacks |
| `await asyncio.sleep(0)` | yield control — closer to `setImmediate`, not to nextTick |
| Sync `time.sleep` in a coroutine | blocks the loop — like sync JS |

Details — [07-python-async-comparison.md](07-python-async-comparison.md).

---

## Common mistakes

**Treating nextTick and queueMicrotask as interchangeable.** nextTick is **always** before Promise; it can starve I/O.

**Recursive nextTick for an "async API".** Use Promise or `setImmediate`.

**Relying on the order of setTimeout vs setImmediate in main.** Flaky in tests; document it or fix the I/O context.

**Duplicating defer in three ways in one handler.** One style per project — readability.

**"setImmediate = setTimeout(0)".** Different libuv phases; in an I/O callback the order is different.

---

## Summary

**nextTick** is Node's highest-priority "deferred" queue, dangerous when abused. **Microtasks** (`Promise`, `queueMicrotask`) are the V8 standard, as in the browser. **setImmediate** is a check-phase macrotask after poll; for deferring CPU chunks it's preferable to nextTick. **setTimeout(0)** is the timers phase. In the BFF and Express, async/await is usually enough; nextTick/setImmediate are for edge cases and understanding logs. Lab [06-lab-event-loop.md](06-lab-event-loop.md) will reinforce output order and blocking.

## Checklist

- [ ] What's the order: sync, nextTick, Promise, setTimeout — in broad strokes?
- [ ] Why is recursive nextTick dangerous?
- [ ] How does setImmediate differ from setTimeout(0) after an fs callback?
- [ ] When to use queueMicrotask instead of nextTick?
- [ ] The link between async/await and microtasks
- [ ] You can read the summary example 1–7 without running it

Next lesson: [06. Lab: event loop](06-lab-event-loop.md).
