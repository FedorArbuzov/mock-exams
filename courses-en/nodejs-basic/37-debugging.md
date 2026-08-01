# 37. Debugging Node.js: `--inspect`, VS Code, production

## A scenario from work

The BFF on `:3096` proxies `/api/v1/items` to FastAPI. In the React browser — an empty list, no UI errors. `curl http://localhost:3096/api/v1/items` sometimes 502, sometimes 200. Pino logs show only `statusCode: 502`, no upstream body. A colleague asks: “did you set breakpoints or is it `console.log` in ten middleware again?”

Backend debugging isn't “guess from logs” — it's **reproduce → hypothesize → observe → fix**. In [javascript-basic/36-debugging.md](../javascript-basic/36-debugging.md) you already saw `console`, DevTools, and `--inspect` for plain JS. Here — a **Node server**, Express middleware chain, async I/O to `:8090`, and what changes in **production**.

## What you'll learn

- Debugging algorithm: repro → hypothesis → observe → fix
- `node --inspect` and `--inspect-brk`, Chrome DevTools, `debugger`
- Connecting **VS Code / Cursor**: attach and launch with nodemon
- Breakpoints in Express middleware and async handlers
- Diagnosing BFF → FastAPI proxy (`curl`, `fetch`, `req.id`)
- Production: structured logs, requestId, what not to do in prod
- Lab: async order and the event loop in `debug-async.js`

## Debugger mindset (short)

```text
1. Repro     — curl / one endpoint / minimal script
2. Hypothesis — “upstream timeout”, “CORS preflight”, “forgot await”
3. Observe   — breakpoint, watch, structured log field
4. Fix       — one change, re-check repro
5. Regression — health, other routes
```

For a BFF the first step is **separating layers**: is the problem in the BFF, FastAPI, or the client?

```bash
curl -s http://localhost:8090/api/v1/items | head
curl -s http://localhost:3096/api/v1/items | head
```

If upstream is OK and the BFF isn't — debug in `examples/src/`, not in React.

## `node --inspect` and `--inspect-brk`

Node embeds the **V8 Inspector** — the same protocol Chrome DevTools uses for Node.

```bash
cd courses/nodejs-basic/examples
node --inspect src/index.js
# Debugger listening on ws://127.0.0.1:9229/...
```

| Flag | Behavior |
|------|-----------|
| `--inspect` | inspector immediately, script runs |
| `--inspect-brk` | **pause on the first line** until attach |
| `--inspect=0.0.0.0:9229` | listen on all interfaces (Docker — careful, firewall) |

### Chrome DevTools

1. Start `node --inspect-brk src/index.js`.
2. Open `chrome://inspect`.
3. **Open dedicated DevTools for Node** → Sources → breakpoint in a handler.

### Programmatic breakpoint

```javascript
export function proxyItems(req, res) {
  debugger; // pause only if inspector is attached
  // ...
}
```

**Remove** `debugger` before merge — in prod with an open debug port it's a hole; without a port — just noise in code review.

### NODE_OPTIONS

```bash
NODE_OPTIONS='--inspect-brk' npm run dev
```

Handy if `nodemon` restarts the process — same inspector port (9229 by default).

## VS Code / Cursor: attach and launch

### Attach to a running process

1. Start the server: `node --inspect src/index.js`.
2. Run and Debug → **Attach** configuration:

```json
{
  "version": "0.2.0",
  "configurations": [
    {
      "type": "node",
      "request": "attach",
      "name": "Attach :9229",
      "port": 9229,
      "skipFiles": ["<node_internals>/**"]
    }
  ]
}
```

3. F5 → a breakpoint in `src/routes/proxy.js` fires on a real HTTP request.

### Launch with nodemon

```json
{
  "type": "node",
  "request": "launch",
  "name": "BFF dev",
  "runtimeExecutable": "npm",
  "runtimeArgs": ["run", "dev"],
  "console": "integratedTerminal",
  "skipFiles": ["<node_internals>/**"]
}
```

Add a `package.json` dev script with `--inspect` if needed:

```json
"dev:debug": "nodemon --inspect src/index.js"
```

### What to watch when paused

| Panel | For Express/BFF |
|--------|-----------------|
| **Variables** | `req.params`, `req.body`, locals |
| **Watch** | `process.env.FASTAPI_URL`, `res.statusCode` |
| **Call Stack** | which middleware called the handler |
| **Debug Console** | `await fetch(...)` **carefully** — side effects |

### Conditional breakpoint

Right-click a breakpoint → **Edit Breakpoint** → `req.path === "/api/v1/items" && req.method === "GET"`. Saves you on a hot path with hundreds of requests per second.

