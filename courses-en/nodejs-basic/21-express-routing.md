# 21. Express: routes and Router

## Scenario from the field

The team is building a BFF for a React catalog admin panel. A junior dev copies `app.get('/users', ...)` and `app.post('/users', ...)` straight out of a tutorial into `index.js` — a week later that file is 400 lines long and every PR merge-conflicts with the last. The tech lead asks: "Pull shop into its own module, version the API as `/api/v1`, keep health at the root." At code review someone asks: "Why does `GET /api/v1/items` return 404 when the handler is right there?" — turns out there's a typo in the path and no `Router` mounted with the right prefix.

Express is the de facto standard HTTP server for Node.js BFFs and internal APIs. In mock-exams, the BFF on `:3096` proxies requests to FastAPI on `:8090`; routes need to stay predictable and modular.

## What you'll learn

- A minimal Express app and the request lifecycle
- HTTP methods, paths, `:id` params, and `?page=` query strings
- `express.Router()` and mounting prefixes
- Route registration order and "catch-all" routes
- The difference between `app.use` and `app.get` for a given path
- Structuring `/api/v1` for the shop track
- Common mistakes: trailing slashes, duplicate paths, 404s with no handler

---

## Minimal server

```javascript
// src/app.js
import express from "express";

const app = express();
const PORT = process.env.PORT ?? 3096;

app.get("/health", (_req, res) => {
  res.status(200).json({ status: "ok", service: "shop-bff" });
});

app.listen(PORT, () => {
  console.log(`BFF listening on http://localhost:${PORT}`);
});
```

Run it (from [`examples/`](examples/package.json)):

```bash
node src/app.js
curl http://localhost:3096/health
```

Express doesn't parse the JSON body on its own — that's a middleware's job ([25-express-body-cors.md](25-express-body-cors.md)). Right now what matters is understanding **how a URL maps to a handler**.

---

## Routes by HTTP method

```javascript
// Stubs for shop — proxied to FastAPI later
app.get("/api/v1/items", (_req, res) => {
  res.json({ items: [], source: "stub" });
});

app.get("/api/v1/items/:id", (req, res) => {
  const { id } = req.params;
  res.json({ id, name: "Stub item", price: 0 });
});

app.post("/api/v1/items", (_req, res) => {
  res.status(201).json({ id: "new-stub", created: true });
});
```

| Component | Where it lives | Example |
|-----------|-----------|--------|
| Path params | `req.params` | `/items/:id` → `id=42` |
| Query string | `req.query` | `/items?page=2&limit=10` |
| Body | `req.body` | after `express.json()` |

```javascript
app.get("/api/v1/items", (req, res) => {
  const page = Number(req.query.page ?? 1);
  const limit = Number(req.query.limit ?? 20);
  res.json({ page, limit, items: [] });
});
```

**Important:** query values are always strings (or arrays of strings). Cast types explicitly.

---

## express.Router — modular routes

One file per domain: `items`, `orders`, `health`.

```javascript
// src/routes/items.js
import { Router } from "express";

const itemsRouter = Router();

itemsRouter.get("/", (_req, res) => {
  res.json({ items: [] });
});

itemsRouter.get("/:id", (req, res) => {
  res.json({ id: req.params.id });
});

itemsRouter.post("/", (_req, res) => {
  res.status(201).json({ id: "1" });
});

export default itemsRouter;
```

Mounting it with a prefix:

```javascript
// src/app.js
import itemsRouter from "./routes/items.js";

app.use("/api/v1/items", itemsRouter);
// GET /api/v1/items      → itemsRouter.get("/")
// GET /api/v1/items/42   → itemsRouter.get("/:id")
```

A Router is a "mini app" with its own middleware chain ([22-middleware.md](22-middleware.md)).

---

## API versioning

The `/api/v1` prefix is a contract with the React client. When you make a breaking change, add `/api/v2` and keep the old route running alongside it:

```javascript
import itemsV1 from "./routes/v1/items.js";
import itemsV2 from "./routes/v2/items.js";

