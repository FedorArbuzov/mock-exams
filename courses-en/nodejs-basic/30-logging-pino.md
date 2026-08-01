# 30. Structured logs: pino

## A scenario from work

In prod on the BFF, developers debug with `console.log("here1", req.body)`. In Loki/Grafana the lines don't parse, PII leaks into logs, levels are mixed — error and info look the same. SRE: “JSON logs, correlation id, levels by NODE_ENV; console.log — only locally and briefly.” In mock-exams the standard is **pino** + **pino-http** for request logging.

## What you'll learn

- Why structured logging instead of console.log
- Configuring pino and log levels
- pino-http for Express
- requestId and context fields
- Redacting sensitive fields
- Dev vs prod transport (pino-pretty)

---

## The problem with console.log in production

```javascript
console.log(`User ${email} failed login`, password); // PII + secret
console.log("error:", err); // not JSON, no level, no ISO timestamp
```

| console.log | pino |
|-------------|------|
| plain text | JSON lines |
| no levels | trace/debug/info/warn/error/fatal |
| hard to aggregate | ELK, Loki, CloudWatch |
| no child loggers | requestId context |

Node does **not** block on console as predictably as sync file writes; pino is optimized for minimal overhead.

---

## Install

```bash
npm install pino pino-http
# dev only:
npm install -D pino-pretty
```

---

## Basic logger

```javascript
// src/lib/logger.js
import pino from "pino";
import { config } from "../config/index.js";

export const logger = pino({
  level: config.logLevel,
  base: {
    service: "shop-bff",
    env: config.nodeEnv,
  },
  redact: {
    paths: ["req.headers.authorization", "req.headers.cookie", "password"],
    remove: true,
  },
});

export function createChild(bindings) {
  return logger.child(bindings);
}
```

Usage:

```javascript
import { logger } from "./lib/logger.js";

logger.info({ port: config.port }, "Server starting");
logger.error({ err }, "Upstream failed");
```

Output (one JSON line):

```json
{"level":30,"time":1718880000000,"service":"shop-bff","port":3096,"msg":"Server starting"}
```

`level: 30` = info in pino.

---

## Levels

| Level | pino name | When |
|-------|-----------|-------|
| 10 | trace | very detailed |
| 20 | debug | dev debugging |
| 30 | info | normal events |
| 40 | warn | degradation |
| 50 | error | errors, 5xx |
| 60 | fatal | process is dying |

```javascript
logger.debug({ query: req.query }, "list items");
logger.warn({ latencyMs: 3000 }, "slow upstream");
logger.error({ err, upstream: config.fastapiUrl }, "fetch failed");
```

In prod usually `info`; in dev — `debug`.

---

## pino-http for Express

```javascript
// src/middleware/httpLogger.js
import pinoHttp from "pino-http";
import { logger } from "../lib/logger.js";
import crypto from "node:crypto";

export const httpLogger = pinoHttp({
  logger,
  genReqId(req, res) {
    const existing = req.headers["x-request-id"];
    if (existing) return existing;
    const id = crypto.randomUUID();
    res.setHeader("X-Request-Id", id);
    return id;
  },
  customSuccessMessage(req, res) {
    return `${req.method} ${req.url} completed`;
  },
  customErrorMessage(req, res, err) {
    return `${req.method} ${req.url} failed: ${err.message}`;
  },
  serializers: {
    req(req) {
      return {
        id: req.id,
        method: req.method,
        url: req.url,
        remoteAddress: req.remoteAddress,
      };
    },
    res(res) {
      return { statusCode: res.statusCode };
    },
  },
});
```

Mount as the **first** middleware:

```javascript
import { httpLogger } from "./middleware/httpLogger.js";

app.use(httpLogger);
```

In a handler:

```javascript
req.log.info({ itemId: id }, "fetching item from upstream");
```

---

## Replacing the requestLogger from lab 23

Remove the `console.log` middleware; one `pino-http` covers:

- method, url, statusCode, responseTime
- requestId (`req.id`)
- auto-log when the response finishes

---

## Logging errors in errorHandler

```javascript
export function errorHandler(err, req, res, next) {
  const status = err.statusCode ?? 500;
  const log = req.log ?? logger;

  if (status >= 500) {
    log.error({ err, status }, "unhandled error");
  } else {
    log.warn({ err, status }, "client error");
  }

  res.status(status).json({
    error: err.message,
    requestId: req.id,
  });
}
```

Pass `{ err }` — pino serializes the stack via `pino.stdSerializers.err`.

---

## pino-pretty in development

```javascript
import pino from "pino";
import { config } from "../config/index.js";

const transport =
  config.nodeEnv === "development"
    ? { target: "pino-pretty", options: { colorize: true } }
    : undefined;

export const logger = pino({
  level: config.logLevel,
  transport,
});
```

In production — **raw JSON** to stdout; formatting belongs to the log aggregator.

---

## Why not console.log in prod (short for leads)

1. **Parsing** — JSON vs regex over arbitrary strings.
2. **Levels** — filter alerts only on `error`.
3. **Context** — child logger with requestId without string concatenation.
4. **Performance** — pino async destination, fewer blocks.
5. **Security** — redact paths for headers/body.

`console.log` is fine in a one-off local script ([03-lab-cli.md](03-lab-cli.md)), not in the BFF request path.

---

## Correlation with FastAPI

Forward `X-Request-Id` upstream:

```javascript
const res = await fetch(url, {
  headers: {
    "X-Request-Id": req.id,
    "Content-Type": "application/json",
  },
});
```

Trace one request through BFF → FastAPI ([observability-basic](../observability-basic/README.md) later).

---

## Fastify note

Fastify uses pino as the default logger ([27-fastify-overview.md](27-fastify-overview.md)) — same principles.

---

## Related courses

- [31-lab-logging.md](31-lab-logging.md) — hands-on middleware.
- [29-lab-env.md](29-lab-env.md) — LOG_LEVEL in config.
- [24-express-errors.md](24-express-errors.md) — log in errorHandler.
- [35-project-structure.md](35-project-structure.md) — `src/lib/logger.js`.

---

## Common mistakes

1. **Logging password/token** — use redact.

2. **console.log + pino** — duplicates, different format.

3. **httpLogger after routes** — doesn't log early rejects.

4. **String interpolation instead of objects** — `log.info('user ' + id)` is worse than `log.info({ userId: id })`.

5. **pino-pretty in Docker prod** — extra CPU, no JSON.

6. **debug level in prod** — noise and storage cost.

7. **Not forwarding req.id to the client** — harder support tickets.

---

## Summary

Pino writes structured JSON logs with levels and minimal overhead. `pino-http` integrates with Express: requestId, duration, status. The error handler logs via `req.log`. In dev — pino-pretty; in prod — JSON stdout and secret redaction. Replaces ad-hoc `console.log` in the BFF request lifecycle.

---

## Checklist

- What's the numeric level for `info` in pino?
- Why `genReqId` and the `X-Request-Id` header?
- Why log `{ err }` and not only `err.message`?
- Where in the Express chain to put `pino-http`?
- How does prod logging differ from dev (transport)?
- Which fields to redact in a BFF?
- Why is console.log bad for Loki/Grafana?

Next lesson: [31. Lab: request logging](31-lab-logging.md).
