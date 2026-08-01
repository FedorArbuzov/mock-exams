# Node.js Basic — interview cheatsheet

Check yourself **without peeking**, then open the walkthroughs in [38-interview-qa.md](38-interview-qa.md).

---

## Event loop (libuv)

```text
sync → nextTick queue → microtasks (Promise.then) → libuv phase → …
```

| Phase | Examples |
|------|---------|
| timers | setTimeout, setInterval |
| poll | I/O callbacks |
| check | setImmediate |
| close | socket.on('close') |

| API | When |
|-----|-------|
| `process.nextTick` | before microtasks after the current operation |
| `queueMicrotask` | microtask queue |
| `setImmediate` | check phase |
| `setTimeout(0)` | timers phase |

**Rule:** synchronous CPU code blocks everything. I/O is non-blocking via libuv (+ thread pool for some fs/crypto/DNS).

**vs asyncio:** both single-threaded cooperative I/O; Node — libuv phases, Python — await/Task.

---

## Modules

| | ESM | CJS |
|---|-----|-----|
| syntax | import/export | require/module.exports |
| enabling | `"type":"module"` | default / .cjs |
| top-level await | yes | no |

---

## Streams

| Type | Role |
|-----|------|
| Readable | source (HTTP req, fs read) |
| Writable | sink (HTTP res, fs write) |
| Transform | map/filter (gzip, csv line) |
| pipeline() | backpressure + error propagation |

**Why:** constant memory — don't load a 2 GB file into RAM via readFile.

---

## HTTP / Express

**Lifecycle:** TCP → http parser → middleware chain → handler → res.end.

**Middleware:** `(req, res, next) =>`; without `next()` — stop. Errors: `(err, req, res, next)`.

**Typical order:**

```text
helmet → cors → pino-http → express.json → routes → errorHandler
```

**Async errors:** try/catch + next(err) or an asyncHandler wrapper.

---

## fetch (Node 18+)

- 4xx/5xx — **do not throw**; check `response.ok`.
- Timeout: `AbortSignal.timeout(ms)`.
- On the server — **no** CORS check (the browser does that).

---

## BFF

**Backend for Frontend** — layer between SPA and API:

- proxy / aggregation
- hiding keys
- CORS for the browser
- format for the UI
- rate limit at the edge

**mock-exams:** React `:5173` → BFF `:3096` → FastAPI `:8090`.

---

## CORS

- Checked by the **browser**, not curl.
- Preflight: OPTIONS + Allow-Headers/Methods.
- `credentials: true` → origin is **not** `*`.
- BFF sets headers for dev origins 5173.

---

## Env and config

- `process.env` — source of truth in prod (K8s/Docker).
- dotenv — dev `.env` → `process.env`.
- Don't commit secrets; validate required variables at startup.
- `FASTAPI_URL` without a trailing slash.

---

## Logging (pino)

- JSON lines → Loki/ELK.
- `pino-http`: method, url, status, duration, **req.id**.
- Forward `X-Request-Id` upstream.
- Stack — **in the log**, not in the HTTP response body.

---

## Health

| Route | Meaning |
|---------|-------|
| `/health` | liveness — process is alive |
| `/health/ready` | readiness — upstream OK |

---

## Security (basic level)

| Measure | Why |
|------|-------|
| helmet | security headers, remove X-Powered-By |
| rate limit | 429 on flood/brute-force; in-memory vs Redis |
| json limit | protect against huge body (DoS) |
| no stack in prod response | path and version leaks |
| NODE_ENV=production | safe error shape |

---

## Debugging

| Command | Effect |
|---------|--------|
| `node --inspect` | debug port, code runs |
| `node --inspect-brk` | pause until attach |
| VS Code Attach :9229 | breakpoints in handlers |

**Prod:** logs + requestId + metrics; don't open `--inspect` on a public port.

---

## Process

| | |
|---|---|
| SIGTERM | graceful shutdown (stop accept, drain) |
| unhandledRejection | may kill the process — fix async |
| exit code | 0 ok, non-zero error |

---

## Project structure

```text
src/index.js      # bootstrap
src/app.js        # createApp
src/config.js     # env
src/routes/
src/services/     # upstream client
src/middleware/
```

---

## Quick Q&A (one line)

| Question | Answer |
|--------|-------|
| Is Node single-threaded? | one JS thread; I/O async via libuv |
| readFileSync on a server? | blocks the loop — bad |
| Express vs Fastify? | Express — ecosystem; Fastify — schema, speed |
| Why a BFF if there's an API? | CORS, aggregation, hide keys, API shaped for UI |
| 502 vs 503 from BFF? | 502 — bad upstream response; 503 — unavailable |
| ECONNREFUSED | upstream isn't listening on the port |
| Middleware after routes? | won't run for a matched route |
| Buffer vs string? | binary vs text; encoding matters |

---

## Smoke commands

```bash
curl -s http://localhost:3096/health
curl -s http://localhost:3096/health/ready
curl -s http://localhost:3096/api/v1/items
curl -H "Origin: http://localhost:5173" -I http://localhost:3096/api/v1/items
```

---

## mock-exams ports

| Service | Port |
|--------|------|
| FastAPI | 8090 |
| Shop BFF | 3096 |
| React Vite | 5173 |

---

## Related courses

- Event loop comparison → [python-async](../python-async/README.md)
- REST upstream → [fastapi](../../deploy/fastapi/README.md)
- UI client → [react-basic](../react-basic/README.md)
- JWT/DB next → nodejs-intermediate
