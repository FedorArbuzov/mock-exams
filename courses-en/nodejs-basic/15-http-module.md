# 15. The `http` module: server and requests

## A scenario from work

Team lead: "To understand Express, stand up a **raw** HTTP server on `http`. The BFF on `:3096` should answer `/health` with JSON and return a 404 with a body, not an empty cutoff." A junior writes `res.end(JSON.stringify({ ok: true }))` without a status or a header — the React client gets `200` with `text/plain`, and `response.json()` sometimes fails. A second bug: they forgot `res.end()` — the client hangs until timeout. A third: on `POST` they don't read the body and wonder why `req.body` is undefined (it **doesn't exist** in core `http`).

The **`node:http`** module is the minimal HTTP/1.1 server and client in Node. Express/Fastify are built on top of these primitives. For mock-exams the BFF listens on **`:3096`**, the FastAPI backend on **`:8090`**.

## What you'll learn

- `http.createServer` and the request lifecycle
- The `IncomingMessage` (req) and `ServerResponse` (res) objects
- Status codes, `writeHead`, `setHeader`, `end`
- `Content-Type` and charset for JSON
- Reading the request body from a stream
- Graceful basics: one handler — one response

---

## Minimal server

```javascript
import { createServer } from "node:http";

const server = createServer((req, res) => {
  res.statusCode = 200;
  res.setHeader("Content-Type", "text/plain; charset=utf-8");
  res.end("Hello from Node BFF\n");
});

server.listen(3096, "127.0.0.1", () => {
  console.log("Listening http://127.0.0.1:3096");
});
```

Check:

```bash
curl -i http://127.0.0.1:3096/
```

The `-i` flag shows the status and headers.

---

## The request object `req`

| Property / method | Description |
|------------------|----------|
| `req.method` | `GET`, `POST`, … |
| `req.url` | path + query (`/items?page=1`) |
| `req.headers` | headers object (lowercase keys) |
| `req.httpVersion` | `1.1` |
| `req` as a stream | POST body — via `data` / async iteration |

```javascript
createServer((req, res) => {
  console.log(req.method, req.url);
  console.log("host:", req.headers.host);
  console.log("accept:", req.headers.accept);
  res.end("ok");
});
```

There is **no** `req.body`, `req.params`, `req.query` — those are added by a framework or by you ([17-url-routing.md](17-url-routing.md)).

---

## The response object `res`

| Method | Purpose |
|-------|------------|
| `res.statusCode = 404` | the code before sending headers |
| `res.setHeader(name, value)` | one header |
| `res.writeHead(code, headers)` | code + headers at once |
| `res.write(chunk)` | part of the body (optional) |
| `res.end(data?)` | finish the response |

**Rule:** exactly **one** final `res.end()` per request (or `end` after `write`).

---

## JSON and Content-Type

Clients (fetch, React) expect an explicit type:

```javascript
function sendJson(res, statusCode, data) {
  const body = JSON.stringify(data);
  res.writeHead(statusCode, {
    "Content-Type": "application/json; charset=utf-8",
    "Content-Length": Buffer.byteLength(body, "utf8"),
  });
  res.end(body);
}

createServer((req, res) => {
  if (req.url === "/health" && req.method === "GET") {
    sendJson(res, 200, { status: "ok", service: "shop-bff" });
    return;
  }
  sendJson(res, 404, { error: "Not found" });
});
```

`Content-Length` isn't required for small responses (Node will use chunked), but an explicit length helps some clients.

---

## Status codes — the minimum for a BFF

| Code | When | Body |
|-----|-------|------|
| 200 | successful GET | JSON data |
| 201 | resource created on POST | JSON + Location (later) |
| 400 | invalid request | `{ error: "..." }` |
| 404 | route not found | JSON, not an empty string |
| 405 | method not allowed | Allow header (later) |
| 500 | unhandled error | no stack trace to the outside |

```javascript
if (req.method !== "GET") {
  sendJson(res, 405, { error: "Method not allowed" });
  return;
}
```

More on REST — [`api-design`](../api-design/README.md).

---

## Health endpoint — the mock-exams pattern

```javascript
createServer((req, res) => {
  if (req.method === "GET" && req.url === "/health") {
    sendJson(res, 200, {
      status: "ok",
      uptime: process.uptime(),
      timestamp: new Date().toISOString(),
    });
    return;
  }
  // ...
});
```

The same contract as FastAPI [`/health`](../../deploy/fastapi/README.md) on `:8090` — convenient for the orchestrator and smoke tests.

---

## Reading the POST body

```javascript
async function readBody(req) {
  const chunks = [];
  for await (const chunk of req) {
    chunks.push(chunk);
  }
  return Buffer.concat(chunks).toString("utf8");
}

createServer(async (req, res) => {
  if (req.method === "POST" && req.url === "/echo") {
    const raw = await readBody(req);
    let data;
    try {
      data = JSON.parse(raw);
    } catch {
      sendJson(res, 400, { error: "Invalid JSON" });
      return;
    }
    sendJson(res, 200, { received: data });
    return;
  }
  sendJson(res, 404, { error: "Not found" });
});
```

A body size limit is mandatory in production; in Express — `express.json({ limit: "100kb" })`.

---

## Error handling in a handler

```javascript
createServer(async (req, res) => {
  try {
    await handle(req, res);
  } catch (err) {
    console.error(err);
    if (!res.headersSent) {
      sendJson(res, 500, { error: "Internal server error" });
    }
  }
});
```

If the headers have already been sent, a second `writeHead` is impossible; only `res.end()`.

---

## `res` as a Writable stream

A large file — stream it into the response ([13-streams.md](13-streams.md)):

```javascript
import { createReadStream } from "node:fs";
import { pipeline } from "node:stream/promises";

// inside the handler:
res.writeHead(200, { "Content-Type": "application/json; charset=utf-8" });
await pipeline(createReadStream(catalogPath), res);
```

---

## Link to Express (preview)

Express:

```javascript
app.get("/health", (req, res) => res.json({ status: "ok" }));
```

Under the hood — the same `http.createServer`, plus routing, middleware, body parser ([21-express-routing.md](21-express-routing.md)).

---

## Common mistakes

- **No `Content-Type: application/json`** — the client doesn't parse JSON.
- **Forgot `return` after a response** — a second `end` is called → `ERR_HTTP_HEADERS_SENT`.
- **A 404 with an empty body** — fetch ok=false, but `json()` fails on an empty string.
- **`req.url` without parsing** — confusing path and query; you need `URL` ([17-url-routing.md](17-url-routing.md)).
- **Listening on `0.0.0.0` in dev without need** — extra surface; for labs use `127.0.0.1`.

---

## Summary

- `http.createServer` takes a `(req, res)` callback for each request.
- Response: status + headers + **`res.end(body)`**.
- JSON API: **`Content-Type: application/json; charset=utf-8`** and meaningful 4xx/5xx codes.
- The request body is read from the **stream** `req`; core has no `req.body`.

## Checklist

- How does `res.writeHead` differ from `res.statusCode` + `setHeader`?
- Why do you need one `end` per request?
- What Content-Type for JSON in a BFF?
- Where do you get the HTTP method and path in core http?
- Why is it better to return a 404 with JSON `{ error }`?
- How do you read a POST body in an async handler?

Next lesson: [16. Lab: a raw HTTP server](16-lab-http-server.md).
