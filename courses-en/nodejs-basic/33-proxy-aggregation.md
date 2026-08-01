# 33. Proxy, aggregation, timeouts

## A scenario from work

The BFF on staging occasionally returns 504 Gateway Timeout: FastAPI is overloaded, but some requests simply “forgot a timeout on fetch.” Another bug: on upstream 422 the BFF returns 500 with `"Unexpected token"` — the error body was parsed as JSON, but nginx HTML arrived. The TL asks: explicit timeouts, status mapping, `AbortSignal`, duration logging, graceful 502/504.

This lesson is the technical BFF implementation ([32-bff-pattern.md](32-bff-pattern.md)) via `fetch`.

## What you'll learn

- Proxy handler: method, headers, body forward
- Error mapping upstream → client
- `AbortSignal.timeout` / AbortController
- JSON vs empty body on errors
- Parallel aggregation with `Promise.all`
- Retry — when not to do it in the BFF

---

## Basic proxy GET

```javascript
// src/services/upstreamClient.js
import { config } from "../config/index.js";
import { AppError, BadGatewayError } from "../errors/AppError.js";

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

  let res;
  try {
    res = await fetch(url, { ...options, headers, signal });
  } catch (err) {
    req?.log?.error({ err, url, durationMs: Date.now() - start }, "upstream network");
    if (err.name === "TimeoutError" || err.name === "AbortError") {
      throw new AppError("Upstream timeout", 504, "GATEWAY_TIMEOUT");
    }
    throw new BadGatewayError(config.fastapiUrl);
  }

  req?.log?.info(
    { status: res.status, durationMs: Date.now() - start },
    "upstream done"
  );

  return res;
}
```

---

## Reading the body with error mapping

```javascript
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

FastAPI validation 422:

```json
{ "detail": [{ "loc": ["body", "price"], "msg": "..." }] }
```

The BFF can simplify for the UI:

```javascript
if (res.status === 422 && Array.isArray(body?.detail)) {
  throw new AppError("Validation failed", 422, "VALIDATION_ERROR");
}
```

---

## Route proxy list items

```javascript
// src/routes/items.js
router.get("/", asyncHandler(async (req, res) => {
  const upstream = await upstreamFetch("/api/v1/items", {}, req);
  const data = await readUpstreamJson(upstream);
  res.json(data);
}));
```

POST with a body:

```javascript
router.post("/", asyncHandler(async (req, res) => {
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
}));
```

---

## Statuses: what React sees

| Upstream | BFF → client | Meaning |
|----------|--------------|-------|
| 200 | 200 | OK |
| 404 | 404 | not found |
| 422 | 422 | validation |
| 500 | 500 | upstream error (forward or map) |
| network fail | 502 | Bad Gateway |
| timeout | 504 | Gateway Timeout |
| BFF bug | 500 | INTERNAL |

Don't mask 404 as 500 — the UI shows different screens.

---

## Timeouts

Node 18+ `AbortSignal.timeout(ms)`:

```javascript
const signal = AbortSignal.timeout(5000);
await fetch(url, { signal });
```

Custom controller for cancel on shutdown ([nodejs-advanced](../javascript-path.md)):

```javascript
const controller = new AbortController();
setTimeout(() => controller.abort(), 5000);
await fetch(url, { signal: controller.signal });
```

**Connect vs read:** for basic, one shared timeout is enough; split — advanced.

mock-exams recommendation: **10s** default, **3s** for upstream health check.

---

## Health: checking FastAPI

```javascript
// src/routes/health.js
router.get("/upstream", asyncHandler(async (req, res) => {
  try {
    const r = await upstreamFetch("/health", { timeoutMs: 3000 }, req);
    const ok = r.ok;
    res.status(ok ? 200 : 503).json({
      bff: "ok",
      fastapi: ok ? "ok" : "degraded",
      status: r.status,
    });
  } catch {
    res.status(503).json({ bff: "ok", fastapi: "down" });
  }
}));
```

---

## Parallel aggregation

```javascript
router.get("/dashboard", asyncHandler(async (req, res) => {
  const [itemsRes, statsRes] = await Promise.all([
    upstreamFetch("/api/v1/items?limit=5", {}, req),
    upstreamFetch("/api/v1/stats/summary", {}, req),
  ]);

  const [items, stats] = await Promise.all([
    readUpstreamJson(itemsRes),
    readUpstreamJson(statsRes),
  ]);

  res.json({ recentItems: items.items ?? items, stats });
}));
```

`Promise.all` — fail fast: one upstream fail → whole dashboard error. Alternative — `Promise.allSettled` + partial data (UX choice).

---

## Headers forward (carefully)

Forward selectively:

```javascript
const forwardHeaders = ["authorization", "accept-language"];
function pickHeaders(incoming) {
  const out = {};
  for (const key of forwardHeaders) {
    if (incoming[key]) out[key] = incoming[key];
  }
  return out;
}
```

Don't forward `host`, `connection` blindly — security and bugs.

---

## Retry in the BFF?

Default: **no automatic retry** on GET in a browser-facing path — duplicates side effects if the boundary is blurry. Retry with idempotency — gateway level or a dedicated worker.

Exception: internal cron BFF job — [`nodejs-advanced`](../javascript-path.md).

---

## Streaming (reference)

Large files — `res.status(upstream.status); upstream.body.pipeTo(...)` or ReadableStream pass-through. Shop JSON labs — buffering is enough.

---

## Related courses

- [20-fastapi-client.md](20-fastapi-client.md) — fetch basics.
- [24-express-errors.md](24-express-errors.md) — AppError chain.
- [34-lab-bff.md](34-lab-bff.md) — full lab.
- [`api-design`](../api-design/README.md) — HTTP codes.

---

## Common mistakes

1. **`await res.json()` on 204** — empty body error; use text + parse.

2. **No timeout** — event loop clogged with hanging fetch.

3. **502 on every error** — loses 404/422 for the UI.

4. **`Promise.all` without try** — one reject → unhandled; wrap in asyncHandler.

5. **Logging the full upstream body** — PII.

6. **Double JSON.stringify body** — upstream gets a quoted string.

7. **Ignoring upstream Content-Type** — assume JSON always.

---

## Summary

BFF proxy via `fetch`: build URL from config, forward method/body/selected headers, `AbortSignal.timeout` for 504. `readUpstreamJson` maps FastAPI errors into AppError while preserving status. Aggregation — `Promise.all` of several upstream calls. Log url, status, duration on every upstream hop.

---

## Checklist

- Which status to return on TimeoutError from fetch?
- How do you extract the message from a FastAPI 404 `detail`?
- Why `res.text()` before JSON.parse?
- How do you forward X-Request-Id?
- What's dangerous about blind retry on POST proxy?
- Default timeout for the shop BFF?
- When is `Promise.allSettled` better than `Promise.all`?

Next lesson: [34. Lab: BFF to `:8090`](34-lab-bff.md).