app.use("/api/v1/items", itemsV1);
app.use("/api/v2/items", itemsV2);
```

Don't mix versions inside a single Router without a clear folder structure — reviewing it becomes a nightmare.

---

## Registration order

Express checks routes **in registration order**. The first matching handler wins.

```javascript
// BAD: the parametric route swallows "search"
itemsRouter.get("/:id", handlerById);
itemsRouter.get("/search", handlerSearch); // never called for /search

// GOOD: specific paths first
itemsRouter.get("/search", handlerSearch);
itemsRouter.get("/:id", handlerById);
```

A BFF doesn't need an SPA catch-all — just explicit API paths and a 404 ([24-express-errors.md](24-express-errors.md)).

---

## app.use vs app.METHOD

| Call | Methods | Purpose |
|-------|--------|------------|
| `app.get(path, fn)` | GET only | reads |
| `app.post(path, fn)` | POST only | creates |
| `app.use(path, router)` | all methods | mounts a Router or middleware |
| `app.use(fn)` | all methods, all paths | global middleware |

```javascript
// middleware for all of /api/v1/*
app.use("/api/v1", (req, _res, next) => {
  req.apiVersion = 1;
  next();
});
```

---

## Responses: status and JSON

```javascript
itemsRouter.get("/:id", (req, res) => {
  const id = req.params.id;
  if (id === "missing") {
    return res.status(404).json({ error: "Item not found", id });
  }
  return res.status(200).json({ id, name: "Keyboard" });
});
```

Use `return` after `res.json`, otherwise code further down might send a second response → `Error: Cannot set headers after they are sent`.

---

## Connection to the HTTP module

In [15-http-module.md](15-http-module.md) you parsed the URL and method by hand. Express does the same thing under the hood via `path-to-regexp`:

```text
Client: GET /api/v1/items/5?page=1
         ↓
Express: method === 'GET', path match, req.params.id === '5'
         ↓
Handler → res.json(...)
```

---

## Structure for lab 23

```text
examples/src/
  app.js
  routes/
    health.js
    items.js
```

```javascript
// src/routes/health.js
import { Router } from "express";
const router = Router();
router.get("/", (_req, res) => res.json({ status: "ok" }));
export default router;

// app.js
import healthRouter from "./routes/health.js";
app.use("/health", healthRouter);
```

---

## Connections in this course

- [17-url-routing.md](17-url-routing.md) — routing without a framework.
- [22-middleware.md](22-middleware.md) — the chain before and after the handler.
- [23-lab-express.md](23-lab-express.md) — hands-on.
- [26-lab-express-shop.md](26-lab-express-shop.md) — shop routes + stub proxy.
- [`deploy/fastapi`](../../deploy/fastapi/README.md) — the target API on `:8090`.

---

## Common mistakes

1. **Forgetting `export default router`** — it comes back `undefined` on import, and the server crashes at `app.use`.

2. **Duplicating the prefix** — a `Router` with `get("/api/v1/items")` mounted via `app.use("/api/v1/items")` gives you `/api/v1/items/api/v1/items`.

3. **Confusing `/items` and `/items/`** — `strict routing` is off by default; clients may send either. Agree on a convention within the team.

4. **Not returning after `res.send`** — a double response and a 500 in the logs.

5. **Treating query values as numbers without parsing** — `"10" + 5 === "105"` in JS.

6. **A parametric route before a static one** — `/search` ends up handled by `/:id` with `id=search`.

7. **ESM: forgetting `"type": "module"`** in `package.json` — `import` won't work.

---

## Summary

Express matches an HTTP method and path to a handler function. `express.Router()` groups a domain's routes and mounts via `app.use(prefix, router)`. API versions live in the `/api/v1` prefix. Path parameters come from `req.params`, query strings from `req.query`. Registration order matters: specific paths must come before `:id`. For the mock-exams BFF, health sits at the root and shop lives under `/api/v1/items`.

---

## Checklist

- How does `app.get` differ from `app.use` for the same path?
- How do you mount `itemsRouter` so that `GET /api/v1/items/7` reaches `get("/:id")`?
- Where do you read `page` from `GET /items?page=2`?
- Why might `GET /search` return `{ id: "search" }`?
- Why put `return` before `res.status(404).json(...)`?
- What port does the example BFF use by default?
- What happens if you call `res.json()` twice in the same handler?

Next lesson: [22. Middleware: chain and order](22-middleware.md).
