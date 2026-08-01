# 24. Event loop: browser and Node

## A scenario from work

The interface "freezes" for three seconds after a button click — a heavy loop ended up in the handler. In the test log the order of `console.log` doesn't match the order of the lines in the file: first `4`, then `3`, then `2`. A colleague says: "I put in `setTimeout(fn, 0)` — it should run right after the current line", but that's not the case. In an interview it's a classic: print the order of the letters in a mix of `setTimeout`, `Promise.then`, and synchronous code.

JavaScript is **single-threaded** for your code, but **asynchronous** thanks to task queues. The event loop is the model that explains **when** callbacks, timers, and `await` continuations run.

## What you'll learn

- Why long-running synchronous code blocks the UI and the whole Node process
- What the call stack is and how functions get onto it
- The difference between the **macrotask** and **microtask** queues
- The classic output order: `1, 4, 3, 2`
- What `setTimeout(fn, 0)` actually does
- How `async/await` relates to microtasks
- The differences between the browser and Node.js at a high level
- Practical takeaways: workers, don't block the loop, don't rely on a "zero" timer

---

## Single-threaded: one call stack

At any moment the engine runs **one** function until return (or an error). Nested calls stack up in the **call stack**:

```javascript
function c() {
  console.log("in c");
}
function b() {
  c();
}
function a() {
  b();
}
a();
```

```text
| c() |
| b() |
| a() |
| main |
```

While heavy work is spinning on the stack, **nothing else** from JS runs:

```javascript
console.log("start");
const t0 = Date.now();
while (Date.now() - t0 < 3000) {
  // empty loop for 3 seconds
}
console.log("end");
```

In the browser no animation is drawn and a click won't respond; in Node, other requests in the same process are not handled.

Network, timers, and disk reads in Node are delegated to the **environment** (browser Web APIs, libuv). When ready, the result doesn't "burst" into the middle of your function — a **callback** is placed in a queue that the event loop picks up once the stack is empty.

---

## Where asynchrony comes from

```javascript
console.log("1");

setTimeout(() => {
  console.log("2");
}, 0);

Promise.resolve().then(() => {
  console.log("3");
});

console.log("4");
```

**Output:** `1`, `4`, `3`, `2`.

Step by step:

1. `console.log("1")` — synchronous.
2. `setTimeout` registers the callback in the environment; after 0 ms the callback lands in the **macrotask** (task) queue.
3. `Promise.resolve().then(...)` places the callback in the **microtask** queue.
4. `console.log("4")` — synchronous.
5. The stack is empty → the engine **fully drains the microtasks** → `3` is printed.
6. The next **macrotask** is taken → `2` is printed.

**Rule (simplified for the browser and Node):** after each macrotask the engine runs **all** accumulated microtasks, then it may render a frame (browser), then the next macrotask.

---

## Microtasks vs macrotasks

| Type | Examples | When it runs |
|-----|---------|-------------------|
| **Synchronous code** | function calls, `console.log` | immediately, in the current stack |
| **Microtask** | `Promise.then/catch/finally`, `queueMicrotask`, `MutationObserver` | after the current stack, before the next macrotask |
| **Macrotask** | `setTimeout`, `setInterval`, I/O callback (Node), `setImmediate` (Node) | one task per loop "tick" (after microtasks) |

```javascript
queueMicrotask(() => console.log("micro"));
console.log("sync");
// sync, micro
```

`queueMicrotask` — the same priority as `Promise.then` ([26-promises.md](26-promises.md)).

### Why `setTimeout(fn, 0)` isn't "immediate"

The minimum delay in browsers is often **4 ms** or more (historically); even at 0 ms the callback is a **macrotask** and will run after the synchronous code and all microtasks.

Using `setTimeout(..., 0)` to "defer until later" is acceptable, but for "after the current Promises" `queueMicrotask` or `Promise.resolve().then(...)` is more precise.

---

## The Promise chain and microtasks

```javascript
Promise.resolve()
  .then(() => console.log("A"))
  .then(() => console.log("B"));

console.log("C");
// C, A, B
```

Each `then` queues a new microtask. The order within the chain is preserved.

A nested `then` inside a `then`:

```javascript
Promise.resolve().then(() => {
  console.log("1");
  Promise.resolve().then(() => console.log("2"));
  console.log("3");
});
// 1, 3, 2 — the inner then waits for the current wave of microtasks to drain
```

The details may differ in edge cases; for this course it's enough: **microtasks run in batches until the next macrotask**.

---

## `async/await` and the event loop

An `async` function runs **synchronously** up to the first `await`:

