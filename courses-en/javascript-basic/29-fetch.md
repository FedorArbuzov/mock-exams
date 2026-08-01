# 29. `fetch` and working with HTTP

## A scenario from work

The frontend of a shop application needs to load a list of products from the backend. You write `const data = await fetch(url)` and are surprised that `data` is not JSON but a `Response` object. A request to a nonexistent `/api/v1/items/999` doesn't land in `catch`, even though the server returned 404. You call `response.json()` a second time — the error "body already read". In the browser, a request to `http://localhost:8090` from a different port is blocked by CORS. Node 16 doesn't have a global `fetch` yet — a colleague pulls in `node-fetch`.

`fetch` is the standard API for HTTP in the browser and modern Node. It returns a Promise and requires explicit handling of the response status and body.

## What you'll learn

- A basic GET and parsing the `Response` object
- Reading the body: `json()`, `text()`, `blob()` — once
- POST/PUT/PATCH with JSON and headers
- Why HTTP errors don't reject `fetch`
- An `api()` wrapper for the FastAPI stand on `:8090`
- Query parameters via `URLSearchParams`
- Cancelling a request with `AbortController`
- CORS in the browser vs Node
- Security and response validation

---

## A basic GET

```javascript
const response = await fetch("http://localhost:8090/health");

console.log(response.status);      // 200
console.log(response.ok);          // true — status in the 200–299 range
console.log(response.statusText);  // "OK"
console.log(response.headers.get("content-type"));
```

`fetch(url)` returns a Promise that **fulfills** with a `Response` when a response is received from the server (including 404 and 500).

The response body is **not** parsed automatically:

```javascript
const data = await response.json();
console.log(data);
```

On the [deploy/fastapi](../../deploy/fastapi/README.md) stand, health usually returns JSON with the service status.

---

## Response: what's inside

| Property / method | Purpose |
|------------------|------------|
| `status` | numeric HTTP code |
| `ok` | `true` if 200–299 |
| `headers` | `Headers` (Map-like) |
| `json()` | JSON parsing → Promise |
| `text()` | the body as a string |
| `blob()` | binary data |
| `arrayBuffer()` | raw bytes |

The body can be read **only once**:

```javascript
const res = await fetch("http://localhost:8090/api/v1/items");
await res.json();
// await res.json(); // TypeError: body stream already read
```

For re-parsing — `clone()`:

```javascript
const res = await fetch(url);
const copy = res.clone();
const a = await res.json();
const b = await copy.json(); // the same JSON twice — rarely needed
```

---

## Checking for HTTP errors

**Critical:** `fetch` does **not reject** on 404, 500, etc. It rejects on a network error, an invalid URL (sometimes), or a cancellation (`AbortError`).

```javascript
const res = await fetch("http://localhost:8090/api/v1/items/99999");

if (!res.ok) {
  const body = await res.text();
  throw new Error(`HTTP ${res.status}: ${body}`);
}

const item = await res.json();
```

Without an `ok` check, the code continues working with the FastAPI error body (`{"detail":"Not found"}`) as if it were a success.

---

## A wrapper for the mock-exams API

A pattern for the nodejs/react lessons — a single point for the base URL and errors:

```javascript
const API_BASE = "http://localhost:8090";

async function api(path, options = {}) {
  const res = await fetch(`${API_BASE}${path}`, {
    headers: {
      Accept: "application/json",
      ...options.headers,
    },
    ...options,
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`${res.status} ${body}`);
  }

  if (res.status === 204) {
    return null;
  }

  return res.json();
}

// usage
const items = await api("/api/v1/items");
console.log(items);
```

The FastAPI stand:

