# 08. Asynchronous I/O: callbacks, Promises, async handlers

## A scenario from work

A legacy shop-catalog sync script is written with `fs.readFile` **callbacks** — three levels of "callback hell". In the rewrite PR everything is moved to **`async/await`**, but an Express route `async (req, res) => { ... }` without try/catch crashes the process with **unhandledRejection** on a 502 from FastAPI `:8090`. Code review: "Use `fs.promises` or `node:fs/promises`, don't promisify by hand." A junior wraps every callback in `new Promise` — it works, but it's noisy.

This chapter closes **phase 2** of nodejs-basic: from the event loop ([04–06](04-event-loop-libuv.md)) to **real I/O** — files, HTTP upstream, server handlers. It builds on Promises from [`javascript-basic/26-promises`](../javascript-basic/26-promises.md) and `async/await` from [27-async-await](../javascript-basic/27-async-await.md).

## What you'll learn

- **`fs.promises`** and async read/write without blocking the loop.
- The **callback → Promise** pattern (`util.promisify`, a wrapper).
- **`async` handlers** in an HTTP server and Express — errors and `next(err)`.
- Composition: `Promise.all`, sequential await.
- Antipatterns: sync fs, a forgotten catch, floating promises.
- The link to the BFF proxy to [`deploy/fastapi`](../../deploy/fastapi/README.md).

---

## The three eras of Node I/O

```text
1. Callbacks (error-first)     err => fs.readFile(path, cb)
2. Promises                      fs.promises.readFile(path)
3. async/await                   await fs.promises.readFile(path)
```

| Style | Pros | Cons |
|-------|-------|--------|
| Callback | no dependencies, streams native | nesting, error handling |
| Promise | chain, all/settle | boilerplate without async |
| async/await | reads like sync | try/catch, forgotten await |

Modern mock-exams code: **async/await** + **fs.promises** + **fetch** for HTTP.

---

## fs.promises: don't block the loop

```javascript
import { readFile, writeFile, mkdir } from "node:fs/promises";
import { join } from "node:path";

async function loadConfig(configDir) {
  const path = join(configDir, "shop-bff.json");
  const raw = await readFile(path, "utf8");
  return JSON.parse(raw);
}

async function saveSnapshot(dir, data) {
  await mkdir(dir, { recursive: true });
  const path = join(dir, `catalog-${Date.now()}.json`);
  await writeFile(path, JSON.stringify(data, null, 2), "utf8");
  return path;
}
```

While `await readFile` waits on disk, libuv is in the **poll** phase — other BFF requests can be handled ([04-event-loop-libuv.md](04-event-loop-libuv.md)).

**Avoid** on the request path:

```javascript
import { readFileSync } from "node:fs"; // blocks the loop
```

fs labs — [10-fs-path.md](10-fs-path.md), [11-lab-fs.md](11-lab-fs.md).

---

## Callback → Promise

The old error-first API:

```javascript
import { readFile as readFileCb } from "node:fs";

readFileCb("./data.json", "utf8", (err, content) => {
  if (err) {
    console.error(err);
    return;
  }
  console.log(JSON.parse(content));
});
```

### util.promisify (Node built-in)

```javascript
import { readFile } from "node:fs";
import { promisify } from "node:util";

const readFileAsync = promisify(readFile);

const content = await readFileAsync("./data.json", "utf8");
```

Works for functions with the signature `(err, result) =>`. For the **native promises API** you don't need promisify — use `fs.promises`.

### Manual wrapper (understanding the mechanics)

```javascript
function readFilePromise(path, encoding) {
  return new Promise((resolve, reject) => {
    readFileCb(path, encoding, (err, data) => {
      if (err) reject(err);
      else resolve(data);
    });
  });
}
```

This is how `promisify` works internally. In new code prefer **`fs.promises`**.

---

## fetch to FastAPI :8090

Node 18+ — global **`fetch`** (as in [javascript-basic/29-fetch](../javascript-basic/29-fetch.md)):

```javascript
const base = process.env.SHOP_API_URL ?? "http://localhost:8090";

async function getItems() {
  const res = await fetch(`${base}/api/v1/items`, {
    headers: { Accept: "application/json" },
    signal: AbortSignal.timeout(5000),
  });

  if (!res.ok) {
    throw new Error(`Upstream ${res.status}: ${res.statusText}`);
  }

  return res.json();
}
```

| Status | BFF action |
|--------|--------------|
| 200 | proxy/transform the JSON |
| 404 | 404 to the client or a fallback |
| 502/timeout | 503 + log; see [`api-design`](../api-design/README.md) |

REST contracts — the same shop as in Python [`deploy/fastapi`](../../deploy/fastapi/README.md).

---

## Composing async operations

**In parallel** — independent requests:

