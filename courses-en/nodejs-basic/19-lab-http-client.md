# 19. Lab: HTTP client to a local server

Goal — **write a CLI client** with `fetch` that calls your server from [16-lab-http-server.md](16-lab-http-server.md) on `:3096`: health, items list, one item, 404 handling, and timeout.

**Time:** ~25–35 minutes after [18-http-client.md](18-http-client.md).

## Stand

Two terminals:

**Terminal 1 — server:**

```bash
cd courses/nodejs-basic/examples
node lab/16-server.js
```

**Terminal 2 — client:**

```bash
node lab/19-client.js
```

Reference: `solutions/lab/19-client.js`.

---

## Task 1. Base URL config

```javascript
// lab/19-client.js
const BFF_BASE = process.env.BFF_BASE_URL ?? "http://127.0.0.1:3096";
const TIMEOUT_MS = 5_000;
```

---

## Task 2. `bffFetch` function

```javascript
async function bffFetch(path, options = {}) {
  const url = new URL(path, BFF_BASE);
  const res = await fetch(url, {
    ...options,
    signal: AbortSignal.timeout(TIMEOUT_MS),
    headers: {
      Accept: "application/json",
      ...options.headers,
    },
  });

  const contentType = res.headers.get("content-type") ?? "";

  if (!res.ok) {
    let detail = await res.text();
    try {
      if (contentType.includes("json")) detail = JSON.stringify(JSON.parse(detail));
    } catch {
      /* keep text */
    }
    throw new Error(`BFF ${res.status} ${path}: ${detail}`);
  }

  if (contentType.includes("application/json")) {
    return res.json();
  }
  return res.text();
}
```

---

## Task 3. API calls

```javascript
async function main() {
  console.log("=== GET /health ===");
  const health = await bffFetch("/health");
  console.log(health);

  console.log("\n=== GET /api/v1/items ===");
  const list = await bffFetch("/api/v1/items");
  console.log("count:", list.items?.length ?? list.items);

  console.log("\n=== GET /api/v1/items/kb-001 ===");
  const item = await bffFetch("/api/v1/items/kb-001");
  console.log(item.name, item.price);

  console.log("\n=== GET missing item (expect error) ===");
  try {
    await bffFetch("/api/v1/items/does-not-exist");
  } catch (err) {
    console.log("Caught:", err.message);
  }
}

main().catch((err) => {
  console.error("Fatal:", err.message);
  process.exitCode = 1;
});
```

---

## Task 4. Query string — category filter

If the server from lab 16 supports `?category=` (add a handler or use [17-url-routing.md](17-url-routing.md)):

```javascript
const url = new URL("/api/v1/items", BFF_BASE);
url.searchParams.set("category", "peripherals");
const res = await fetch(url, { signal: AbortSignal.timeout(TIMEOUT_MS) });
// ... check ok and json
```

Or via a helper:

```javascript
async function bffFetchWithQuery(path, query) {
  const url = new URL(path, BFF_BASE);
  for (const [k, v] of Object.entries(query)) {
    url.searchParams.set(k, String(v));
  }
  const res = await fetch(url, { signal: AbortSignal.timeout(TIMEOUT_MS) });
  // ... same ok/json logic
}
```

---

## Task 5. Timeout test

Temporarily point at the wrong port or start a “slow” server:

```javascript
// optional: lab/19-slow-server.js — sleep 10s before responding
```

```javascript
try {
  await fetch("http://127.0.0.1:3099/health", {
    signal: AbortSignal.timeout(500),
  });
} catch (err) {
  console.log("Timeout as expected:", err.name);
}
```

---

## Task 6. Check without a running server

Stop `16-server.js`, run the client:

```bash
node lab/19-client.js
```

**Expected:** a clear error (`ECONNREFUSED` / fetch failed), `process.exitCode = 1`.

---

## Task 7. Smoke script (optional)

```javascript
// lab/19-smoke.js
import { spawn } from "node:child_process";

// 1. spawn server
// 2. await sleep 500ms
// 3. run client checks
// 4. kill server
```

For CI later; in the lab, two manual terminals are enough.

---

## Expected output (fragment)

```text
=== GET /health ===
{ status: 'ok', service: 'lab-16-bff', items: 2 }

=== GET /api/v1/items ===
count: 2

=== GET /api/v1/items/kb-001 ===
Mechanical Keyboard 79.9

=== GET missing item (expect error) ===
Caught: BFF 404 /api/v1/items/does-not-exist: {"error":"Item not found",...}
```

---

## Success criteria

- [ ] Client reads `/health` and `/api/v1/items` with the server running
- [ ] 404 on missing id — **catch**, process does not crash without a handler
- [ ] Uses `AbortSignal.timeout`
- [ ] Checks `response.ok` inside `bffFetch`
- [ ] Base URL from `BFF_BASE_URL` env
- [ ] Without server — meaningful error and non-zero exit code

---

## If something went wrong

| Symptom | Check |
|---------|----------|
| `fetch failed` | server on 3096; `127.0.0.1` vs `localhost` |
| JSON parse error | Content-Type; body is not an nginx HTML error page |
| Timeout on health | server hung; port taken by another process |
| 404 on /items | query breaks match on the server — see lesson 17 |
| `body already read` | one read per response in the helper |

---

## Reflection

Why can a BFF client (Node → Node `:3096`) and a browser client (React → `:3096`) use the **same** paths but different base URLs?

---

Next lesson: [20. Client to FastAPI `:8090`](20-fastapi-client.md).
