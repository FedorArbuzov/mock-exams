# 26. Promises: then, catch, finally

## A scenario from work

You started two independent API requests sequentially — the page loads twice as slowly. One of the `then`s was left without a `.catch` — in the Node log there's an `UnhandledPromiseRejection`, and the process crashed. In the code there's `new Promise((resolve) => resolve(fs.readFileSync(...)))` — "a wrapper for the wrapper's sake". In review you're asked to replace nested callbacks with `Promise.all` and explain why `fetch` doesn't crash on HTTP 404.

A Promise is an object representing the **future** result of an asynchronous operation: success or error **once**.

## What you'll learn

- The three states of a Promise: pending, fulfilled, rejected
- Chains of `.then` / `.catch` / `.finally`
- How errors propagate down the chain
- `Promise.all`, `allSettled`, `race`, `any`
- Unhandled rejection and why you should always catch errors
- The "Promise constructor" antipattern for an already-async API
- The connection to the event loop (microtasks) and `async/await`

---

## Promise states

```javascript
const pending = new Promise((resolve, reject) => {
  // until resolve or reject is called — pending
});

const fulfilled = Promise.resolve(42);
const rejected = Promise.reject(new Error("fail"));
```

| State | Meaning |
|-----------|----------|
| **pending** | waiting |
| **fulfilled** | success, has a `value` |
| **rejected** | error, has a `reason` |

Once settled the state **doesn't change** — the callback won't be called again (unlike a broken callback API).

```javascript
const p = new Promise((resolve) => {
  setTimeout(() => resolve("done"), 100);
});

p.then((value) => console.log(value)); // after ~100 ms: done
```

`.then` registers a handler in the **microtask** queue ([24-event-loop.md](24-event-loop.md)).

---

## then, catch, finally

```javascript
fetchData()
  .then((data) => process(data))
  .then((result) => save(result))
  .catch((err) => console.error(err))
  .finally(() => console.log("cleanup"));
```

- **`then(onFulfilled, onRejected?)`** — returns a **new** Promise.
- **`catch(onRejected)`** — the same as `then(null, onRejected)`.
- **`finally(fn)`** — runs on any outcome; doesn't change the chain's value (except a throw inside).

```javascript
Promise.resolve(1)
  .then((v) => v + 1)
  .then((v) => {
    throw new Error("oops");
  })
  .catch((e) => {
    console.log(e.message); // oops
    return 0;
  })
  .then((v) => console.log(v)); // 0 — recovered after catch
```

---

## Returning from then: a value or a new Promise

```javascript
Promise.resolve(1)
  .then((v) => v * 2)           // returning a value → fulfilled with 2
  .then((v) => Promise.resolve(v + 1)) // returning a Promise → "flattening"
  .then((v) => console.log(v)); // 3
```

If there's a **throw** inside `then` — the next Promise is rejected:

```javascript
Promise.resolve()
  .then(() => {
    throw new Error("fail");
  })
  .catch((e) => console.log(e.message)); // fail
```

A synchronous throw in the **executor** of `new Promise` also produces a rejection:

```javascript
new Promise(() => {
  throw new Error("x");
}).catch((e) => console.log(e.message)); // x
```

---

## Error propagation and unhandled rejection

```javascript
Promise.reject(new Error("fail"))
  .then(() => console.log("skipped"))
  .catch((e) => console.log(e.message)); // fail — then is skipped
```

Without a `.catch` at the end of the chain:

```javascript
Promise.reject(new Error("unhandled"));
// Node: UnhandledPromiseRejectionWarning — in newer versions this can terminate the process
```

**Always** end chains with error handling or `try/catch` with `await`.

In Node for debugging:

```javascript
process.on("unhandledRejection", (reason) => {
  console.error(reason);
});
```

In production — logging and metrics, don't swallow silently.

---

## Creating a Promise

### A value already exists

```javascript
Promise.resolve(42);
Promise.reject(new Error("x"));
```

### Adapting a callback ([25-callbacks.md](25-callbacks.md))

```javascript
function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
```

### Antipattern: an unnecessary Promise

```javascript
// bad
new Promise((resolve) => {
  resolve(JSON.parse('{"a":1}'));
});

// good
JSON.parse('{"a":1}');

// bad — sync IO in the executor
new Promise((resolve) => {
  resolve(fs.readFileSync("huge.json", "utf-8"));
});

// good
import { readFile } from "node:fs/promises";
await readFile("huge.json", "utf-8");
```

