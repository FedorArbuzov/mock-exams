# 17. URL, query string, manual routing

## A scenario from work

The frontend requests `/api/v1/items?category=peripherals&page=2&limit=10`. The BFF on plain `http` gets `req.url === "/api/v1/items?category=peripherals&page=2&limit=10"`. The developer compares `url === "/api/v1/items"` — **always 404**. A second bug: a manual `split("?")` breaks on an encoded `?` in the query. A third: `/api/v1/items/kb-001` and `/api/v1/items/kb-001/` are treated as different routes.

The **`URL`** class (WHATWG) and **`URLSearchParams`** are the standard way to parse an address in Node and the browser. Before Express you build a **manual router** — switch/if on method + pathname.

## What you'll learn

- `new URL(req.url, base)` for relative paths on the server
- `url.pathname`, `url.searchParams`
- Manual routing: a route table, path parameters
- Normalizing a trailing slash
- The difference between routing in Node and the Express `Router`
- The link to the BFF `:3096` and FastAPI `:8090`

---

## The `req.url` problem

`req.url` contains **path + query**, without the host:

```text
/api/v1/items?category=peripherals&limit=5
```

A direct comparison with `/api/v1/items` **doesn't work**.

---

## The URL class on the server

You need a **base** with an origin (host + port):

```javascript
import { createServer } from "node:http";

createServer((req, res) => {
  const host = req.headers.host ?? "127.0.0.1:3096";
  const url = new URL(req.url, `http://${host}`);

  console.log(url.pathname);  // /api/v1/items
  console.log(url.search);    // ?category=peripherals&limit=5
  console.log(url.searchParams.get("category")); // peripherals
  console.log(url.searchParams.get("limit"));    // 5

  res.end("ok");
}).listen(3096);
```

| Property | Example |
|----------|--------|
| `pathname` | `/api/v1/items` |
| `searchParams` | `URLSearchParams` |
| `search` | `?a=1&b=2` |
| `href` | the full URL |

---

## URLSearchParams

```javascript
const params = url.searchParams;

const category = params.get("category"); // string | null
const page = Number(params.get("page") ?? "1");
const limit = Math.min(Number(params.get("limit") ?? "20"), 100);

if (category) {
  items = items.filter((x) => x.category === category);
}
```

Iteration:

```javascript
for (const [key, value] of url.searchParams) {
  console.log(key, value);
}
```

Building a query for a client:

```javascript
const q = new URLSearchParams({ category: "peripherals", page: "2" });
const path = `/api/v1/items?${q.toString()}`;
// /api/v1/items?category=peripherals&page=2
```

---

## Manual router — a route table

```javascript
const routes = [
  {
    method: "GET",
    pattern: /^\/health$/,
    handler: healthHandler,
  },
  {
    method: "GET",
    pattern: /^\/api\/v1\/items$/,
    handler: listItemsHandler,
  },
  {
    method: "GET",
    pattern: /^\/api\/v1\/items\/([^/]+)$/,
    handler: getItemHandler,
  },
];

function matchRoute(method, pathname) {
  for (const route of routes) {
    if (route.method !== method) continue;
    const m = pathname.match(route.pattern);
    if (m) return { route, params: m.slice(1) };
  }
  return null;
}

createServer((req, res) => {
  const host = req.headers.host ?? "127.0.0.1:3096";
  const url = new URL(req.url, `http://${host}`);
  const pathname = normalizePath(url.pathname);

  const matched = matchRoute(req.method, pathname);
  if (!matched) {
    sendJson(res, 404, { error: "Not found" });
    return;
  }
  matched.route.handler(req, res, url, matched.params);
});
```

---

## Path parameters

```javascript
function getItemHandler(req, res, url, params) {
  const [id] = params;
  const item = catalog.items.find((x) => x.id === id);
  if (!item) {
    sendJson(res, 404, { error: "Item not found", id });
    return;
  }
  sendJson(res, 200, item);
}
```

The regex `[^/]+` forbids a slash in the id — protection against traversal in the path.

---

## Query + path together

```javascript
function listItemsHandler(req, res, url) {
  let items = catalog.items;
  const category = url.searchParams.get("category");
  if (category) {
    items = items.filter((x) => x.category === category);
  }
  const q = url.searchParams.get("q");
  if (q) {
    const lower = q.toLowerCase();
    items = items.filter((x) => x.name.toLowerCase().includes(lower));
  }
  sendJson(res, 200, { items, count: items.length });
}
```

The contract is close to FastAPI query params on `:8090`.

---

## Trailing slash

```javascript
function normalizePath(pathname) {
  if (pathname.length > 1 && pathname.endsWith("/")) {
    return pathname.slice(0, -1);
  }
  return pathname;
}
```

Or a 308 redirect — in Express, `strict routing`. For labs, normalize is enough.

---

## Method dispatch

```javascript
function matchRoute(method, pathname) {
  // ...
}

// or a Map:
const handlers = new Map([
  ["GET /api/v1/items", listItems],
  ["GET /health", health],
]);

const key = `${req.method} ${pathname}`;
const handler = handlers.get(key);
```

Express uses `app.get`, `app.post` — sugar over the same thing.

---

## URL parsing errors

```javascript
try {
  const url = new URL(req.url, `http://${host}`);
} catch {
  sendJson(res, 400, { error: "Bad request URL" });
  return;
}
```

Invalid percent-encoding in the path — rare, but possible.

---

## The client side — the same URL API

```javascript
const base = "http://127.0.0.1:3096";
const url = new URL("/api/v1/items", base);
url.searchParams.set("category", "peripherals");

const res = await fetch(url);
```

See [18-http-client.md](18-http-client.md).

---

## Link to FastAPI

FastAPI `:8090`:

```text
GET /api/v1/items?skip=0&limit=10
```

The BFF `:3096` can **proxy** the query as-is ([20-fastapi-client.md](20-fastapi-client.md), [34-lab-bff.md](34-lab-bff.md)).

---

## Common mistakes

- **Comparing `req.url` without separating the query** — the route doesn't match.
- **A manual split("?")** instead of `URL` — breaks on encoding.
- **Duplicating `/items` and `/items/`** — 404 for half the clients.
- **Invalid `page`** — `Number("abc")` → NaN; you need validation.
- **A regex without `^` `$`** — a partial match of extra paths.

---

## Summary

- Parse the request via **`new URL(req.url, "http://" + host)`**.
- **`pathname`** — for routing; **`searchParams`** — for filters and pagination.
- Manual router: method + regex/switch + slash normalization.
- Express/Fastify add sugar, but the model is the same.

## Checklist

- Why does `req.url === "/api/v1/items"` break with a query string?
- How do you get `category` from `?category=peripherals`?
- Why the base URL in `new URL` on the server?
- How do you extract the `id` from `/api/v1/items/kb-001`?
- How is `URLSearchParams` convenient for building a query?
- Why normalize a trailing slash?

Next lesson: [18. HTTP client: `fetch` and headers](18-http-client.md).
