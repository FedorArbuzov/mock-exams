# 25. Callbacks and callback hell

## A scenario from work

In a legacy Node module a file is read like this: `readFile(path, (err, data) => { ... })`. You need to read a config, then from it a list of users, then the orders of the first user. The code drifts right to fifteen levels of nesting — **callback hell**. In production a callback fired twice, and the balance was debited twice. You're writing the new service with `async/await`, but `stream.on("data", ...)` and `addEventListener` are still callbacks.

Callbacks are the foundation of asynchrony in JavaScript. Promises and `async/await` are built **on top** of them, but haven't fully replaced them.

## What you'll learn

- What a callback is and Node's `(err, result)` convention
- What callback hell looks like and why it's a problem
- Inversion of control and the risks of "someone else's" call
- Events as a subscription to callbacks
- When callbacks are appropriate in modern code
- How to wrap a callback API in a Promise
- The connection to the event loop and the next lessons

---

## A callback: a function that will be called later

A **callback** is a function passed to other code to be called **after** an event or the completion of an operation.

```javascript
function greetLater(name, callback) {
  console.log("scheduling...");
  setTimeout(() => {
    callback(`Hello, ${name}`);
  }, 100);
}

greetLater("Ann", (message) => {
  console.log(message);
});
```

**Output:**

```text
scheduling...
Hello, Ann
```

The `greetLater` call returned immediately; the callback ran later via the event loop ([24-event-loop.md](24-event-loop.md)).

Functions are first-class objects ([10-functions.md](10-functions.md)); a callback is just passing a function as a value.

---

## The Node.js convention: `(err, data)`

Historically, Node's asynchronous APIs use an **error-first callback**:

```javascript
function loadFile(path, callback) {
  // pseudocode of the internals
  readFromDisk(path, (diskErr, raw) => {
    if (diskErr) {
      return callback(diskErr);
    }
    callback(null, raw);
  });
}

loadFile("config.json", (err, data) => {
  if (err) {
    console.error("Failed:", err.message);
    return;
  }
  console.log("OK:", data);
});
```

| First argument | Meaning |
|-----------------|----------|
| `err` truthy | error, don't use `data` |
| `err` null/undefined | success, `data` is the result |

**Always** check `err` first — otherwise parsing `data` on a failed operation produces secondary errors.

The modern replacement in Node:

```javascript
import { readFile } from "node:fs/promises";

const data = await readFile("config.json", "utf-8");
```

Under the hood `fs/promises` wraps the callback-based `fs.readFile`.

---

## Callback hell (the pyramid of doom)

Three dependent asynchronous steps without Promises:

```javascript
function getUser(id, cb) {
  setTimeout(() => cb(null, { id, name: "Ann" }), 50);
}
function getOrders(userId, cb) {
  setTimeout(() => cb(null, [{ id: 101 }]), 50);
}
function getOrderDetail(orderId, cb) {
  setTimeout(() => cb(null, { total: 99 }), 50);
}

getUser(1, (err, user) => {
  if (err) return handle(err);
  getOrders(user.id, (err, orders) => {
    if (err) return handle(err);
    getOrderDetail(orders[0].id, (err, detail) => {
      if (err) return handle(err);
      console.log(user.name, detail.total);
    });
  });
});
```

**Problems:**

1. **Readability** — nesting grows with each step.
2. **Error handling** — `if (err)` at every level or a single `handle` — easy to forget.
3. **Parallelism** — hard to start two requests and wait for both without an extra library.
4. **Debugging** — an error stack through callbacks is less convenient than with `async/await`.

Refactoring to Promises ([26-promises.md](26-promises.md)):

```javascript
getUser(1)
  .then((user) => getOrders(user.id))
  .then((orders) => getOrderDetail(orders[0].id))
  .then((detail) => console.log(detail))
  .catch(handle);
```

---

## Inversion of control

By passing a callback, you hand over control of **when** and **how many times** it's called:

```javascript
function brokenApi(cb) {
  cb(null, "ok");
  cb(null, "ok again"); // a double call — a bug in the library
}
```

Risks:

- the callback is **never** called (a hang);
- called **more than once**;
- called synchronously when you expected async (a contract violation).

With a Promise the state goes **pending → settled** once — some of these problems go away ([26-promises.md](26-promises.md)).