Use `new Promise` only when you're **converting** a callback-style API into a Promise.

---

## Promise.all — in parallel, one error takes everything down

```javascript
const [user, config] = await Promise.all([
  fetchUser(1),
  loadConfig(),
]);
```

- Starts all promises **in parallel**.
- Waits for **all** to be fulfilled.
- On the **first** reject — the whole `all` is rejected (the rest are not cancelled automatically).

```javascript
await Promise.all([
  Promise.resolve(1),
  Promise.reject(new Error("b")),
  Promise.resolve(3),
]).catch((e) => console.log(e.message)); // b
```

For independent requests to FastAPI `:8090` ([29-fetch.md](29-fetch.md)) — a typical speedup pattern.

---

## Promise.allSettled — all results, no throw

```javascript
const results = await Promise.allSettled([
  fetch("/api/a"),
  fetch("/api/b"),
]);

for (const r of results) {
  if (r.status === "fulfilled") {
    console.log("ok", r.value);
  } else {
    console.error("fail", r.reason);
  }
}
```

Each element: `{ status: "fulfilled", value }` or `{ status: "rejected", reason }`.

Handy for "send 10 webhooks, report on each".

---

## Promise.race and Promise.any

**race** — the first settled (success **or** error):

```javascript
const winner = await Promise.race([
  delay(200).then(() => "slow"),
  delay(50).then(() => "fast"),
]);
console.log(winner); // fast
```

A timeout via race + reject:

```javascript
function withTimeout(promise, ms) {
  return Promise.race([
    promise,
    delay(ms).then(() => Promise.reject(new Error("timeout"))),
  ]);
}
```

**any** — the first **fulfilled**; if all are rejected — an `AggregateError`:

```javascript
await Promise.any([
  Promise.reject("a"),
  Promise.resolve("ok"),
]); // "ok"
```

---

## Comparison of combinators

| Method | Result | On error |
|-------|-----------|------------|
| `all` | array of values | rejects immediately |
| `allSettled` | array of statuses | doesn't throw |
| `race` | first settled | first reject too |
| `any` | first fulfilled | all reject → AggregateError |

---

## Promise and fetch

```javascript
const res = await fetch("http://localhost:8090/health");
```

`fetch` returns a **Response** Promise. A network failure → reject. HTTP 404/500 → a **fulfilled** Response with `ok: false` — a separate check ([29-fetch.md](29-fetch.md)).

---

## Chain vs async/await

Equivalent:

```javascript
// chain
getUser(id)
  .then((u) => getOrders(u.id))
  .then((orders) => orders.length);

// async/await
const u = await getUser(id);
const orders = await getOrders(u.id);
const count = orders.length;
```

`async/await` is syntactic sugar; under the hood it's Promises ([27-async-await.md](27-async-await.md)).

---

## Relation to the course

- [25-callbacks.md](25-callbacks.md) — where Promises grew from.
- [24-event-loop.md](24-event-loop.md) — `.then` = microtask.
- [27-async-await.md](27-async-await.md) — the next level of syntax.
- [28-lab-async.md](28-lab-async.md) — `delay`, `loadAll`, `retry`.
- [32-error-handling.md](32-error-handling.md) — error strategies in an application.

---

## Common mistakes

1. **Forgetting `return` in `then`** — the next step gets `undefined`.

```javascript
promise.then((data) => {
  save(data); // forgot return save(data)
});
```

2. **Sequential await where `Promise.all` is needed**.

3. **An empty `catch` without logging** — swallows bugs.

4. **Thinking `fetch` rejects on 404** — only network and CORS (in the browser).

5. **Nested `new Promise`** instead of a `then` chain or a single async.

6. **Not handling a rejection in fire-and-forget** — `doAsync();` without a `.catch`.

---

## Summary

A Promise is a one-time result of an async operation: pending → fulfilled or rejected. `then`/`catch`/`finally` chains build a pipeline; throw and reject go to `catch`. `Promise.all` speeds up independent tasks; `allSettled` gathers all outcomes; `race`/`any` — races and timeouts. Error handling is mandatory — an unhandled rejection is dangerous. `new Promise` is for adapting callbacks, not for sync code.

---

## Checklist

- Name the three states of a Promise
- What will `then` return if the callback throws an exception?
- The difference between `Promise.all` and `allSettled`?
- Why doesn't `fetch` on a 500 land in `catch` without an `ok` check?
- What is an unhandled rejection?
- When is `Promise.race` appropriate for a timeout?

Next lesson: [27. async/await](27-async-await.md).
