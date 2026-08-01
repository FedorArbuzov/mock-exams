# 25. Body parser, static, CORS

## A scenario from work

React on `http://localhost:5173` sends `POST /api/v1/items` with a JSON body to the BFF on `:3096`. In DevTools: “CORS policy blocked” and “No 'Access-Control-Allow-Origin'”. Separately QA complains: “POST creates an item with `price: undefined`” — the body isn't parsed because the developer forgot middleware. Another ticket: “Serve `/docs` with static OpenAPI” — rarer for a BFF, but `express.static` helps for local fixtures.

The BFF is the bridge between browser and backend; **CORS and body parsing** are configured on Node, not on FastAPI, when the browser hits the BFF specifically.

## What you'll learn

- `express.json()` and size limits
- `express.urlencoded` for form-data
- The `cors` package and preflight OPTIONS
- `express.static` for files
- Middleware order relative to routes
- Difference: CORS on the BFF vs directly on FastAPI

---

## express.json() — parsing the JSON body

```javascript
import express from "express";

const app = express();

// Default limit ~100kb
app.use(express.json());

app.post("/api/v1/items", (req, res) => {
  console.log(req.body); // object, not a string
  const { name, price } = req.body;
  if (!name) {
    return res.status(400).json({ error: "name required" });
  }
  res.status(201).json({ id: "1", name, price });
});
```

With a limit to protect against huge payloads:

```javascript
app.use(express.json({ limit: "1mb" }));
```

On overflow — `413 Payload Too Large` (handle it in the error handler).

**Content-Type:** the client must send `Content-Type: application/json`. Otherwise `req.body` may be `{}`.

```bash
curl -X POST http://localhost:3096/api/v1/items \
  -H "Content-Type: application/json" \
  -d '{"name":"Pen","price":3.5}'
```

---

## express.raw and express.text (reference)

| Middleware | Content-Type | req.body |
|------------|--------------|----------|
| `express.json()` | application/json | object |
| `express.urlencoded()` | application/x-www-form-urlencoded | object |
| `express.raw()` | application/octet-stream | Buffer |
| `express.text()` | text/plain | string |

For the shop API, `json` is enough, plus sometimes `urlencoded` for legacy forms.

---

## express.urlencoded

```javascript
app.use(express.urlencoded({ extended: true }));
```

`extended: true` — the `qs` library, nested objects in forms. For a pure JSON API you can skip it.

---

## CORS — why on the BFF

Browser **Same-Origin Policy**: a page on `:5173` cannot read a response from `:3096` without CORS headers.

```text
React :5173  ──fetch──►  BFF :3096  ──►  FastAPI :8090
         ▲                      │
         └── CORS headers ──────┘
              (needed on the BFF)
```

If React talks **only** to the BFF, CORS on FastAPI for the browser is optional — server-to-server has no CORS.

---

## The cors package

```bash
npm install cors
```

```javascript
import cors from "cors";

const allowedOrigins = [
  "http://localhost:5173",   // Vite React dev
  "http://localhost:8097",   // deploy/react
];

app.use(
  cors({
    origin(origin, callback) {
      // curl / Postman — origin undefined, allow
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error("Not allowed by CORS"));
      }
    },
    credentials: true, // if cookies / Authorization from the browser
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization", "X-Request-Id"],
  })
);
```

Simple dev option (not for prod without an origin list):

```javascript
app.use(cors({ origin: "http://localhost:5173" }));
```

---

## Preflight OPTIONS

For `POST` with `Content-Type: application/json` the browser first sends **OPTIONS**:

```text
OPTIONS /api/v1/items
Access-Control-Request-Method: POST
Access-Control-Request-Headers: content-type
```

The `cors` package answers automatically. If CORS middleware is **after** auth that blocks OPTIONS without an API key — preflight breaks:

```javascript
// Solution: skip OPTIONS or put cors first
app.use(cors({ ... }));
app.use(requireApiKey); // only on needed prefixes, not globally
```

---

## credentials and wildcard

```javascript
// Not allowed: origin: "*" with credentials: true
cors({ origin: "*", credentials: true }); // browser will reject

// Need an explicit origin
cors({ origin: "http://localhost:5173", credentials: true });
```

---

## express.static

Serving files from a folder:

```javascript
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

app.use("/public", express.static(path.join(__dirname, "../public")));
// GET /public/logo.png → file public/logo.png
```

For the mock-exams BFF, static is optional (mock JSON, local docs). Don't confuse it with production nginx — there static often lives on the edge.

---

## Recommended middleware order

```javascript
app.use(requestLogger);
app.use(cors({ origin: allowedOrigins, credentials: true }));
app.use(express.json({ limit: "1mb" }));
app.use(express.urlencoded({ extended: true }));

app.use("/health", healthRouter);
app.use("/api/v1/items", itemsRouter);

app.use(notFoundHandler);
app.use(errorHandler);
```

CORS and parsers — **before** routes that read `req.body` or respond to the browser.

---

## Proxy POST: forwarding the body

With a BFF proxy the body is already parsed into `req.body`; when forwarding to FastAPI, serialize again:

```javascript
router.post("/", asyncHandler(async (req, res) => {
  const upstream = await fetch(`${FASTAPI_URL}/api/v1/items`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(req.body),
  });
  const data = await upstream.json();
  res.status(upstream.status).json(data);
}));
```

Alternative — stream the raw body (advanced); for labs JSON is enough.

---

## CORS errors in DevTools

| Message | Cause |
|-----------|---------|
| No 'Access-Control-Allow-Origin' | cors middleware not mounted or origin not in the list |
| Response to preflight doesn't pass | OPTIONS not handled |
| Credential flag is true but ACAO is * | see above |

Fix it on the **BFF server**, not in React.

---

## Related courses

- [22-middleware.md](22-middleware.md) — chain order.
- [26-lab-express-shop.md](26-lab-express-shop.md) — shop + CORS.
- [32-bff-pattern.md](32-bff-pattern.md) — why a BFF for the browser.
- [`api-design`](../api-design/README.md) — CORS chapter.
- [`react-basic`](../react-basic/README.md) — client `:5173`.

---

## Common mistakes

1. **No `express.json()`** — `req.body` undefined, silent bugs.

2. **CORS after routes** — preflight never arrives.

3. **`origin: "*"` + credentials** — browser blocks.

4. **Forgot Content-Type in curl** — body is not JSON for the server.

5. **Trust `req.body` without validation** — injection, wrong types.

6. **CORS only on FastAPI** — the browser still hits the BFF.

7. **Huge json limit** — DoS vector; sensible limit + 413 handler.

---

## Summary

`express.json()` parses the JSON body into `req.body` — mount it before POST/PATCH handlers. `cors` adds headers for cross-origin requests from React; in dev — an explicit origin `:5173`. Preflight OPTIONS is handled by the `cors` package. `express.static` serves files under a prefix. On the mock-exams BFF, CORS is required for the SPA; body parsing is needed for proxy POST to FastAPI.

---

## Checklist

- Why is `req.body` empty on POST from Postman with JSON?
- Which origin to allow for the Vite dev server?
- What is preflight and when does the browser send it?
- Why is `credentials: true` incompatible with `origin: "*"`?
- Where in the chain should `cors` sit relative to auth middleware?
- Why limit `express.json()`?
- Who should emit CORS — BFF or FastAPI, if the client is React?

Next lesson: [26. Lab: shop routes on Express](26-lab-express-shop.md).
