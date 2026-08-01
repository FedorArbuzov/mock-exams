# 26. Lab: shop routes on Express

## A scenario from work

The product owner wants “like the FastAPI shop,” but the frontend will connect to the BFF for now. Task: implement `/api/v1/items` on Express — list, one item, create — with CORS for React and a **proxy stub** (log “would proxy to :8090”) so tomorrow you can swap in a real `fetch`. Demo in 2 hours; code must live in `src/routes/items.js`, not a monolithic `index.js`.

This lab finishes the Express block (21–25) and prepares for the BFF proxy ([34-lab-bff.md](34-lab-bff.md)).

## Goals

- Full CRUD stub for items (GET list, GET by id, POST create)
- CORS for `http://localhost:5173`
- Middleware: logger, json, 404, error handler
- Stub layer “proxy to FastAPI” with env `FASTAPI_URL`
- Verify with curl + optionally the browser

**Time:** ~60–70 minutes.

---

## Starting point

Continue the project from [23-lab-express.md](23-lab-express.md) or copy the scaffold from `examples/lab/26-express-shop/`.

```bash
cd courses/nodejs-basic/examples
npm install cors
```

`.env` (optional for now):

```env
PORT=3096
FASTAPI_URL=http://localhost:8090
NODE_ENV=development
```

---

## Step 1. Stub proxy config

```javascript
// src/config/upstream.js
export const FASTAPI_URL =
  process.env.FASTAPI_URL ?? "http://localhost:8090";

export function proxyLog(method, path) {
  console.log(`[proxy-stub] would ${method} ${FASTAPI_URL}${path}`);
}
```

Later replace `proxyLog` with a real `fetch` ([34-lab-bff.md](34-lab-bff.md)).

---

## Step 2. Items service (in-memory + stub)

```javascript
// src/services/itemsService.js
import { proxyLog } from "../config/upstream.js";

const store = new Map([
  ["1", { id: "1", name: "Keyboard", price: 79.99, sku: "KB-001" }],
  ["2", { id: "2", name: "Mouse", price: 29.99, sku: "MS-002" }],
]);

export function listItems() {
  proxyLog("GET", "/api/v1/items");
  return { items: [...store.values()], total: store.size };
}

export function getItem(id) {
  proxyLog("GET", `/api/v1/items/${id}`);
  return store.get(id) ?? null;
}

export function createItem(payload) {
  proxyLog("POST", "/api/v1/items");
  const id = String(Date.now());
  const item = { id, ...payload };
  store.set(id, item);
  return item;
}
```

---

## Step 3. Routes with validation

```javascript
// src/routes/items.js
import { Router } from "express";
import { asyncHandler } from "../middleware/asyncHandler.js";
import { AppError } from "../errors/AppError.js";
import * as itemsService from "../services/itemsService.js";

const router = Router();

router.get(
  "/",
  asyncHandler(async (_req, res) => {
    res.json(itemsService.listItems());
  })
);

router.get(
  "/:id",
  asyncHandler(async (req, res) => {
    const item = itemsService.getItem(req.params.id);
    if (!item) {
      throw new AppError("Item not found", 404, "NOT_FOUND");
    }
    res.json(item);
  })
);

router.post(
  "/",
  asyncHandler(async (req, res) => {
    const { name, price, sku } = req.body ?? {};
    if (!name || price == null) {
      throw new AppError("name and price required", 400, "VALIDATION_ERROR");
    }
    const item = itemsService.createItem({
      name,
      price: Number(price),
      sku: sku ?? null,
    });
    res.status(201).json(item);
  })
);

export default router;
```

---

## Step 4. app.js with CORS

```javascript
// src/app.js
import express from "express";
import cors from "cors";
import { requestLogger } from "./middleware/requestLogger.js";
import { notFoundHandler } from "./middleware/notFound.js";
import { errorHandler } from "./middleware/errorHandler.js";
import healthRouter from "./routes/health.js";
import itemsRouter from "./routes/items.js";

const app = express();
const PORT = Number(process.env.PORT ?? 3096);

app.use(requestLogger);
app.use(
  cors({
    origin: ["http://localhost:5173", "http://127.0.0.1:5173"],
    credentials: true,
  })
);
app.use(express.json({ limit: "1mb" }));

app.use("/health", healthRouter);
app.use("/api/v1/items", itemsRouter);

app.use(notFoundHandler);
app.use(errorHandler);

app.listen(PORT, () => {
  console.log(`Shop BFF stub http://localhost:${PORT}`);
});

