# 35. Node project structure

## A scenario from work

The BFF repo grew from a single `app.js` into a mess: config in three files, a “temporary” fetch sitting in an 80-line route, tests can't find the entry point. The architect proposes a **layered layout** like [`fastapi`](../fastapi/README.md): thin routes, services for integrations, middleware for cross-cutting concerns, config as a single point. Before the capstone and [`nodejs-intermediate`](../javascript-path.md) we lock down the `examples/src/` structure.

## What you'll learn

- Recommended BFF directory tree
- Responsibilities of `routes`, `middleware`, `config`, `services`
- Entry point `app.js` vs `server.js`
- File naming and barrel exports
- What not to put in git
- Evolution toward intermediate (controllers, tests)

---

## Target mock-exams tree

```text
courses/nodejs-basic/examples/
  package.json
  .env.example          # in git
  .env                  # local, gitignore
  README.md
  scripts/
    validate-config.mjs
  src/
    app.js              # express app, middleware chain, routes mount
    server.js           # listen (optional split)
    config/
      index.js          # validated env export
      upstream.js       # URL helpers (optional)
    lib/
      logger.js         # pino instance
    middleware/
      httpLogger.js
      asyncHandler.js
      errorHandler.js
      notFound.js
    routes/
      health.js
      items.js
      index.js          # optional: aggregate routers
    services/
      upstreamClient.js # fetch + timeout + parse
      itemsService.js   # optional domain orchestration
    errors/
      AppError.js
  lab/                    # starter lab scaffolds
  solutions/              # references after you try
```

Principle: **imports flow downward** — routes → services → config/lib; config does not import routes.

---

## src/app.js — composition root

Builds the app **without** `listen` (convenient for tests):

```javascript
// src/app.js
import express from "express";
import { httpLogger } from "./middleware/httpLogger.js";
import { notFoundHandler } from "./middleware/notFound.js";
import { errorHandler } from "./middleware/errorHandler.js";
import { registerRoutes } from "./routes/index.js";
import { loadExpressMiddleware } from "./middleware/loadExpress.js";

export function createApp() {
  const app = express();
  app.use(httpLogger);
  loadExpressMiddleware(app);
  registerRoutes(app);
  app.use(notFoundHandler);
  app.use(errorHandler);
  return app;
}

const app = createApp();
export default app;
```

```javascript
// src/server.js
import app from "./app.js";
import { config } from "./config/index.js";
import { logger } from "./lib/logger.js";

app.listen(config.port, () => {
  logger.info({ port: config.port, upstream: config.fastapiUrl }, "BFF started");
});
```

`package.json`:

```json
{
  "scripts": {
    "dev": "node --watch src/server.js",
    "start": "node src/server.js"
  }
}
```

---

## src/config/ — single configuration

```javascript
// src/config/index.js — see lessons 28–29
export const config = Object.freeze({ ... });
```

```javascript
// src/config/upstream.js — optional helpers
import { config } from "./index.js";
export function apiPath(path) {
  return new URL(path, config.fastapiUrl).toString();
}
```

**Rule:** no `process.env` outside `config/` (except bootstrap edge cases).

---

## src/middleware/ — cross-cutting

| File | Role |
|------|------|
| `httpLogger.js` | pino-http, requestId |
| `asyncHandler.js` | wrap async routes |
| `errorHandler.js` | JSON errors, log 4xx/5xx |
| `notFound.js` | 404 JSON |
| `loadExpress.js` | cors + express.json() |

```javascript
// src/middleware/loadExpress.js
import cors from "cors";
import express from "express";

export function loadExpressMiddleware(app) {
  app.use(cors({ origin: ["http://localhost:5173"], credentials: true }));
  app.use(express.json({ limit: "1mb" }));
}

```

Middleware does **not** call upstream fetch — only HTTP ingress concerns.

---

## src/routes/ — thin handlers

```javascript
// src/routes/items.js
import { Router } from "express";
import { asyncHandler } from "../middleware/asyncHandler.js";
import * as items from "../services/itemsProxy.js";

const router = Router();

router.get("/", asyncHandler(items.list));
router.get("/:id", asyncHandler(items.getById));
router.post("/", asyncHandler(items.create));

export default router;
```

```javascript
// src/routes/index.js
import healthRouter from "./health.js";
import itemsRouter from "./items.js";

export function registerRoutes(app) {
  app.use("/health", healthRouter);
  app.use("/api/v1/items", itemsRouter);
}
```

Route file: **parse req → call service → set status/res.json**; no business rules.

---

## src/services/ — integration and orchestration

