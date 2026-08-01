# 38. Interview Q&A: top 35 on Node.js

## Intro

Questions for **Middle Node / BFF** — not “what is npm,” but the event loop under load, middleware order, stream backpressure, designing a proxy. Answer **out loud for 1–2 minutes** first, then check the walkthrough. Spoiler-free cheatsheet: [interview-cheatsheet.md](interview-cheatsheet.md).

---

## Block 1. Event loop and libuv

### 1. What makes up the Node event loop?

**Answer.** One JS thread + **libuv** for I/O. The loop walks phases: **timers** (`setTimeout`) → **pending callbacks** → **idle/prepare** → **poll** (I/O) → **check** (`setImmediate`) → **close callbacks**. Between phases, **microtasks** run (`Promise.then`, `queueMicrotask`). **`process.nextTick`** is a separate queue that runs **before** the next microtask after the current operation.

**Where in the course:** [04-event-loop-libuv.md](04-event-loop-libuv.md), [05-nexttick-setimmediate.md](05-nexttick-setimmediate.md).

---

### 2. Order: `setTimeout(0)`, `Promise.then`, `nextTick`, `setImmediate`?

**Answer.** Sync code → `nextTick` → microtasks (Promise) → **next loop phase** (often timers, then poll/check) → `setImmediate` vs `setTimeout(0)` depends on context (inside an I/O callback `setImmediate` usually runs before `setTimeout`).

**Where in the course:** [06-lab-event-loop.md](06-lab-event-loop.md).

---

### 3. How does the Node event loop differ from asyncio?

**Answer.** Both are **single-threaded** cooperative multitasking for I/O. asyncio: `await` + Task + Python loop. Node: libuv phases + microtasks. Blocking sync code **stops both**. CPU-bound in Node — `worker_threads` / separate process; in Python — ProcessPool.

**Where in the course:** [07-python-async-comparison.md](07-python-async-comparison.md).

---

### 4. Why is `fs.readFileSync` dangerous on a server?

**Answer.** It **blocks** the event loop — all HTTP requests wait. Under load, latency spikes. Use `fs.promises.readFile` or streams; for CPU — workers.

**Where in the course:** [10-fs-path.md](10-fs-path.md), [08-async-io-patterns.md](08-async-io-patterns.md).

---

### 5. What is the libuv thread pool?

**Answer.** Some operations (certain `fs`, DNS `lookup`, crypto) run in a **thread pool** (default 4); the result returns to the loop. Don't confuse with “Node is multithreaded for JS” — JS is still one thread.

**Where in the course:** [04-event-loop-libuv.md](04-event-loop-libuv.md).

---

## Block 2. Modules and built-in APIs

### 6. CJS vs ESM in Node — when which?

**Answer.** **ESM:** `import`/`export`, `"type":"module"` in package.json, top-level await. **CJS:** `require`, `module.exports`, sync loading. Mixing via `createRequire`. New projects — ESM; legacy npm — often CJS.

**Where in the course:** [09-modules-cjs-esm.md](09-modules-cjs-esm.md).

---

### 7. Why streams instead of `readFile` + `split`?

**Answer.** **Backpressure** and **constant memory** — you process chunks, not load a 2 GB file into RAM. `pipeline()` propagates errors and `destroy`. HTTP request/response are streams.

**Where in the course:** [13-streams.md](13-streams.md), [14-lab-streams.md](14-lab-streams.md).

---

### 8. Readable vs Writable vs Transform?

**Answer.** **Readable** — data source (`read()`, `data` events). **Writable** — sink (`write()`, `end()`). **Transform** — both readable and writable (gzip, parse line-by-line). **`Duplex`** — two independent channels (TCP socket).

**Where in the course:** [13-streams.md](13-streams.md).

---

### 9. What is a Buffer?

**Answer.** Binary data outside the JS heap — raw bytes for files, network, crypto. Encodings `utf8`, `hex`, `base64`. Don't confuse with a string: `Buffer.from("a")` ≠ `"a"` for binary protocols.

**Where in the course:** [12-buffers-encoding.md](12-buffers-encoding.md).

---

### 10. `process.env` vs dotenv?

**Answer.** **`process.env`** — OS/container environment object. **dotenv** — loads `.env` into `process.env` at startup (dev). In prod — env from the orchestrator (K8s secrets, Docker `-e`), don't commit `.env`.

**Where in the course:** [28-env-config.md](28-env-config.md), [02-process.md](02-process.md).

---

## Block 3. HTTP and Express

