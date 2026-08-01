# 18. HTTP client: `fetch` and headers

## A scenario from work

The BFF on `:3096` should check FastAPI `:8090/health` at startup and pull the catalog. A script with `await fetch(url)` “succeeds” on a **503** from upstream — someone forgot to check `response.ok`. Second incident: a request to a slow API hangs for 10 minutes — no **timeout**. Third: calling `response.json()` twice — `body stream already read`. In Node 18+ global `fetch` is built in; the patterns match [`javascript-basic/29-fetch`](../javascript-basic/29-fetch.md).

## What you'll learn

- GET/POST via `fetch` in Node
- Request and response headers
- Checking `response.ok` and parsing HTTP errors
- `AbortSignal.timeout` and `AbortController`
- Base URL for BFF → FastAPI
- Network error vs 4xx/5xx

---

## Basic GET

```javascript
const response = await fetch("http://127.0.0.1:3096/health");

console.log(response.status);     // 200
console.log(response.ok);         // true for 200–299
console.log(response.headers.get("content-type"));
```

The body is **not** parsed automatically:

```javascript
const data = await response.json();
console.log(data.status); // "ok"
```

---

## HTTP errors do not reject fetch

**Critical:** `fetch` **fulfills** on 404, 500, 503. Reject — network, DNS, abort.

```javascript
const res = await fetch("http://127.0.0.1:8090/api/v1/items/99999");

if (!res.ok) {
  const text = await res.text();
  throw new Error(`HTTP ${res.status}: ${text}`);
}

const item = await res.json();
```

Without `!res.ok`, code treats `{"detail":"Not found"}` as a successful item.

---

## Request headers

```javascript
const res = await fetch("http://127.0.0.1:8090/api/v1/items", {
  method: "GET",
  headers: {
    Accept: "application/json",
    "User-Agent": "shop-bff/1.0 (nodejs-basic)",
  },
});
```

POST JSON:

```javascript
const res = await fetch("http://127.0.0.1:8090/api/v1/items", {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    Accept: "application/json",
  },
  body: JSON.stringify({
    name: "USB Hub",
    price: 19.5,
    category: "accessories",
  }),
});
```

FastAPI returns 422 on an invalid schema — check `ok` again.

---

## `apiFetch` wrapper for mock-exams

```javascript
const DEFAULT_TIMEOUT_MS = 10_000;

export async function apiFetch(path, options = {}) {
  const baseUrl = process.env.API_BASE_URL ?? "http://127.0.0.1:8090";
  const url = new URL(path, baseUrl);

  const timeoutMs = options.timeoutMs ?? DEFAULT_TIMEOUT_MS;
  const signal =
    options.signal ??
    AbortSignal.timeout(timeoutMs);

  const { timeoutMs: _t, ...fetchOptions } = options;

  const res = await fetch(url, {
    ...fetchOptions,
    signal,
    headers: {
      Accept: "application/json",
      ...fetchOptions.headers,
    },
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`HTTP ${res.status} ${url.pathname}: ${body}`);
  }

  const contentType = res.headers.get("content-type") ?? "";
  if (contentType.includes("application/json")) {
    return res.json();
  }
  return res.text();
}
```

Usage:

```javascript
const health = await apiFetch("/health");
const { items } = await apiFetch("/api/v1/items");
```

---

## Timeout: AbortSignal

Node 18+:

```javascript
const res = await fetch("http://127.0.0.1:8090/health", {
  signal: AbortSignal.timeout(5_000),
});
```

On timeout — `DOMException` with `name === "TimeoutError"` (or AbortError depending on version).

Manual controller — cancel from elsewhere:

```javascript
const controller = new AbortController();
const timer = setTimeout(() => controller.abort(), 5_000);

try {
  const res = await fetch(url, { signal: controller.signal });
  // ...
} finally {
  clearTimeout(timer);
}
```

---

## Query parameters

```javascript
const url = new URL("/api/v1/items", "http://127.0.0.1:8090");
url.searchParams.set("skip", "0");
url.searchParams.set("limit", "10");

const res = await fetch(url);
```

Don't concatenate strings by hand — encoding of special characters.

---

## Read the body once

```javascript
const res = await fetch(url);
await res.json();
// await res.json(); // TypeError: body stream already read
```

To log the raw body on error — `clone()` or `text()` first:

```javascript
if (!res.ok) {
  const body = await res.text();
  throw new Error(`HTTP ${res.status}: ${body}`);
}
```

---

## Environment variables

```javascript
// .env.example
// API_BASE_URL=http://127.0.0.1:8090
// BFF_PORT=3096

const apiBase = process.env.API_BASE_URL ?? "http://127.0.0.1:8090";
```

The BFF reads the upstream URL from env ([28-env-config.md](28-env-config.md)); don't hardcode the prod URL in code.

---

## Node vs browser

| | Node BFF | Browser React |
|---|----------|---------------|
| CORS | no (server-to-server) | yes, backend headers required |
| `fetch` | global since Node 18+ | always |
| Cookies | manually via headers | automatically same-origin |

BFF → FastAPI has **no CORS** issues; React → BFF — CORS on Express ([25-express-body-cors.md](25-express-body-cors.md)).

---

## Common mistakes

- **No `response.ok` check** — silent failures on 4xx/5xx.
- **No timeout** — hung upstream blocks the BFF.
- **Double `json()`** — body already read.
- **Forgot `Content-Type` on POST** — FastAPI doesn't parse the body.
- **`fetch` without a scheme** — `fetch("/health")` in Node does **not** work like in the browser; you need a full URL or `new URL(path, base)`.

---

## Summary

- `fetch` in Node is the main HTTP client; always check **`response.ok`**.
- Headers **`Accept`**, **`Content-Type`** — contract with FastAPI.
- **`AbortSignal.timeout(ms)`** — required pattern for a BFF.
- A wrapper with base URL and error parsing — reuse it across labs.

## Checklist

- Why doesn't a 404 land in `catch` for `fetch`?
- How do you set a 5-second timeout?
- Which headers are needed for POST JSON?
- How do you build a URL with query without manual encoding?
- What if you need both to check ok and read JSON?
- Why put `API_BASE_URL` in env?

Next lesson: [19. Lab: client to a local server](19-lab-http-client.md).