```javascript
// src/services/itemsProxy.js
import { upstreamFetch, readUpstreamJson } from "./upstreamClient.js";

export async function list(req, res) {
  const upstream = await upstreamFetch("/api/v1/items", {}, req);
  const data = await readUpstreamJson(upstream);
  res.json(data);
}

export async function getById(req, res) {
  const id = encodeURIComponent(req.params.id);
  const upstream = await upstreamFetch(`/api/v1/items/${id}`, {}, req);
  const data = await readUpstreamJson(upstream);
  res.json(data);
}

export async function create(req, res) {
  const upstream = await upstreamFetch(
    "/api/v1/items",
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(req.body),
    },
    req
  );
  const data = await readUpstreamJson(upstream);
  res.status(upstream.status).json(data);
}
```

`upstreamClient.js` — shared fetch logic ([33-proxy-aggregation.md](33-proxy-aggregation.md)).

When dashboard aggregation appears — a new `dashboardService.js`, not a fat route.

---

## src/errors/

```javascript
// src/errors/AppError.js
export class AppError extends Error {
  constructor(message, statusCode = 500, code = "APP_ERROR") {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
  }
}
```

Centralized error classes — import from services and middleware.

---

## src/lib/

Shared utilities with no Express dependency: logger, maybe `id.js`, formatters. **`lib` vs `utils`:** in mock-exams — `lib/logger.js`.

---

## Naming and modules

- ES modules: **`.js` extension** in relative imports
- One router per file: `health.js`, `items.js`
- `camelCase` functions, `PascalCase` errors
- Default export for routers; named for handlers/services

---

## What not to commit

```gitignore
node_modules/
.env
.env.local
dist/
coverage/
*.log
```

Commit: `package.json`, `package-lock.json`, `.env.example`, `src/`, `lab/`.

---

## Anti-patterns (seen in review)

| Bad | Good |
|-------|--------|
| 200-line `app.js` | `createApp` + `registerRoutes` |
| `fetch` in every route | `upstreamClient` |
| `process.env` in routes | `config` |
| `console.log` everywhere | `req.log` / `logger` |
| Circular imports config ↔ routes | routes → config only |

---

## Comparison with FastAPI layers

| FastAPI | Node BFF mock-exams |
|---------|---------------------|
| `routers/` | `src/routes/` |
| `dependencies` | `middleware` |
| `services/` | `src/services/` |
| `core/config.py` | `src/config/` |
| `main.py` | `app.js` + `server.js` |

[`nodejs-intermediate`](../javascript-path.md) will add `controllers`, Prisma, Vitest `tests/`.

---

## Project growth

```text
basic (this course)     → routes + services + proxy
intermediate          → + validation (Zod), auth, DB
advanced              → + workers, metrics, graceful shutdown
capstone (39)         → shop BFF dockerized, aggregation route
```

Don't create empty “for later” folders — YAGNI until there's a ticket.

---

## Checklist: refactoring lab → structure

1. Move `listen` into `server.js`
2. `registerRoutes(app)` from `routes/index.js`
3. Move fetch into `services/upstreamClient.js`
4. Items handlers → `services/itemsProxy.js`
5. `loadExpress.js` for cors/json
6. Grep: zero `process.env` outside config
7. Grep: zero `console.log` in `src/`

---

## Related courses

- Labs 23–34 — source files for reorganization.
- [39-capstone.md](39-capstone.md) — final project on this structure.
- [36-security-basics.md](36-security-basics.md) — helmet/rate-limit middleware in the same folder.
- [`deploy/nodejs`](../../deploy/nodejs/README.md) — deploy layout (when it appears).

---

## Common mistakes

1. **Circular import** `app.js` ↔ `routes/items.js` — use a `createApp` factory.

2. **config imports logger imports config** — logger reads config once at init; break the cycle.

3. **Tests import server.js** — side effect listen; import `createApp` only.

4. **Barrel `index.js` re-exports everything** — tree-shaking and cycles; barrel only for routes register.

5. **Mixing lab and solutions in src** — keep solutions separate.

---

## Summary

mock-exams BFF structure: `config` (env), `middleware` (ingress), `routes` (thin HTTP), `services` (upstream/proxy), `lib` (logger), `errors`. Entry: `app.js` composition, `server.js` listen. Imports only downward through layers. This layout scales to the capstone and nodejs-intermediate without a rewrite from scratch.

---

## Checklist

- Which file calls `app.listen`?
- Can `routes/items.js` import `config` directly?
- Where does `upstreamFetch` live and why not in middleware?
- Why `createApp()` for tests?
- Which three folders appeared after Express lab 23?
- What goes in git instead of `.env`?
- What's the FastAPI analogue of `src/middleware/errorHandler.js`?

Next lesson: [36. Security: helmet, basic rate limit](36-security-basics.md).
