# 24. Error handling and async handlers

## A scenario from work

After wiring the proxy to FastAPI `:8090`, some requests return 500 with HTML `<pre>Cannot read properties of undefined</pre>` instead of JSON. Logs show an unhandled promise rejection: `fetch failed`. An async handler threw, but Express 4 does **not** catch a rejected Promise automatically. SRE asks: “One error format for React, no stack trace outward, requestId on every response.”

Centralized error handling is a required part of a BFF between the browser and the Python backend.

## What you'll learn

- Why `async (req, res) => { await … }` breaks without a wrapper
- `next(err)` and error middleware with 4 parameters
- Error classes with `statusCode`
- Mapping upstream (FastAPI) errors into the BFF response
- 404 vs 500 vs 502 Bad Gateway
- What to show the client vs only in logs

---

## The problem: async without catch

```javascript
// DANGEROUS in Express 4
router.get("/:id", async (req, res) => {
  const item = await fetchItem(req.params.id); // reject → unhandled
  res.json(item);
});
```

On a `fetch` network error or `throw new Error()`, Promise reject does **not** reach error middleware.

**Solution 1 — try/catch:**

```javascript
router.get("/:id", async (req, res, next) => {
  try {
    const item = await fetchItem(req.params.id);
    res.json(item);
  } catch (err) {
    next(err);
  }
});
```

**Solution 2 — wrapper (recommended):**

```javascript
// src/middleware/asyncHandler.js
export function asyncHandler(fn) {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}

router.get("/:id", asyncHandler(async (req, res) => {
  const item = await fetchItem(req.params.id);
  res.json(item);
}));
```

---

## Error middleware

```javascript
// src/middleware/errorHandler.js
export function errorHandler(err, req, res, next) {
  const status = err.statusCode ?? err.status ?? 500;
  const isProd = process.env.NODE_ENV === "production";

  if (status >= 500) {
    console.error(err); // or pino — lesson 30
  }

  res.status(status).json({
    error: err.message ?? "Internal Server Error",
    code: err.code ?? "INTERNAL_ERROR",
    requestId: req.requestId,
    ...(isProd ? {} : { stack: err.stack }),
  });
}
```

Register **after** all routes and 404:

```javascript
app.use(notFoundHandler);
app.use(errorHandler);
```

Express identifies an error handler by the signature `(err, req, res, next)` — don't shorten it to 3 parameters.

---

## Application error classes

```javascript
// src/errors/AppError.js
export class AppError extends Error {
  constructor(message, statusCode = 500, code = "APP_ERROR") {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
  }
}

export class NotFoundError extends AppError {
  constructor(resource, id) {
    super(`${resource} not found: ${id}`, 404, "NOT_FOUND");
  }
}

export class BadGatewayError extends AppError {
  constructor(upstream) {
    super(`Upstream unavailable: ${upstream}`, 502, "BAD_GATEWAY");
  }
}
```

Usage in a handler:

```javascript
router.get("/:id", asyncHandler(async (req, res) => {
  const item = await fetchFromFastAPI(req.params.id);
  if (!item) {
    throw new NotFoundError("Item", req.params.id);
  }
  res.json(item);
}));
```

---

## Synchronous errors

A throw in a sync handler is caught by Express itself:

```javascript
router.get("/broken", (_req, _res) => {
  throw new Error("sync boom");
});
// → reaches errorHandler
```

But mixing styles without a wrapper is bad practice; use `asyncHandler` wherever there's `await`.

---

## Validation errors — 400

```javascript
router.post("/", asyncHandler(async (req, res) => {
  const { name, price } = req.body ?? {};
  if (!name || typeof price !== "number") {
    throw new AppError("Invalid body: name and numeric price required", 400, "VALIDATION_ERROR");
  }
  res.status(201).json({ name, price });
}));
```

Align the format with FastAPI (`detail` vs `error`) — the BFF can normalize ([33-proxy-aggregation.md](33-proxy-aggregation.md)).

---

## Mapping FastAPI errors

FastAPI `:8090` returns:

```json
{ "detail": "Item not found" }
```

BFF when `response.status === 404`:

```javascript
async function fetchItem(id) {
  const url = `${process.env.FASTAPI_URL}/api/v1/items/${id}`;
  const res = await fetch(url);
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    const message = body.detail ?? res.statusText;
    throw new AppError(message, res.status, "UPSTREAM_ERROR");
  }
  return res.json();
}
```

Don't forward the raw Python stack to the client.

---

## 404 handler vs NotFoundError

| Situation | Mechanism |
|----------|----------|
| URL not registered in Express | `notFoundHandler` → 404 |
| URL exists, resource not found upstream | `throw new NotFoundError` → errorHandler |

```javascript
app.use((_req, _res, next) => {
  next(new AppError("Route not found", 404, "ROUTE_NOT_FOUND"));
});
```

Both are valid; the main thing is a unified JSON format.

---

## next() after an error

```javascript
// BAD
catch (err) {
  res.status(500).json({ error: err.message });
  next(err); // attempt at a second response
}

// GOOD
catch (err) {
  next(err);
}
```

---

## Express 5 (reference)

Express 5 automatically forwards rejected promises from async handlers. In LTS mock-exams projects often still Express 4 — **don't rely** on the automatic behavior; use a wrapper.

---

## Full chain example

```javascript
import express from "express";
import { asyncHandler } from "./middleware/asyncHandler.js";
import { errorHandler } from "./middleware/errorHandler.js";
import { notFoundHandler } from "./middleware/notFound.js";
import itemsRouter from "./routes/items.js";

const app = express();
app.use(express.json());
app.use("/api/v1/items", itemsRouter);
app.use(notFoundHandler);
app.use(errorHandler);
```

---

## Related courses

- [22-middleware.md](22-middleware.md) — error handler order.
- [20-fastapi-client.md](20-fastapi-client.md) — fetch and statuses.
- [33-proxy-aggregation.md](33-proxy-aggregation.md) — 502, timeouts.
- [30-logging-pino.md](30-logging-pino.md) — log 5xx with context.
- [`api-design`](../api-design/README.md) — HTTP codes.

---

## Common mistakes

1. **Async handler without try/catch/wrapper** — unhandled rejection, hung request.

2. **Error handler with 3 parameters** — `(req, res, next)` won't catch `next(err)`.

3. **Stack trace in prod JSON** — leaks internal structure.

4. **Duplicate response and `next(err)`** — headers already sent.

5. **500 on upstream 404** — forgot to forward `res.status` from fetch.

6. **String instead of Error** — `next("bad")` works but loses the stack; use `AppError`.

7. **Not logging 5xx** — can't investigate an incident.

---

## Summary

In Express 4 a rejected Promise from an async handler does not reach error middleware without `catch` or `asyncHandler`. Error middleware is a 4-argument function, registered last. Application errors are classes with `statusCode`; FastAPI upstream maps into the same JSON format. The client gets message and code; stack — only in dev and logs.

---

## Checklist

- Why can `await fetch()` in a handler “lose” an error?
- How does `asyncHandler` work in one sentence?
- How many parameters does error middleware have, and what if there are three?
- How does 404 from `notFoundHandler` differ from `NotFoundError` in a proxy?
- What to return to the client when FastAPI is down (502)?
- Where to show `stack` — in prod or only dev?
- Why `requestId` in the error body?

Next lesson: [25. Body parser, static, CORS](25-express-body-cors.md).