export default app;
```

---

## Step 5. Verify with curl

```bash
npm run dev

curl -s http://localhost:3096/api/v1/items | jq
curl -s http://localhost:3096/api/v1/items/1 | jq
curl -s -X POST http://localhost:3096/api/v1/items \
  -H "Content-Type: application/json" \
  -d '{"name":"Monitor","price":199,"sku":"MN-100"}' | jq
curl -s http://localhost:3096/api/v1/items/not-exist | jq
```

In the server logs on every items request:

```text
[proxy-stub] would GET http://localhost:8090/api/v1/items
```

---

## Step 6. Check CORS from the browser

DevTools console on any `:5173` page (or a temporary HTML page):

```javascript
fetch("http://localhost:3096/api/v1/items")
  .then((r) => r.json())
  .then(console.log)
  .catch(console.error);
```

Without CORS — error in the console; with middleware — JSON with items.

---

## Step 7. (Optional) Query pagination stub

```javascript
router.get("/", asyncHandler(async (req, res) => {
  const page = Math.max(1, Number(req.query.page ?? 1));
  const limit = Math.min(100, Number(req.query.limit ?? 20));
  const all = itemsService.listItems().items;
  const start = (page - 1) * limit;
  const items = all.slice(start, start + limit);
  res.json({ items, page, limit, total: all.length });
}));
```

---

## Success criteria

- [ ] `GET /api/v1/items` — 200, items array
- [ ] `GET /api/v1/items/:id` — 200 or 404 JSON
- [ ] `POST /api/v1/items` — 201, item with id
- [ ] `POST` without name — 400 via error handler
- [ ] CORS: fetch from `:5173` without blocking
- [ ] Log `[proxy-stub] would …` on items operations
- [ ] Structure: routes / services / middleware / config

---

## If something went wrong

| Symptom | Solution |
|---------|---------|
| CORS error | check `origin` in cors(); BFF restarted |
| 500 on POST | `asyncHandler` + `AppError`; check the stack |
| 404 on `/api/v1/item` | typo: `items` |
| Duplicate items after restart | in-memory store — expected; FastAPI later |
| No proxy-stub log | call `proxyLog` in the service |

---

## Moving to a real proxy

Replace the body of `listItems`:

```javascript
export async function listItems() {
  const res = await fetch(`${FASTAPI_URL}/api/v1/items`);
  if (!res.ok) throw new AppError("Upstream error", res.status);
  return res.json();
}
```

Full lab — [34-lab-bff.md](34-lab-bff.md). FastAPI stand: [`deploy/fastapi`](../../deploy/fastapi/README.md).

---

## Related courses

- [25-express-body-cors.md](25-express-body-cors.md) — json + cors.
- [24-express-errors.md](24-express-errors.md) — AppError.
- [28-env-config.md](28-env-config.md) — FASTAPI_URL from env.
- [35-project-structure.md](35-project-structure.md) — final folder structure.

---

## Common mistakes

1. Business logic in a 100-line route handler — move it to `services/`.

2. Forgot `Number(price)` — string in the JSON store.

3. CORS only on `/api/v1/items` via the router — easier globally on the app.

4. Expecting FastAPI data without `:8090` up — the stub is for offline work.

5. Didn't export `asyncHandler` — copy-paste errors.

---

## Summary

The lab builds a shop API on Express: versioned routes, validation, CORS for React, in-memory store with a log of the future proxy to `:8090`. The routes + services structure prepares for the BFF. Verify with curl and a browser fetch before FastAPI integration.

---

## Checklist

- What's the full URL for the items list?
- Where is the proxy intent logged and why a stub?
- Which fields are required in the POST body?
- Which origin in cors for Vite?
- Where is 404 “item not found” vs “route not found” handled?
- How do you replace the stub with a real fetch in one function?
- Which folders appeared besides routes?

Next lesson: [27. Fastify: overview and comparison with Express](27-fastify-overview.md).
