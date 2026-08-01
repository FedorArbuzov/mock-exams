# 34. Lab: BFF to `:8090`

## Real-world scenario

The frontend is ready; the in-memory stub no longer cuts it. We need a **real BFF proxy** in front of the FastAPI shop on `:8090`: list/create/get items, CORS for React, pino logs, env config. FastAPI is brought up from [`deploy/fastapi`](../../deploy/fastapi/README.md). End-to-end demo: React or curl → BFF `:3096` → FastAPI `:8090`.

**Time:** ~70–90 minutes. Prerequisites: lessons 28–33, labs 26, 29, 31.

---

## Goals

- Replace the stub `itemsService` with `upstreamClient`
- Proxy `GET/POST /api/v1/items` and `GET /api/v1/items/:id`
- Bring up FastAPI `:8090` and verify the end-to-end flow
- BFF health + optional upstream check
- Handle upstream being down (502/504)

---

## Step 0. Bring up FastAPI

In a separate terminal (from the repo root or deploy):

```bash
# follow the deploy/fastapi README
cd deploy/fastapi
docker compose up -d
# or a local uvicorn — port 8090
curl -s http://localhost:8090/health
curl -s http://localhost:8090/api/v1/items | jq
```

Without `:8090` up and running, the lab only exercises the error paths.

---

## Step 1. .env

```env
PORT=3096
FASTAPI_URL=http://localhost:8090
NODE_ENV=development
LOG_LEVEL=info
```

---

## Step 2. upstreamClient.js

Create `src/services/upstreamClient.js` following the pattern from [33-proxy-aggregation.md](33-proxy-aggregation.md):

```javascript
import { config } from "../config/index.js";
import { AppError } from "../errors/AppError.js";

export async function upstreamFetch(path, options = {}, req = null) {
  const url = new URL(path, config.fastapiUrl).toString();
  const timeoutMs = options.timeoutMs ?? 10_000;
  const signal = AbortSignal.timeout(timeoutMs);

  const headers = {
    Accept: "application/json",
    ...options.headers,
  };
  if (req?.id) headers["X-Request-Id"] = req.id;

  const start = Date.now();
  req?.log?.info({ url, method: options.method ?? "GET" }, "upstream start");

  try {
    const res = await fetch(url, { ...options, headers, signal });
    req?.log?.info(
      { status: res.status, durationMs: Date.now() - start },
      "upstream done"
    );
    return res;
  } catch (err) {
    req?.log?.error({ err, url }, "upstream failed");
    if (err.name === "TimeoutError" || err.name === "AbortError") {
      throw new AppError("Upstream timeout", 504, "GATEWAY_TIMEOUT");
    }
    throw new AppError("Upstream unavailable", 502, "BAD_GATEWAY");
  }
}

export async function readUpstreamJson(res) {
  const text = await res.text();
  let body = null;
  if (text) {
    try {
      body = JSON.parse(text);
    } catch {
      throw new AppError("Invalid JSON from upstream", 502, "BAD_GATEWAY");
    }
  }
  if (!res.ok) {
    const message =
      body?.detail ??
      (typeof body?.error === "string" ? body.error : null) ??
      res.statusText;
    throw new AppError(message, res.status, "UPSTREAM_ERROR");
  }
  return body;
}
```

---

## Step 3. items routes — proxy only

```javascript
// src/routes/items.js
import { Router } from "express";
import { asyncHandler } from "../middleware/asyncHandler.js";
import { upstreamFetch, readUpstreamJson } from "../services/upstreamClient.js";

const router = Router();

router.get(
  "/",
  asyncHandler(async (req, res) => {
    const upstream = await upstreamFetch("/api/v1/items", {}, req);
    const data = await readUpstreamJson(upstream);
    res.json(data);
  })
);

router.get(
  "/:id",
  asyncHandler(async (req, res) => {
    const upstream = await upstreamFetch(
      `/api/v1/items/${encodeURIComponent(req.params.id)}`,
      {},
      req
    );
    const data = await readUpstreamJson(upstream);
    res.json(data);
  })
);

router.post(
  "/",
  asyncHandler(async (req, res) => {
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
  })
);

export default router;
```

Remove the in-memory store from [26-lab-express-shop.md](26-lab-express-shop.md).

---

## Step 4. app.js — full assembly

Make sure the chain looks like this:

```javascript
app.use(httpLogger);
app.use(cors({ origin: ["http://localhost:5173"], credentials: true }));
app.use(express.json({ limit: "1mb" }));
app.use("/health", healthRouter);
app.use("/api/v1/items", itemsRouter);
app.use(notFoundHandler);
app.use(errorHandler);
```

---

## Step 5. Extended health (optional)

```javascript
// GET /health/upstream
router.get("/upstream", asyncHandler(async (req, res) => {
  const r = await upstreamFetch("/health", { timeoutMs: 3000 }, req);
  res.status(r.ok ? 200 : 503).json({
    bff: "ok",
    fastapi: r.ok ? "ok" : "degraded",
  });
}));
```

---

## Step 6. Start the BFF

```bash
cd courses/nodejs-basic/examples
npm run dev
```

---

## Step 7. End-to-end curl tests

```bash
# BFF health
curl -s http://localhost:3096/health | jq

# List through the proxy
curl -s http://localhost:3096/api/v1/items | jq

# Compare with direct FastAPI — data should match
curl -s http://localhost:8090/api/v1/items | jq

# Create through the BFF
curl -s -X POST http://localhost:3096/api/v1/items \
  -H "Content-Type: application/json" \
  -d '{"name":"BFF Test Item","price":42.5,"sku":"BFF-001"}' | jq

# Get by id (use the id from the create response)
curl -s http://localhost:3096/api/v1/items/1 | jq

# 404 upstream
curl -s http://localhost:3096/api/v1/items/nonexistent-id-999 | jq
```

Check the `X-Request-Id` header and the `requestId` field in error JSON.

---

## Step 8. Upstream down

Stop FastAPI or point at a wrong port:

```env
FASTAPI_URL=http://localhost:9999
```

```bash
curl -s http://localhost:3096/api/v1/items | jq
# expected: 502 BAD_GATEWAY or a mapped connection error
```

Restore the correct URL after the test.

---

## Step 9. Browser / React

```javascript
fetch("http://localhost:3096/api/v1/items")
  .then((r) => r.json())
  .then(console.log);
```

CORS should pass; the data comes from FastAPI through the BFF.

---

## Success criteria

- [ ] `GET /api/v1/items` through the BFF ≡ direct FastAPI (structurally)
- [ ] `POST` creates an item visible on both paths
- [ ] Upstream 404 → BFF 404 JSON with a message
- [ ] FastAPI down → 502/504, no hang
- [ ] pino logs: upstream start/done with durationMs
- [ ] No in-memory stub left; no hardcoded `:8090` in routes

---

## If something goes wrong

| Symptom | Fix |
|---------|-----|
| ECONNREFUSED | FastAPI isn't running; check 8090 |
| 502 Invalid JSON | upstream returned HTML; curl FastAPI directly |
| CORS | cors middleware; origin 5173 |
| 404 on BFF, OK on FastAPI | path mismatch; encodeURIComponent the id |
| Empty items | different FastAPI DB; create an item |
| Hang >10s | timeout should produce a 504 |

---

## Diagram of a successful request

```text
curl → BFF GET /api/v1/items
         → pino req.id=abc
         → fetch http://localhost:8090/api/v1/items
         → FastAPI 200 JSON
         → BFF res.json + log durationMs
```

---

## Connection to the capstone

[39-capstone.md](39-capstone.md) extends the BFF: dashboard aggregation, security headers, Docker. This lab is the **minimal working proxy**.

---

## Common mistakes

1. Forgetting `encodeURIComponent` for ids with special characters.

2. POST without `JSON.stringify(req.body)`.

3. Testing only the BFF, not comparing against direct FastAPI.

4. Leaving the stub store in place — data diverges.

5. `FASTAPI_URL` with a trailing slash plus a path starting `/api/...` — double slash (often fine, but origin-only is cleaner).

---

## Summary

This lab replaces the stub with a production-shaped BFF proxy to FastAPI `:8090`: an upstreamClient with timeout and error mapping, transparent proxy items routes, pino correlation, env config. Verification: curl parity between BFF/FastAPI, upstream down, CORS from the browser.

---

## Checklist

- Which two ports are involved in an end-to-end request?
- Where is the single place holding the FastAPI base URL?
- How do you verify a POST actually reached Python?
- What status is returned on a 10s timeout?
- How do you pass the request id through to FastAPI?
- What should be removed from lab 26 (the stub)?
- How do you make sure FastAPI errors don't turn into 500s?

Next lesson: [35. Node project structure](35-project-structure.md).