---

## Events: callbacks by subscription

The "publisher — subscriber" model:

```javascript
const button = document.querySelector("button");

function onClick(event) {
  console.log("clicked", event.type);
}

button.addEventListener("click", onClick);
// later:
button.removeEventListener("click", onClick);
```

In Node:

```javascript
import { EventEmitter } from "node:events";

const emitter = new EventEmitter();
emitter.on("data", (chunk) => console.log(chunk));
emitter.emit("data", "hello");
```

Unsubscribing matters — otherwise memory leaks via closures ([12-closures.md](12-closures.md)), especially in a SPA.

---

## Callbacks in timers and I/O

```javascript
console.log("A");
setTimeout(() => console.log("B"), 0);
console.log("C");
// A, C, B
```

A timer callback is a macrotask; it doesn't run "between A and C".

A file stream (conceptually):

```javascript
stream.on("data", (chunk) => {
  processChunk(chunk);
});
stream.on("end", () => {
  console.log("done");
});
```

Each chunk is a separate callback; backpressure and errors are handled separately (nodejs-basic).

---

## Wrapping callback → Promise

When an API is callback-only:

```javascript
import { readFile } from "node:fs";
import { promisify } from "node:util";

const readFileAsync = promisify(readFile);

const data = await readFileAsync("config.json", "utf-8");
```

Or manually:

```javascript
function readFilePromise(path, encoding) {
  return new Promise((resolve, reject) => {
    readFile(path, encoding, (err, data) => {
      if (err) reject(err);
      else resolve(data);
    });
  });
}
```

**Rule:** use `new Promise` only to adapt legacy; don't wrap already-synchronous code "for beauty" ([26-promises.md](26-promises.md)).

---

## When callbacks are still appropriate

| Situation | Why a callback |
|----------|----------------|
| DOM events | the browser's native model |
| Streams (Node) | many small `data` events |
| Old npm modules | no Promise API |
| `setTimeout` / `setImmediate` | a simple deferred task |

New application code on HTTP chains — **async/await** + `fetch` ([27-async-await.md](27-async-await.md), [29-fetch.md](29-fetch.md)).

---

## Comparison of styles

| Aspect | Callbacks | Promises / async |
|--------|---------|------------------|
| Nesting | a pyramid | linear code |
| Errors | err at every level | one `catch` / `try/catch` |
| Repeated call | a possible bug | settled once |
| Cancellation | manual | `AbortController` + fetch |
| Readability | drops with depth | higher |

---

## Relation to the course

- [24-event-loop.md](24-event-loop.md) — when a callback is called.
- [26-promises.md](26-promises.md) — the next layer of abstraction.
- [28-lab-async.md](28-lab-async.md) — `delay`, fake fetch, retry.
- [python-async](../python-async/README.md) — callbacks vs `async def` in Python.

In mock-exams, FastAPI on `:8090` responds synchronously from the client's point of view, but the client JS still receives the response via a `fetch` callback/Promise.

---

## Common mistakes

1. **Forgetting to check `err`** in a Node-style API.

2. **Callback hell instead of Promise.all** — independent requests nested sequentially.

3. **Assuming exactly one call** of the callback — guard with a flag or move to a Promise.

4. **Mixing return and a callback** in one function — the caller doesn't know which to use.

5. **Not unsubscribing from events** — leaks on long-lived pages.

6. **Deep nesting instead of named functions** — sometimes `function onUser(err, user) { ... }` at the top level already helps before Promises.

---

## Summary

A callback is a function called later on the completion of an operation. Node popularized `(err, result)`. Nested dependent steps lead to callback hell and duplicated error handling. Inversion of control hands responsibility for the call to the library. Events are callbacks by subscription. Modern application code prefers Promises and `async/await`, but streams, the DOM, and legacy npm remain on callbacks — you need to read them and promisify when necessary.

---

## Checklist

- What does the first argument `(err, data)` mean in Node?
- Name three problems with callback hell
- What is inversion of control in two sentences?
- How is `readFile` from `fs/promises` related to the callback-based `readFile`?
- Why does `removeEventListener` matter?
- When would you still write a callback rather than an `async` function?

Next lesson: [26. Promises](26-promises.md).