| URL | Purpose |
|-----|------------|
| [http://localhost:8090](http://localhost:8090) | API root |
| [http://localhost:8090/docs](http://localhost:8090/docs) | Swagger UI |
| [http://localhost:8090/health](http://localhost:8090/health) | health check |
| [http://localhost:8090/api/v1/items](http://localhost:8090/api/v1/items) | product catalog |

Starting the stand — [deploy/fastapi/README.md](../../deploy/fastapi/README.md). Related to the [fastapi](../fastapi/README.md) and [api-design](../api-design/README.md) courses.

---

## POST with JSON

```javascript
const newItem = await api("/api/v1/items", {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
  },
  body: JSON.stringify({
    name: "Keyboard",
    price: 79.99,
    description: "Mechanical",
  }),
});

console.log(newItem.id);
```

`Content-Type: application/json` tells the server the body format. FastAPI/Pydantic validates the schema — an invalid body → 422 with details in JSON.

Other methods:

```javascript
await api(`/api/v1/items/${id}`, { method: "PUT", body: JSON.stringify(patch) });
await api(`/api/v1/items/${id}`, { method: "DELETE" });
```

---

## Query parameters

```javascript
const params = new URLSearchParams({
  page: "1",
  limit: "10",
  q: "keyboard",
});

const url = `http://localhost:8090/api/v1/items?${params}`;
const res = await fetch(url);
```

`URLSearchParams` encodes special characters. An alternative:

```javascript
const u = new URL("/api/v1/items", "http://localhost:8090");
u.searchParams.set("page", "1");
const res = await fetch(u);
```

Don't build a query by string concatenation without encoding — spaces and `&` will break the URL.

---

## Headers and authorization (overview)

```javascript
await api("/api/v1/items", {
  headers: {
    Authorization: `Bearer ${token}`,
  },
});
```

Secrets — not in the URL, not in production client code (only public tokens / a BFF). The JWT flow — react-intermediate, nodejs-intermediate.

---

## AbortController: cancellation and timeout

```javascript
const controller = new AbortController();
const timeoutId = setTimeout(() => controller.abort(), 5000);

try {
  const res = await fetch("http://localhost:8090/api/v1/items", {
    signal: controller.signal,
  });
  const data = await res.json();
  console.log(data);
} catch (err) {
  if (err.name === "AbortError") {
    console.log("Request timed out or aborted");
  } else {
    throw err;
  }
} finally {
  clearTimeout(timeoutId);
}
```

On cancellation `fetch` rejects with a `DOMException` / `AbortError`. In React Strict Mode and when a component unmounts, cancellation prevents a setState after unmount.

---

## Parallel requests

```javascript
const [health, items] = await Promise.all([
  api("/health"),
  api("/api/v1/items"),
]);
```

See [27-async-await.md](27-async-await.md) — don't do two awaits in a row if the requests are independent.

---

## CORS (browser)

From the browser at `http://localhost:5173` (Vite), a request to `http://localhost:8090` is a **different origin** (the port counts). The browser applies **CORS**; the server must return headers like:

```http
Access-Control-Allow-Origin: http://localhost:5173
```

In **Node** (a script, a test without a browser) there's no CORS — it's a browser restriction. Configuring it on FastAPI — [api-design](../api-design/README.md), [browser-platform](../javascript-path.md).

The preflight `OPTIONS` for non-standard headers and methods is a separate topic in api-design.

---

## Node.js and the global fetch

As of **Node 18+** `fetch` is built in (Undici). Earlier:

```javascript
import fetch from "node-fetch";
```

The course labs assume Node LTS with a global `fetch` ([00-environment.md](00-environment.md)).

---

## Error handling: network vs HTTP vs JSON

```javascript
async function loadItems() {
  let res;
  try {
    res = await fetch("http://localhost:8090/api/v1/items");
  } catch (err) {
  // network, DNS, CORS (browser), abort
    console.error("Network:", err.message);
    throw err;
  }

  if (!res.ok) {
    console.error("HTTP:", res.status);
    throw new Error(`HTTP ${res.status}`);
  }

  try {
    return await res.json();
  } catch (err) {
    console.error("Invalid JSON");
    throw err;
  }
}
```

After `json()`, validate the shape of the data (in typescript-basic — Zod).

---

## Security

- **HTTPS** in production — don't send tokens over HTTP.
- Don't log full bodies with PII.
- **XSS:** don't insert `json` into `innerHTML` without sanitization ([browser-platform](../javascript-path.md)).
- Limit the response size on a BFF when proxying.

---

## fetch vs XMLHttpRequest

`fetch` is Promise-based, has a streaming body, and is the modern standard. `XMLHttpRequest` is legacy, still in old code. New code — `fetch` or HTTP clients (axios in nodejs — a wrapper with interceptors).

---

## Example: an end-to-end shop scenario

```javascript
async function printCatalog() {
  const items = await api("/api/v1/items");
  for (const item of items) {
    console.log(`${item.name}: $${item.price}`);
  }
}

await printCatalog();
```

The data from `:8090` matches what the Python tracks and the future react-basic use.

---

## Relation to the course

- [26-promises.md](26-promises.md) — fetch returns a Promise.
- [27-async-await.md](27-async-await.md) — await response.json().
- [28-lab-async.md](28-lab-async.md) — fakeFetch before the real stand.
- [32-error-handling.md](32-error-handling.md) — error strategies.
- [35-regex-json-date.md](35-regex-json-date.md) — JSON.parse boundaries.
- [deploy/fastapi](../../deploy/fastapi/README.md) — the `:8090` stand.

---

## Common mistakes

1. **Forgetting `await response.json()`** — working with the Response, not with the data.

2. **No `response.ok` check** — 404/500 treated as "success".

3. **Double reading of the body** — stream already read.

4. **Forgetting `JSON.stringify` in a POST body** — the server receives `[object Object]`.

5. **No `Content-Type: application/json`** — FastAPI may fail to parse the body.

6. **CORS in the browser** — an error in the console, while in Node everything "works".

7. **Secrets in the query string** — logged by proxies and in history.

8. **A huge JSON without pagination** — blocking during parse ([24-event-loop.md](24-event-loop.md)).

---

## Summary

`fetch` returns a Promise<Response>. A successful Promise means a **response** was received, not necessarily HTTP 200. Check `ok` and the status. The body is read once via `json()`/`text()`. POST requires `method`, `headers`, and `JSON.stringify(body)`. For mock-exams use the base `http://localhost:8090` and the paths `/api/v1/items`, `/health`, and the `/docs` documentation. `AbortController` cancels a request. CORS is only in the browser. Node 18+ has a built-in fetch.

---

## Checklist

- Does `fetch` reject on HTTP 500?
- How does `response` differ from the data after `json()`?
- Why check `response.ok`?
- How do you cancel a long-running request?
- How do you build a URL with a query without manual encoding?
- Why does a POST with an object in `body` break without stringify?
- Where in the repository do you bring up the API on port 8090?

Next lesson: [30. ES modules](30-es-modules.md).