```javascript
async function demo() {
  console.log("inside start");
  await Promise.resolve();
  console.log("after await");
}

console.log("before");
demo();
console.log("after");
```

**Output:** `before`, `inside start`, `after`, `after await`.

After `await` the function's continuation is placed in the **microtask** queue ([27-async-await.md](27-async-await.md)).

---

## Browser vs Node.js

| Aspect | Browser | Node.js |
|--------|---------|---------|
| Long sync code | blocks the UI, the tab | blocks the whole process |
| Timers | Web APIs → task queue | libuv timers |
| I/O | fetch, XHR | fs, net, dns — libuv thread pool |
| Rendering | between tasks (rendering) | no UI |
| Extra phases | simplified model | timers, pending, poll, check, close (libuv) |

In Node the **poll** phase waits for I/O; `setImmediate` runs in the **check** phase after poll — interviews sometimes compare it with `setTimeout(0)`. For a junior it's enough: **I/O callbacks are macrotasks; Promises are microtasks**.

Comparison with Python asyncio — [python-async](../python-async/README.md); Node in depth — [nodejs-basic](../javascript-path.md).

---

## Blocking the event loop in Node

Dangerous synchronous operations:

- `JSON.parse` / `JSON.stringify` on megabyte-sized strings
- `fs.readFileSync`, `crypto.pbkdf2Sync`
- heavy CPU loops without chunking

**Solutions:**

- asynchronous APIs (`fs.promises`, streams)
- **worker threads** for CPU-bound work
- splitting work into chunks with `setImmediate` / `queueMicrotask` (rarely, a worker is better)

In the browser the analog is **Web Workers**.

---

## Practical takeaways for the developer

1. **Don't block the loop** — move out or chunk parsing, crypto, and big loops.

2. **Don't synchronize logic through the order of `setTimeout(0)`** — races and an unstable order.

3. **`Promise.then` before `setTimeout(0)`** — if you need "right after the current code", use microtasks deliberately.

4. **Errors in microtasks** — an unhandled reject in a Promise can produce an unhandled rejection ([26-promises.md](26-promises.md)).

5. **Tests** — `await Promise.resolve()` or `await new Promise(setImmediate)` in Node to "wait for all microtasks" (patterns in javascript-testing).

---

## Visual diagram (simplified)

```text
        ┌─────────────────┐
        │   Call Stack    │  ← synchronous JS
        └────────┬────────┘
                 │ stack empty
                 ▼
        ┌─────────────────┐
        │ Microtask Queue │  ← Promise, queueMicrotask
        └────────┬────────┘
                 │ drain all
                 ▼
        ┌─────────────────┐
        │ Macrotask Queue │  ← setTimeout, I/O, …
        └────────┬────────┘
                 │
                 └──► (browser: maybe render) ──► repeat
```

---

## Relation to the course

- [01-landscape.md](01-landscape.md) — first encounter with `setTimeout` and single-threadedness.
- [25-callbacks.md](25-callbacks.md) — callbacks from timers and I/O land in the queues.
- [26-promises.md](26-promises.md) — microtasks from `.then`.
- [27-async-await.md](27-async-await.md) — `await` and continuations.
- [28-lab-async.md](28-lab-async.md) — a lab on output order.

---

## Common mistakes

1. **Thinking `setTimeout(0)` runs "on the next line"** — only after sync + microtasks.

2. **Confusing "asynchronous" and "parallel"** — in one JS thread there's no parallelism; only I/O and workers run in parallel.

3. **An infinite microtask loop** — if every `then` queues another `then` without a macrotask, macrotasks and the UI can starve (rare, but possible in bugs).

4. **Heavy work in a `click` handler** — the user sees a freeze.

5. **Ignoring the Node/browser difference** — in Node one process serves many requests; blocking hits all of them.

---

## Summary

JavaScript runs synchronous code in one call stack. Asynchronous callbacks wait in queues: **microtasks** (Promise, `queueMicrotask`) are processed in full after each piece of synchronous code and before the next **macrotask** (`setTimeout`, I/O). That's why in the classic example the order is `1, 4, 3, 2`. `async/await` continues the function via microtasks. Long-running synchronous code blocks everything else — move it into workers or asynchronous APIs.

---

## Checklist

- Why does a `while` for 3 seconds block the interface?
- Reproduce the output order in the example with `setTimeout(0)` and `Promise.then`
- How does a microtask differ from a macrotask? Give two examples of each
- What will an `async` function print before and after the first `await` relative to the calling code?
- Why avoid `readFileSync` on large files in Node?
- Why are `queueMicrotask` and `Promise.then` close in priority?

Next lesson: [25. Callbacks](25-callbacks.md).
