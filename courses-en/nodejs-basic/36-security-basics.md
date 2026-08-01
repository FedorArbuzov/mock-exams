# 36. Security: helmet, rate limit, stack traces

## A scenario from work

Friday, 5:00 PM. The React client on `:5173` already talks to your BFF on `:3096`, which proxies FastAPI `:8090`. Slack gets a screenshot: the response to `POST /api/v1/items` with broken JSON includes a **full Node.js stack trace** with paths to `examples/src/routes/items.js`. At the same time the CI security scanner complains: no `X-Content-Type-Options` header, and `/health` returns `X-Powered-By: Express`. Ticket: “close the obvious stuff before release.”

You're not building zero-trust in a day — but **basic HTTP-server hygiene** is already required at `nodejs-basic` level. This chapter is three practical layers: security headers, request rate limiting, and safe error handling.

## What you'll learn

- Why the BFF is a public boundary and which risks we close early
- Configuring **helmet** and middleware order in the Express chain
- **Rate limiting** concept: algorithms, 429, in-memory vs Redis
- Why a **stack trace** must not go to the client and where to write the full `err`
- Dev/prod differences in JSON error shape
- Practice: lab with an unsafe error handler

## Why security on the BFF

The BFF is a **public boundary** for the browser. Even if FastAPI is “behind the proxy” and not reachable directly:

| Risk | What an attacker / scanner sees |
|------|----------------------------|
| Verbose errors | file paths, package versions, SQL/ORM hints |
| Missing security headers | XSS via reflected content, clickjacking |
| No rate limit | brute-force login, DoS on `/api/*`, upstream exhaustion |
| Env leaking into logs | `DATABASE_URL`, API keys in pino JSON |

Full OWASP coverage — in [`secrets-advanced`](../secrets-advanced/README.md) and [`nodejs-advanced`](../javascript-path.md). Here — the **minimum** that's not embarrassing in code review.

## Helmet: default HTTP headers

