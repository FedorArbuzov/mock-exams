# 16. Lab: a minimal HTTP server on :3096

The goal is to **stand up a BFF skeleton** on plain `node:http`: `/health`, `/api/v1/items` from a local JSON, correct statuses and headers. Port **3096** is the mock-exams lab standard (the Express BFF later runs on the same port).

**Time:** ~30–40 minutes after [15-http-module.md](15-http-module.md).

## Setup

```bash
cd courses/nodejs-basic/examples
node --version
```

Reference: `solutions/lab/16-http-server.js`.

---

## Structure

```text
lab/
├── 16-server.js
└── data/
    └── catalog.json    # from lab 11 or a copy
```

---

## Task 1. The `sendJson` helper

```javascript
// lab/16-server.js
function sendJson(res, statusCode, payload) {
  const body = JSON.stringify(payload);
  res.writeHead(statusCode, {
    "Content-Type": "application/json; charset=utf-8",
    "Content-Length": Buffer.byteLength(body, "utf8"),
  });
  res.end(body);
}
```

---

## Task 2. Load the catalog on startup

```javascript
import { readFile } from "node:fs/promises";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const catalogPath = join(__dirname, "data", "catalog.json");

let catalogCache;

async function loadCatalogOnce() {
  const raw = await readFile(catalogPath, "utf8");
  catalogCache = JSON.parse(raw);
}

await loadCatalogOnce();
```

For the lab an in-memory cache is OK; the capstone — a proxy to FastAPI `:8090`.

---

## Task 3. Routing (simple)

```javascript
import { createServer } from "node:http";

const server = createServer((req, res) => {
  const { method, url } = req;

  if (method === "GET" && url === "/health") {
    sendJson(res, 200, {
      status: "ok",
      service: "lab-16-bff",
      items: catalogCache.items.length,
    });
    return;
  }

  if (method === "GET" && url === "/api/v1/items") {
    sendJson(res, 200, { items: catalogCache.items });
    return;
  }

  sendJson(res, 404, { error: "Not found", path: url });
});

const PORT = 3096;
const HOST = "127.0.0.1";

server.listen(PORT, HOST, () => {
  console.log(`http://${HOST}:${PORT}/health`);
});
```

---

## Task 4. Smoke tests with curl

Terminal 1:

```bash
node lab/16-server.js
```

Terminal 2:

```bash
curl -i http://127.0.0.1:3096/health
curl -s http://127.0.0.1:3096/api/v1/items | head -c 200
curl -i http://127.0.0.1:3096/unknown
```

**Expected:**

- `/health` → `200`, JSON with `"status":"ok"`
- `/api/v1/items` → `200`, an `items` array
- `/unknown` → `404`, JSON `{ "error": "Not found", ... }`

---

## Task 5. GET a single item by id

Add the route `/api/v1/items/kb-001` (for now **without** the URL class — a simple `startsWith` + slice):

```javascript
if (method === "GET" && url.startsWith("/api/v1/items/")) {
  const id = url.slice("/api/v1/items/".length);
  const item = catalogCache.items.find((x) => x.id === id);
  if (!item) {
    sendJson(res, 404, { error: "Item not found", id });
    return;
  }
  sendJson(res, 200, item);
  return;
}
```

Check:

```bash
curl -s http://127.0.0.1:3096/api/v1/items/kb-001
curl -i http://127.0.0.1:3096/api/v1/items/missing
```

Improved URL parsing — [17-url-routing.md](17-url-routing.md).

---

## Task 6. Method not allowed

```javascript
if (url === "/health" && method !== "GET") {
  sendJson(res, 405, { error: "Method not allowed" });
  return;
}
```

```bash
curl -i -X POST http://127.0.0.1:3096/health
```

---

## Task 7. Request logging

Before routing:

```javascript
const started = Date.now();
res.on("finish", () => {
  console.log(method, url, res.statusCode, `${Date.now() - started}ms`);
});
```

---

## Success criteria

- [ ] The server listens on **127.0.0.1:3096**
- [ ] `/health` → 200 JSON
- [ ] `/api/v1/items` → 200 with an array
- [ ] A nonexistent item → 404 JSON
- [ ] An unknown path → 404 JSON
- [ ] POST `/health` → 405
- [ ] All JSON responses have `Content-Type: application/json; charset=utf-8`
- [ ] The logs show the processing time after each request

---

## If something goes wrong

| Symptom | Check |
|---------|----------|
| `EADDRINUSE` | another process on 3096 — `npm run dev` or an old node |
| Empty items | the path to catalog.json via `__dirname` |
| `ERR_HTTP_HEADERS_SENT` | `return` after each `sendJson` |
| curl hangs | you forgot `res.end()` |
| JSON invalid | catalog.json UTF-8, valid syntax |

---

## Reflection

Why listen on `127.0.0.1` rather than `0.0.0.0` on a dev machine?

---

Next lesson: [17. URL, query string, manual routing](17-url-routing.md).