### 11. Lifecycle of an HTTP request in Express?

**Answer.** TCP → Node `http` parses → `req`/`res` → **middleware** chain (`next()`) → route handler → response end. Error middleware (4 args) — after `next(err)`. Registration order = execution order.

**Where in the course:** [22-middleware.md](22-middleware.md), [21-express-routing.md](21-express-routing.md).

---

### 12. What does middleware do?

**Answer.** A function `(req, res, next) =>`. It can: log, parse body, check auth, **not call** `next()` — then the chain stops. **Mount path** — `app.use("/api", router)`.

**Where in the course:** [22-middleware.md](22-middleware.md).

---

### 13. How do you handle errors in an async route?

**Answer.** `try/catch` + `next(err)` or an `asyncHandler(fn)` wrapper. Otherwise a rejected Promise — unhandled rejection, client hangs. Centralized error handler — one JSON format.

**Where in the course:** [24-express-errors.md](24-express-errors.md).

---

### 14. Express vs Fastify — briefly?

**Answer.** Express — de facto standard, huge ecosystem, callback style. Fastify — schema-first, hooks, faster benchmarks, built-in JSON schema. mock-exams BFF — Express; Fastify — alternative in [27-fastify-overview.md](27-fastify-overview.md).

**Where in the course:** [27-fastify-overview.md](27-fastify-overview.md).

---

### 15. Why `express.json({ limit })`?

**Answer.** Body size limit — protection against **DoS** via huge JSON and accidental OOM. A sensible default limit (100kb–1mb) per endpoint.

**Where in the course:** [25-express-body-cors.md](25-express-body-cors.md), [36-security-basics.md](36-security-basics.md).

---

## Block 4. CORS, BFF, proxy

### 16. What is a BFF?

**Answer.** **Backend for Frontend** — a thin layer between the SPA and microservices: aggregation, UI-shaped format, hiding keys, CORS, cookie session. It doesn't duplicate all business logic — **orchestration** and adaptation.

**Where in the course:** [32-bff-pattern.md](32-bff-pattern.md).

---

### 17. Why a BFF if React can call FastAPI?

**Answer.** Hide API keys, single cookie domain, **aggregate** N requests into one, version for the UI, rate limit at the edge, avoid CORS in dev via one origin. Direct access — OK for an internal admin with OAuth.

**Where in the course:** [32-bff-pattern.md](32-bff-pattern.md), [33-proxy-aggregation.md](33-proxy-aggregation.md).

---

### 18. How do you proxy `/api/v1/items` to FastAPI?

**Answer.** BFF route `GET /api/v1/items` → `fetch(`${FASTAPI_URL}/api/v1/items`)` → forward status/body or map. Headers: `Content-Type`, optionally `X-Request-Id`. Timeout via `AbortSignal.timeout(ms)`.

**Where in the course:** [33-proxy-aggregation.md](33-proxy-aggregation.md), [20-fastapi-client.md](20-fastapi-client.md).

---

### 19. CORS — who checks and when?

**Answer.** The **browser** before JS reads the response. Preflight `OPTIONS` for non-simple requests. Server responds with `Access-Control-Allow-Origin` (not `*` with credentials). BFF on `:3096`, React on `:5173` — different origins → CORS on the BFF.

**Where in the course:** [25-express-body-cors.md](25-express-body-cors.md).

---

### 20. What is preflight?

**Answer.** The browser sends `OPTIONS` with `Access-Control-Request-Method/Headers`. The server must answer 204/200 with allow headers. Forgotten `OPTIONS` on a route → CORS fail in the browser, curl OK.

**Where in the course:** [25-express-body-cors.md](25-express-body-cors.md).

---

## Block 5. Logging, config, security

### 21. Why pino instead of console.log?

**Answer.** **Structured JSON** — parsing in ELK/Loki, levels, child loggers, low overhead. `pino-http` — `req.id`, duration, status. `console.log` — not machine-readable, no correlation.

**Where in the course:** [30-logging-pino.md](30-logging-pino.md).

---

### 22. What to log on every HTTP request?

**Answer.** Minimum: method, path, status, duration, **requestId**. Don't log: passwords, full Authorization, PII without redaction. Errors — `err` object with stack **in the log only**.

**Where in the course:** [31-lab-logging.md](31-lab-logging.md), [36-security-basics.md](36-security-basics.md).

---

### 23. `/health` vs `/health/ready`?

**Answer.** **Liveness** — process is alive (`/health`). **Readiness** — ready to take traffic (upstream FastAPI ping, DB). K8s uses both probes differently.