[`helmet`](https://helmetjs.github.io/) — Express middleware (and compatible frameworks) that sets **recommended headers**:

```javascript
import express from "express";
import helmet from "helmet";

const app = express();

app.use(helmet());
// or selectively:
// app.use(helmet({ contentSecurityPolicy: false })); // if CSP breaks dev inline scripts
```

### What Helmet usually adds

| Header | Why |
|-----------|-------|
| `X-Content-Type-Options: nosniff` | browser won't “guess” MIME |
| `X-Frame-Options: SAMEORIGIN` / CSP `frame-ancestors` | clickjacking protection |
| `Strict-Transport-Security` | HSTS (only behind HTTPS in prod) |
| `X-Powered-By` | **removes** the “Express” leak |
| Content-Security-Policy | limits script/style sources (tune for the SPA) |

### CSP and React dev

On `:5173` Vite uses inline HMR — a strict CSP on the BFF does **not** replace frontend CSP. For a BFF JSON API often enough:

```javascript
app.use(
  helmet({
    contentSecurityPolicy: {
      useDefaults: true,
      directives: {
        defaultSrc: ["'none'"],
        frameAncestors: ["'none'"],
      },
    },
  })
);
```

Or disable CSP on the BFF if it only serves JSON — but keep Helmet's **other** headers.

### Middleware order

Helmet — **before** routes, right after creating `app`:

```text
helmet → cors → pino-http → body parser → routes → error handler
```

See [22-middleware.md](22-middleware.md): chain order is critical.

## Rate limiting: concept

**Rate limiting** — capping the number of requests in a time window (per IP, per user, per API key). Goals:

1. **Protect upstream** — FastAPI `:8090` shouldn't get 10,000 req/s from one client.
2. **Protect Node resources** — every proxy request = memory + socket + CPU on JSON parse.
3. **Brute-force** — login/register (in `nodejs-intermediate`).

### Algorithms (overview)

| Algorithm | Behavior |
|----------|-----------|
| Fixed window | N requests per minute; burst at the window edge |
| Sliding window | more accurate, more memory |
| Token bucket | “burst” + average rate |
| Leaky bucket | smoothing bursts |

In an interview it's enough to say: “we count key `(ip, route)` over an interval; on excess — **429 Too Many Requests** with `Retry-After`.”

### In-memory vs Redis

```text
Single BFF instance     → in-memory Map (express-rate-limit store: memory)
N replicas behind nginx → Redis / shared store (nodejs-advanced)
```

For the capstone and labs **in-memory** is enough; in prod behind a balancer — shared store.

### Example with express-rate-limit (concept)

The package isn't in the course's minimal `examples/package.json` — install it for the lab:

```bash
npm install express-rate-limit
```

```javascript
import rateLimit from "express-rate-limit";

const apiLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 100,
  standardHeaders: true, // RateLimit-* headers
  legacyHeaders: false,
  message: { error: "too_many_requests" },
});

app.use("/api/", apiLimiter);

const strictAuthLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  skipSuccessfulRequests: true,
});

app.use("/api/v1/auth/login", strictAuthLimiter);
```

### What to respond to the client

- Status **429**, not 500.
- JSON body in the same format as other BFF errors.
- **`Retry-After`** header (seconds) — if the library supports it.
- Do **not** disclose internal upstream limits.

### Rate limit on BFF vs FastAPI

| Layer | What we limit |
|------|------------------|
| BFF | aggressive browser, scripts, edge DDoS |
| FastAPI | business-critical endpoints, auth, write |

Defense in depth: both levels can limit, with different quotas.

## Don't send stack traces to the client

### Anti-pattern

```javascript
app.use((err, req, res, next) => {
  res.status(500).json({
    error: err.message,
    stack: err.stack, // ← NEVER in a production response
  });
});
```

The client (and an attacker) sees:

- absolute paths `/app/examples/src/...`;
- dependency versions from messages;
- sometimes SQL/validation fragments.

### Correct error handler

```javascript
app.use((err, req, res, next) => {
  const status = err.status ?? err.statusCode ?? 500;
  const isServerError = status >= 500;

  if (isServerError) {
    req.log?.error({ err }, "unhandled error");
  }

  const body = {
    error: isServerError ? "internal_server_error" : err.code ?? "request_error",
    message: isServerError ? "Internal server error" : err.message,
    requestId: req.id,
  };

  res.status(status).json(body);
});
```

Principles:

1. **To the client** — stable error code + safe message.
2. **To the log (pino)** — full `err` with stack ([30-logging-pino.md](30-logging-pino.md)).
3. **`NODE_ENV=production`** — no stack/details in JSON; in development you can expand the body for DX.

### Dev vs prod

```javascript
const isProd = process.env.NODE_ENV === "production";

res.status(500).json({
  error: "internal_server_error",
  ...(isProd ? {} : { detail: err.message, stack: err.stack }),
});
```

Don't rely on `NODE_ENV` alone for secrets — but for **response shape** it's standard.

### Async errors

A forgotten `catch` in an async handler — unhandled rejection or hung request. Use the wrapper from [24-express-errors.md](24-express-errors.md):

```javascript
const asyncHandler = (fn) => (req, res, next) =>
  Promise.resolve(fn(req, res, next)).catch(next);
```

## Extra hygiene (checklist)

| Practice | Details |
|----------|--------|
| Body validation | don't trust the client; Zod/joi in intermediate |
| Body size | `express.json({ limit: "100kb" })` |
| CORS | not `origin: *` with credentials ([25-express-body-cors.md](25-express-body-cors.md)) |
| Secrets | `.env` in `.gitignore`, don't log tokens |
| Dependencies | `npm audit`, renovate/dependabot |
| HTTPS | terminate TLS on nginx/ingress, not bare Node in prod |

## Lab: unsafe vs safe error handler

File [`examples/lab/unsafe-error-handler.js`](examples/lab/unsafe-error-handler.js) — intentionally bad handler. Task:

1. Run with `NODE_ENV=production`, trigger an error — confirm stack is **not** in the body.
2. Rewrite the handler as above; confirm stack appears in pino logs.
3. Mount `helmet()` and check headers with `curl -I`.

**Success criteria:** `curl -i` shows security headers; 500 response — `{ "error": "internal_server_error" }` without `stack`.

## Common mistakes

1. **Helmet after routes** — headers don't apply to all responses.
2. **Rate limit only on login** — forgot GET flood on `/api/v1/items`.
3. **Logging stack to stdout and the response** — double leak.
4. **Trusting `err.message` from upstream** — forwarding FastAPI detail may include SQL; map to your own codes.
5. **CORS `*` + cookie auth** — browser model breaks; separate topic, but it comes up with security in review.

## Checklist

- What does `helmet()` do in Express and where to put it in the chain?
- Why rate-limit on the BFF if FastAPI can also limit?
- What's dangerous about a stack trace in a JSON response?
- Where to write the full stack — response or log?
- Why doesn't in-memory rate limit work “as-is” behind 3 replicas?
- Which HTTP status on limit exceeded?

Next lesson: [37. Debugging Node.js](37-debugging.md).