```javascript
async function getDashboardData() {
  const [items, health] = await Promise.all([
    fetch(`${base}/api/v1/items`).then((r) => r.json()),
    fetch(`${base}/health`).then((r) => r.json()),
  ]);
  return { items, health };
}
```

**Sequentially** — when you need the result of the previous step:

```javascript
async function getItemDetail(id) {
  const res = await fetch(`${base}/api/v1/items/${id}`);
  if (!res.ok) throw new Error(`Item ${id} not found`);
  return res.json();
}
```

**Promise.allSettled** — when partial success is OK (reports, batch sync).

---

## Async handlers in an HTTP server

### Raw `node:http` (preview [15-http-module.md](15-http-module.md))

```javascript
import { createServer } from "node:http";

createServer(async (req, res) => {
  try {
    if (req.url === "/health") {
      res.writeHead(200, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ ok: true }));
      return;
    }
    const data = await getItems();
    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(JSON.stringify(data));
  } catch (err) {
    console.error(err);
    res.writeHead(500, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ error: "internal_error" }));
  }
}).listen(3096);
```

**Without try/catch** a rejection from an `async` listener can become an **unhandledRejection** ([02-process.md](02-process.md)).

### Express (preview [21–24](21-express-routing.md))

```javascript
import express from "express";

const app = express();

app.get("/api/shop/items", async (req, res, next) => {
  try {
    const data = await getItems();
    res.json(data);
  } catch (err) {
    next(err);
  }
});

app.use((err, req, res, next) => {
  console.error(err);
  res.status(502).json({ error: "upstream_failed" });
});
```

### The "async wrapper" pattern

```javascript
function asyncHandler(fn) {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}

app.get("/api/shop/items", asyncHandler(async (req, res) => {
  const data = await getItems();
  res.json(data);
}));
```

---

## Callback hell → async refactor

**Before:**

```javascript
readFile("./a.json", "utf8", (err, a) => {
  if (err) return console.error(err);
  readFile("./b.json", "utf8", (err2, b) => {
    if (err2) return console.error(err2);
    const merged = { ...JSON.parse(a), ...JSON.parse(b) };
    console.log(merged);
  });
});
```

**After:**

```javascript
import { readFile } from "node:fs/promises";

try {
  const [a, b] = await Promise.all([
    readFile("./a.json", "utf8"),
    readFile("./b.json", "utf8"),
  ]);
  const merged = { ...JSON.parse(a), ...JSON.parse(b) };
  console.log(merged);
} catch (err) {
  console.error(err);
  process.exit(1);
}
```

The readability is closer to Python `aiofiles` — see [07-python-async-comparison.md](07-python-async-comparison.md).

---

## Floating promises and fire-and-forget

```javascript
// Bad in a request handler — the error is lost
logAccess(req.url); // async function without await

// Better
await logAccess(req.url);
// or explicit void with .catch
void logAccess(req.url).catch((err) => console.error(err));
```

---

## Link to the ecosystem

| Material | Link |
|----------|-------|
| [10-fs-path.md](10-fs-path.md) | path, sync vs async |
| [18-http-client.md](18-http-client.md) | headers, retry |
| [20-fastapi-client.md](20-fastapi-client.md) | the full shop client |
| [typescript-basic](../typescript-basic/README.md) | types for JSON from the API |
| [react-basic](../react-basic/README.md) | a client to the BFF |

---

## Common mistakes

**`async function` without `await` in a handler** — an unnecessary wrapper; errors in the sync part aren't in a Promise.

**Forgotten `await fetch`** — `res.json` on a Promise, not on data.

**`JSON.parse` on a huge string** — a CPU block after an async read; streams/workers.

**Swallowing upstream errors** — always log + the right status to the client.

**promisify something that's already a promise** — `fs.promises.readFile` is simpler.

**Parallel `Promise.all` with dependencies** — the second request needs the id from the first → sequential await.

---

## Summary

Asynchronous I/O in Node is **`fs.promises`**, **`fetch`**, **`async/await`** on top of Promises and libuv. Legacy callbacks — convert them via **promisify** or the native promise API. HTTP handlers **must** handle rejections (try/catch, `next(err)`, wrapper). Use **`Promise.all`** to compose parallel calls to `:8090`. Sync fs and CPU parse on the hot path block the BFF for all clients. Next — CJS/ESM modules and deeper `fs` (phase 3).

## Checklist

- [ ] You read a file via `fs.promises.readFile` with await
- [ ] You explained the error-first callback and `promisify`
- [ ] You wrote an async handler with try/catch and a 502 status
- [ ] You know when `Promise.all` vs sequential await
- [ ] You understand unhandledRejection in an async Express route
- [ ] You linked the BFF fetch to the FastAPI shop API

Next lesson: [09. CJS vs ESM in Node](09-modules-cjs-esm.md).
