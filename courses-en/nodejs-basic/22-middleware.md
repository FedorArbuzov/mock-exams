# 22. Middleware: chain and order

## A scenario from work

After deploying the BFF to staging, React gets CORS errors, and the logs show “Cannot set headers after they are sent.” A senior looks at `app.js`: logging middleware sits **after** the error handler, the auth stub calls `res.json` without `next()`, and the JSON parser is mounted only on `/api/v1/items`, not `/api/v1/orders`. At standup: “Middleware isn't magic — it's a pipeline. Order is part of the contract.”

In Express every request goes through a **chain of functions** `(req, res, next) => …`. Understanding order is what separates a working BFF from a chaotic 500-line `index.js`.

## What you'll learn

- Middleware signature and the role of `next()`
- Global vs router-level middleware
- Types: logging, parsing, auth stub, error handler
- Why error middleware has 4 arguments `(err, req, res, next)`
- A request that “hangs” without `next()` or a response
- Registration order in a recommended BFF

---

## Anatomy of middleware

```javascript
function requestLogger(req, res, next) {
  const start = Date.now();
  res.on("finish", () => {
    const ms = Date.now() - start;
    console.log(`${req.method} ${req.url} ${res.statusCode} ${ms}ms`);
  });
  next(); // pass control to the next layer
}
```

Rules:

1. Call **`next()`** — pass further (if you haven't sent a response).
2. Or **`res.send` / `res.json` / `res.end`** — finish the request.
3. **`next(err)`** — pass the error to error middleware ([24-express-errors.md](24-express-errors.md)).

Without `next()` and without a response the client waits until **timeout** — the classic “hung” request.

---

## Registration: order matters

```javascript
import express from "express";
import requestLogger from "./middleware/requestLogger.js";

const app = express();

// 1. Logging — first (sees all requests)
app.use(requestLogger);

// 2. Body parsers — before routes that need req.body
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// 3. CORS — before routes (see lesson 25)
// app.use(cors({ origin: "http://localhost:5173" }));

// 4. Routes
app.use("/health", healthRouter);
app.use("/api/v1/items", itemsRouter);

// 5. 404 — after all routes
app.use((_req, res) => {
  res.status(404).json({ error: "Not found" });
});

// 6. Error handler — last
app.use((err, req, res, next) => {
  console.error(err);
  res.status(err.status ?? 500).json({ error: err.message ?? "Internal error" });
});
```

```text
Request → logger → json parser → cors → route handler → (404?) → (error?)
```

---

## app.use without a path — all URLs

```javascript
app.use((req, _res, next) => {
  req.requestId = crypto.randomUUID();
  next();
});
```

With a path — only that prefix and nested paths:

```javascript
app.use("/api/v1", apiTimingMiddleware);
// runs for /api/v1/items and /api/v1/orders
```

---

## Middleware on a Router

```javascript
// src/routes/items.js
import { Router } from "express";

const router = Router();

router.use((req, _res, next) => {
  req.resource = "items";
  next();
});

router.get("/", listItems);
router.get("/:id", getItem);

export default router;
```

Router-level middleware does not touch `/health` — domain isolation.

---

## Auth stub for labs

At the basic BFF stage you often check a header without a real JWT:

```javascript
// src/middleware/requireApiKey.js
export function requireApiKey(req, res, next) {
  const key = req.headers["x-api-key"];
  if (!key || key !== process.env.INTERNAL_API_KEY) {
    return res.status(401).json({ error: "Unauthorized" });
  }
  next();
}

// app.js — only on protected routes
app.use("/api/v1/admin", requireApiKey, adminRouter);
```

**Mistake:** calling `next()` after `res.status(401).json` — double handling.

---

## Middleware that finishes the request

```javascript
export function cacheControl(seconds) {
  return (_req, res, next) => {
    res.set("Cache-Control", `public, max-age=${seconds}`);
    next();
  };
}

router.get("/", cacheControl(60), listItems);
```

Express allows a **chain** of middleware on one route: left to right, then the handler.

---

## Error-handling middleware

Express recognizes an error handler by **four parameters**:

```javascript
app.use((err, req, res, next) => {
  // err came from next(err) or from an async wrapper
  const status = err.statusCode ?? err.status ?? 500;
  res.status(status).json({
    error: err.message,
    requestId: req.requestId,
  });
});
```

Ordinary middleware with three parameters will **not** receive `next(err)` — only the 4-arg handler.

---

## Typical mock-exams BFF “pipeline”

| # | Middleware | Why |
|---|------------|-------|
| 1 | pino-http / requestLogger | request tracing ([30-logging-pino.md](30-logging-pino.md)) |
| 2 | express.json | POST/PATCH bodies |
| 3 | cors | React `:5173` → BFF `:3096` |
| 4 | routes | business logic / proxy |
| 5 | notFound | unified JSON 404 |
| 6 | errorHandler | no stack trace outward in prod |

---

## next() and async

By itself `async (req, res, next) => { await ... }` does **not** catch rejects — you need try/catch or a wrapper ([24-express-errors.md](24-express-errors.md)):

```javascript
export function asyncHandler(fn) {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}

router.get("/", asyncHandler(async (req, res) => {
  const data = await fetchItems();
  res.json(data);
}));
```

---

## Debugging: where did the request get stuck?

1. Add temporary middleware with `console.log("after json")`.
2. Check that `next()` is called in every branch.
3. Make sure the error handler is **after** routes.
4. Check OPTIONS for CORS — preflight also goes through the chain.

---

## Comparison with “manual” HTTP

In [16-lab-http-server.md](16-lab-http-server.md) you decided yourself when to read the body. Express middleware **decomposes** that logic: one module — one job. Same layering idea as FastAPI dependencies — but on functions and registration order.

---

## Related courses

- [21-express-routing.md](21-express-routing.md) — Router and mounting.
- [24-express-errors.md](24-express-errors.md) — async and error middleware.
- [25-express-body-cors.md](25-express-body-cors.md) — `express.json`, cors.
- [31-lab-logging.md](31-lab-logging.md) — logging middleware.
- [35-project-structure.md](35-project-structure.md) — `src/middleware/` folder.

---

## Common mistakes

1. **Forgot `next()`** — request hangs, client timeout.

2. **Called `next()` after responding** — “Cannot set headers after they are sent.”

3. **Error handler not last** — errors aren't caught.

4. **Error handler with 3 parameters** — Express treats it as ordinary middleware.

5. **JSON parser after routes** — `req.body` undefined on POST.

6. **CORS after the 404 handler** — preflight may not get headers.

7. **Middleware with heavy sync code** — blocks the event loop ([04-event-loop-libuv.md](04-event-loop-libuv.md)).

8. **Duplicating `express.json()`** — extra work; once globally.

---

## Summary

Express middleware is `(req, res, next)` functions that form a pipeline. Registration order determines what each handler sees: logs and parsers first, then routes, then 404 and the error handler. `next()` passes control; `next(err)` goes to the error handler (4 arguments). A Router can have its own sub-pipeline. The mock-exams BFF keeps auth stub, CORS, and JSON at the top level, domain logic in the Router.

---

## Checklist

- What happens if middleware neither calls `next()` nor sends a response?
- How many arguments does error-handling middleware have and why?
- Why must `express.json()` come before `POST /api/v1/items`?
- How does router-level middleware differ from `app.use` without a path?
- How do you pass an error from an `async` handler into error middleware?
- Where in the chain should the 404 handler sit?
- Why `return` before `res.status(401).json` in auth middleware?

Next lesson: [23. Lab: basic Express](23-lab-express.md).