**Where in the course:** capstone [39-capstone.md](39-capstone.md).

---

### 24. Why helmet?

**Answer.** Security HTTP headers: `X-Content-Type-Options`, frame guard, remove `X-Powered-By`. Reduces browser-side attack surface and information disclosure.

**Where in the course:** [36-security-basics.md](36-security-basics.md).

---

### 25. Rate limiting — where to put it?

**Answer.** On the **public boundary** (BFF/nginx) — flood protection. On auth endpoints — stricter. In-memory OK for one instance; Redis — multiple replicas. Respond **429** + `Retry-After`.

**Where in the course:** [36-security-basics.md](36-security-basics.md).

---

## Block 6. Debugging and production

### 26. `node --inspect` vs `--inspect-brk`?

**Answer.** `--inspect` — debugger port open, code runs. `--inspect-brk` — **pause at start** until Chrome/VS Code attach. For short scripts — `-brk`, otherwise the process may finish before attach.

**Where in the course:** [37-debugging.md](37-debugging.md).

---

### 27. How do you debug “502 from BFF, curl FastAPI OK”?

**Answer.** Separate layers: curl upstream → curl BFF → breakpoint in the proxy handler → check `fetch` status, timeout, URL from env (`FASTAPI_URL` trailing slash). Logs with `req.id`.

**Where in the course:** [37-debugging.md](37-debugging.md), [33-proxy-aggregation.md](33-proxy-aggregation.md).

---

### 28. Why not send a stack trace to the client?

**Answer.** Information disclosure: paths, versions, vulnerability hints. Stack — only in structured logs. Client gets `{ error: "internal_server_error" }`.

**Where in the course:** [36-security-basics.md](36-security-basics.md).

---

### 29. Unhandled rejection — what happens?

**Answer.** Node 15+ by default may **terminate the process** on unhandled rejection. On a server — global handler + fix async routes. Promise rejection without `.catch` in fire-and-forget — a bug.

**Where in the course:** [24-express-errors.md](24-express-errors.md), [08-async-io-patterns.md](08-async-io-patterns.md).

---

### 30. Graceful shutdown — why?

**Answer.** SIGTERM → stop accepting new connections, wait for in-flight requests, close pool/Redis, exit 0. Avoids cutting mid-request on deploy. More in nodejs-advanced.

**Where in the course:** overview in [02-process.md](02-process.md).

---

## Block 7. Architecture and misc

### 31. Folder structure for a Node BFF?

**Answer.** `src/index.js` entry, `config.js`, `app.js` factory, `routes/`, `middleware/`, `services/` (upstream client), `errors.js`. Not one 800-line `index.js` — [35-project-structure.md](35-project-structure.md).

**Where in the course:** [35-project-structure.md](35-project-structure.md).

---

### 32. Singleton vs factory for an HTTP client?

**Answer.** Reuse **keep-alive** agents (Undici/fetch default in Node 18+) — fewer TCP handshakes. Don't create a new `fetch` wrapper per request with heavy TLS options.

**Where in the course:** [18-http-client.md](18-http-client.md), [33-proxy-aggregation.md](33-proxy-aggregation.md).

---

### 33. When to use raw `http` vs Express?

**Answer.** `http` — learning, ultra-minimal, full control. Express — routing, middleware ecosystem, BFF development speed. Fastify — performance + schema.

**Where in the course:** [15-http-module.md](15-http-module.md), [21-express-routing.md](21-express-routing.md).

---

### 34. `fetch` in Node — nuances vs the browser?

**Answer.** Global since Node 18+. No CORS enforcement (server-side). `response.ok` false for 4xx/5xx — **does not throw**. Use `AbortSignal.timeout`. Undici under the hood.

**Where in the course:** [18-http-client.md](18-http-client.md), [20-fastapi-client.md](20-fastapi-client.md).

---

### 35. How do you explain “Node is single-threaded but concurrent”?

**Answer.** One **JS thread** runs callbacks in order. **I/O** is delegated to the OS/libuv; while waiting on disk/network, the loop serves other requests. Concurrency via **non-blocking I/O**, not parallel JS on one core.

**Where in the course:** [04-event-loop-libuv.md](04-event-loop-libuv.md), [01-landscape.md](01-landscape.md).

---

## After this chapter

1. Work through [interview-cheatsheet.md](interview-cheatsheet.md) again without peeking.
2. Weak blocks — return to lessons in the “Where in the course” column.
3. Next step: [39-capstone.md](39-capstone.md) — Shop BFF.
