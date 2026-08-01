# 23. Lab: basic Express

## A scenario from work

The tech lead filed a ticket: “Stand up a minimal Express BFF: health, versioned API, log every request. No FastAPI yet — JSON stubs.” You have 90 minutes until a frontend demo. You need a predictable `npm run dev`, curl checks, and a folder structure you're not ashamed to show in review.

This lab cements [21-express-routing.md](21-express-routing.md) and [22-middleware.md](22-middleware.md) hands-on in [`examples/`](examples/package.json).

## Lab goals

- Create an Express app with ES modules
- Split routes into `src/routes/`
- Add logging and 404 middleware
- Verify endpoints with `curl`
- Prepare the base for the shop lab ([26-lab-express-shop.md](26-lab-express-shop.md))

**Time:** ~45–60 minutes (theory 21–22 — before the lab).

---

## Prerequisites

- Node.js LTS 20+
- Lessons 21–22 completed
- Directory `courses/nodejs-basic/examples`

```bash
cd courses/nodejs-basic/examples
npm install
```

`package.json` should have `"type": "module"`, `express`, and script `"dev": "node --watch src/app.js"` (or `nodemon`).

---

## Step 1. Project scaffold

```text
examples/
  package.json
  src/
    app.js
    routes/
      health.js
      items.js
    middleware/
      requestLogger.js
      notFound.js
```

---

## Step 2. Health router

```javascript
// src/routes/health.js
import { Router } from "express";

const router = Router();

router.get("/", (_req, res) => {
  res.json({
    status: "ok",
    service: "shop-bff",
    uptime: process.uptime(),
  });
});

export default router;
```

---

## Step 3. Items stub

```javascript
// src/routes/items.js
import { Router } from "express";

const router = Router();

const STUB_ITEMS = [
  { id: "1", name: "Keyboard", price: 79.99 },
  { id: "2", name: "Mouse", price: 29.99 },
];

router.get("/", (_req, res) => {
  res.json({ items: STUB_ITEMS, total: STUB_ITEMS.length });
});

router.get("/:id", (req, res) => {
  const item = STUB_ITEMS.find((i) => i.id === req.params.id);
  if (!item) {
    return res.status(404).json({ error: "Item not found", id: req.params.id });
  }
  return res.json(item);
});

export default router;
```

---

## Step 4. Middleware

```javascript
// src/middleware/requestLogger.js
export function requestLogger(req, res, next) {
  const start = Date.now();
  res.on("finish", () => {
    console.log(
      `[${new Date().toISOString()}] ${req.method} ${req.originalUrl} → ${res.statusCode} (${Date.now() - start}ms)`
    );
  });
  next();
}
```

```javascript
// src/middleware/notFound.js
export function notFoundHandler(_req, res) {
  res.status(404).json({ error: "Not found", path: _req.originalUrl });
}
```

---

## Step 5. app.js — assembling the chain

```javascript
// src/app.js
import express from "express";
import { requestLogger } from "./middleware/requestLogger.js";
import { notFoundHandler } from "./middleware/notFound.js";
import healthRouter from "./routes/health.js";
import itemsRouter from "./routes/items.js";

const app = express();
const PORT = Number(process.env.PORT ?? 3096);

app.use(requestLogger);
app.use(express.json());

app.use("/health", healthRouter);
app.use("/api/v1/items", itemsRouter);

app.use(notFoundHandler);

app.listen(PORT, () => {
  console.log(`BFF ready: http://localhost:${PORT}`);
});

export default app;
```

---

## Step 6. Run and verify

```bash
npm run dev
```

In another terminal:

```bash
curl -s http://localhost:3096/health | jq
curl -s http://localhost:3096/api/v1/items | jq
curl -s http://localhost:3096/api/v1/items/1 | jq
curl -s http://localhost:3096/api/v1/items/999 | jq
curl -s http://localhost:3096/unknown | jq
```

### Expected results

| Request | Status | Body (fragment) |
|--------|--------|-----------------|
| `GET /health` | 200 | `"status":"ok"` |
| `GET /api/v1/items` | 200 | `items` array |
| `GET /api/v1/items/1` | 200 | `"name":"Keyboard"` |
| `GET /api/v1/items/999` | 404 | `"error":"Item not found"` |
| `GET /unknown` | 404 | `"error":"Not found"` |

In the server console — a log line for every request.

---

## Step 7. (Optional) POST stub

```javascript
router.post("/", (req, res) => {
  const { name, price } = req.body ?? {};
  if (!name || price == null) {
    return res.status(400).json({ error: "name and price required" });
  }
  const item = { id: String(Date.now()), name, price: Number(price) };
  STUB_ITEMS.push(item);
  return res.status(201).json(item);
});
```

```bash
curl -s -X POST http://localhost:3096/api/v1/items \
  -H "Content-Type: application/json" \
  -d '{"name":"Monitor","price":199}' | jq
```

Without `express.json()` the body will be `{}` — see [25-express-body-cors.md](25-express-body-cors.md).

---

## Success criteria

- [ ] `npm run dev` starts without errors
- [ ] All curls from the table return expected statuses
- [ ] Logs show method, url, status, time
- [ ] Routes in separate files, not one `app.js`
- [ ] 404 for unknown paths — JSON, not HTML

---

## If something went wrong

| Symptom | Likely cause | Solution |
|---------|-------------------|---------|
| `Cannot find module` | wrong import path | check `.js` in ESM imports |
| `req.body` empty | no `express.json()` | add it before routes |
| curl hangs forever | no `next()` in middleware | add `next()` |
| 404 on `/api/v1/items` | typo in prefix | check `app.use` and router |
| `EADDRINUSE` | port in use | `PORT=3097 npm run dev` |
| Double response 500 | no `return` after `res.json` | add `return` |

---

## Extension (if time left)

1. Add `requestId` in middleware and error JSON.
2. Move `PORT` to `process.env` ([28-env-config.md](28-env-config.md)).
3. Write a minimal `errorHandler` ([24-express-errors.md](24-express-errors.md)).

---

## Related courses

- Reference — [`examples/solutions/`](examples/solutions/) after your own attempt.
- Next shop lab — [26-lab-express-shop.md](26-lab-express-shop.md).
- FastAPI client — [20-fastapi-client.md](20-fastapi-client.md).

---

## Common lab mistakes

1. Forgot `"type": "module"` — `import` syntax fails.

2. `itemsRouter.get("/api/v1/items")` instead of `get("/")` when mounting a prefix.

3. `notFoundHandler` **before** routes — everything is 404.

4. Didn't export `default router`.

5. Testing port 8090 instead of 3096 — that's FastAPI, not the BFF.

---

## Summary

The lab builds a minimal Express BFF: health, versioned items stub, logging middleware, centralized 404. The `src/routes` and `src/middleware` structure scales to a FastAPI proxy. curl verification is required before React integration.

---

## Checklist

- What's the health endpoint URL?
- Where is the items router mounted and what's the full path for the list?
- Why does POST need `express.json()`?
- What should appear in the log after `GET /api/v1/items/999`?
- What's the default BFF port and how do you override it?
- Where should `notFoundHandler` sit relative to routes?

Next lesson: [24. Error handling and async handlers](24-express-errors.md).