## Debugging the Express chain

### Middleware order

Symptom: “log never prints” — handler is **before** your middleware or `next()` wasn't called.

```javascript
app.use((req, res, next) => {
  req.log.info({ path: req.path }, "incoming");
  next();
});
```

Breakpoint in the **error handler** (4 args) — only after `next(err)`.

### Async handler

```javascript
app.get("/api/v1/items", async (req, res, next) => {
  try {
    const upstream = await fetch(`${config.fastapiUrl}/api/v1/items`);
    const data = await upstream.json();
    res.json(data);
  } catch (err) {
    next(err);
  }
});
```

Without `try/catch` or `asyncHandler` — rejection may **never reach** your error middleware; symptom is a hung request or a process warning.

### “Who changed status?”

Watch `res.statusCode` after `await` — sometimes double `res.json()` or `headers already sent`.

## Debugging the HTTP client to FastAPI

### curl vs fetch in Node

| Tool | When |
|------------|-------|
| `curl -v` | headers, TLS, raw body |
| `fetch` in Debug Console | reproduce the exact URL from `config` |
| breakpoint after `fetch` | `upstream.status`, `upstream.headers` |

Typical bugs:

- **ECONNREFUSED** — FastAPI isn't up (`docker compose up` in `deploy/fastapi`).
- **404** — wrong prefix (`/api/v1/items` vs `/items`).
- **504** — no timeout, hang forever ([33-proxy-aggregation.md](33-proxy-aggregation.md)).

### Logging instead of console.log

```javascript
req.log.info(
  { upstreamStatus: upstream.status, durationMs: elapsed },
  "proxy items"
);
```

Correlation: `req.id` from pino-http ([31-lab-logging.md](31-lab-logging.md)).

## Lab: async order and the event loop

File [`examples/lab/debug-async.js`](examples/lab/debug-async.js):

```bash
node --inspect-brk examples/lab/debug-async.js
```

1. Predict the `console.log` order **before** running.
2. Set a breakpoint on `setImmediate` / `Promise.then`.
3. Compare with [04-event-loop-libuv.md](04-event-loop-libuv.md).

**Criterion:** you can explain why microtasks run before the next timers phase.

## Production debugging: what changes

In prod there is **no** `--inspect-brk` on a public port by default. Main tools:

| Approach | Purpose |
|--------|------------|
| Structured logs (pino) | `level`, `reqId`, `err.stack` **in the log**, not the client |
| `X-Request-Id` / `req.id` | link browser → BFF → FastAPI |
| Health / ready | `GET /health`, `GET /health/ready` (upstream ping) |
| Metrics | RPS, latency p95 ([`observability-basic`](../observability-basic/README.md)) |
| Repro on staging | same Docker image, anonymized data |

### What not to do in prod

- SSH + `node --inspect=0.0.0.0` without a firewall — **remote code execution** risk.
- Enable `DEBUG=*` on all replicas — disk/PII flood.
- “Hot fix” via `console.log` without redeploying the image — loses reproducibility.

### Post-mortem workflow

1. Find `requestId` in the response or client logs.
2. `grep` pino JSON in Loki/ELK/pod stdout.
3. Check upstream logs on `:8090` with the same id (if you forward it).
4. Reproduce on staging with the same `FASTAPI_URL`.

### Source maps

TypeScript BFF (in `nodejs-intermediate`) — stack traces in logs point at `.ts`; you need source maps in the image. Pure JS in this course — maps optional.

## node inspect (CLI REPL debugger)

Legacy REPL:

```bash
node inspect examples/lab/debug-async.js
```

Commands: `cont`, `next`, `step`, `out`, `repl`. Less convenient than Chrome/VS Code, but works on a server without a GUI.

## Common mistakes

1. **Debugging React when upstream is broken** — `:8090` first, then BFF.
2. **Script finished before attach** — use `--inspect-brk` or a `setInterval` keep-alive.
3. **Breakpoint in a compiled file** — set it in the file Node actually runs.
4. **Inspect on every nodemon restart** — IDE disconnects; re-attach or `"restart": true` in launch config.
5. **Looking only at message, not `err.cause`** — fetch error chains (Node 18+) live in `error.cause`.

## Checklist

- Difference between `--inspect` and `--inspect-brk`?
- How do you attach VS Code to an already running `node --inspect`?
- Where to put a breakpoint for Express error middleware?
- First three diagnostic commands for “BFF 502, FastAPI ?”?
- Why is `debugger` in code dangerous in production?
- How does production debugging differ from local?

Next lesson: [38. Interview Q&A](38-interview-qa.md).
