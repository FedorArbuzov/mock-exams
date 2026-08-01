# 31. Lab: request logging

## A scenario from work

After the incident “502 on items, but unclear which request,” the tech lead requires: pino-http, requestId in the response and header, and an upstream fetch log with duration. Replace the console middleware from [23-lab-express.md](23-lab-express.md) with production-ready logging in one iteration.

**Time:** ~45–55 minutes. Theory: [30-logging-pino.md](30-logging-pino.md).

## Goals

- Wire up `pino` + `pino-http`
- Remove the `console.log` request logger
- Log proxy/stub with `req.log.child`
- Return `requestId` in error JSON
- Verify log format for dev (pretty) and raw JSON

---

## Step 1. Dependencies

```bash
cd courses/nodejs-basic/examples
npm install pino pino-http
npm install -D pino-pretty
```

In `.env`:

```env
LOG_LEVEL=debug
NODE_ENV=development
```

---

## Step 2. logger.js

```javascript
// src/lib/logger.js
import pino from "pino";
import { config } from "../config/index.js";

const usePretty = config.nodeEnv === "development";

export const logger = pino({
  level: config.logLevel,
  base: { service: "shop-bff", env: config.nodeEnv },
  ...(usePretty
    ? { transport: { target: "pino-pretty", options: { colorize: true } } }
    : {}),
  redact: ["req.headers.authorization", "password", "token"],
});
```

---

## Step 3. httpLogger middleware

```javascript
// src/middleware/httpLogger.js
import pinoHttp from "pino-http";
import crypto from "node:crypto";
import { logger } from "../lib/logger.js";

export const httpLogger = pinoHttp({
  logger,
  genReqId(req, res) {
    const header = req.headers["x-request-id"];
    const id = typeof header === "string" && header ? header : crypto.randomUUID();
    res.setHeader("X-Request-Id", id);
    return id;
  },
});
```

---

## Step 4. Update app.js

```javascript
import { httpLogger } from "./middleware/httpLogger.js";
// remove import requestLogger

app.use(httpLogger);
// ... cors, json, routes
```

Do **not** mount the old `requestLogger` — duplicates.

---

## Step 5. Logs in the items service

```javascript
// src/services/itemsService.js — fragment
export function listItems(reqLog) {
  const log = reqLog ?? logger;
  const start = Date.now();
  log.info("upstream list stub");
  proxyLog("GET", "/api/v1/items");
  log.debug({ durationMs: Date.now() - start }, "listItems stub done");
  return { items: [...store.values()], total: store.size };
}
```

In the route:

```javascript
router.get("/", asyncHandler(async (req, res) => {
  const data = itemsService.listItems(req.log);
  res.json(data);
}));
```

---

## Step 6. errorHandler + requestId

```javascript
// src/middleware/errorHandler.js
import { logger } from "../lib/logger.js";

export function errorHandler(err, req, res, next) {
  const status = err.statusCode ?? err.status ?? 500;
  const log = req.log ?? logger;

  if (status >= 500) log.error({ err, status }, "server error");
  else log.warn({ err, status }, "client error");

  res.status(status).json({
    error: err.message ?? "Internal Server Error",
    code: err.code ?? "ERROR",
    requestId: req.id,
  });
}
```

---

## Step 7. Verification

```bash
npm run dev
```

```bash
curl -s -D - http://localhost:3096/api/v1/items -o /dev/null
# X-Request-Id header is present

curl -s http://localhost:3096/api/v1/items/not-found | jq
# requestId in error JSON matches the log

curl -s -H "X-Request-Id: lab-manual-1" http://localhost:3096/health | jq
# in logs req.id = lab-manual-1
```

### Expected dev log (pretty)

```text
INFO: GET /api/v1/items completed
    req: { "id": "...", "method": "GET", "url": "/api/v1/items" }
    res: { "statusCode": 200 }
    responseTime: 12
```

### Prod-style (without pretty)

```bash
NODE_ENV=production LOG_LEVEL=info node src/app.js
```

One JSON line per request — parseable with `jq`.

---

## Step 8. (Optional) log upstream fetch

If you already have a real fetch:

```javascript
export async function fetchList(req) {
  const url = itemsUrl();
  const start = Date.now();
  req.log.info({ url }, "upstream fetch start");
  const res = await fetch(url, { headers: { "X-Request-Id": req.id } });
  req.log.info(
    { status: res.status, durationMs: Date.now() - start },
    "upstream fetch done"
  );
  // ...
}
```

---

## Success criteria

- [ ] No `console.log` in the request path (clean grep)
- [ ] Every response has `X-Request-Id`
- [ ] Error JSON includes `requestId`
- [ ] `LOG_LEVEL=debug` shows stub debug lines
- [ ] `NODE_ENV=production` — JSON without pretty colors

---

## If something went wrong

| Symptom | Solution |
|---------|---------|
| Two logs per request | remove the old requestLogger |
| req.log undefined | httpLogger is not the first middleware |
| No pretty | NODE_ENV is not development |
| requestId null in error | error before httpLogger — rare; check order |
| pino-pretty not found | npm i -D pino-pretty |

---

## grep-audit

```bash
rg "console\.log" src/
# only acceptable in bootstrap before logger init — ideally zero
```

---

## Related courses

- [30-logging-pino.md](30-logging-pino.md) — theory.
- [34-lab-bff.md](34-lab-bff.md) — log real proxy latency.
- [37-debugging.md](37-debugging.md) — inspect + logs together.

---

## Common mistakes

1. Forgot `res.setHeader('X-Request-Id')` — client can't correlate.

2. Logging full `req.headers` — Authorization leak.

3. pino-pretty in the production Dockerfile.

4. `req.log` in setTimeout without bind — use a child logger with id in the closure.

---

## Summary

The lab replaces console middleware with pino-http: structured logs, requestId in header and errors, levels via config. The service layer accepts `req.log` for contextual messages. curl + switching NODE_ENV confirms dev/prod formats.

---

## Checklist

- Which middleware should be first in app.js?
- Where does the client get the id for a support ticket?
- How do you pass your own X-Request-Id?
- Where to log 4xx vs 5xx?
- Why redact paths?
- How do you enable debug without a rebuild?
- What replaced the old requestLogger?

Next lesson: [32. BFF pattern: why a proxy in front of FastAPI](32-bff-pattern.md).
