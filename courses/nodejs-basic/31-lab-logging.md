# 31. Лаба: логирование запросов

## Сценарий с работы

После инцидента «502 на items, но непонятно какой request» тимлид требует: pino-http, requestId в ответе и header, лог upstream fetch с duration. Замените console middleware из [23-lab-express.md](23-lab-express.md) на production-ready logging за одну итерацию.

**Время:** ~45–55 минут. Теория: [30-logging-pino.md](30-logging-pino.md).

## Цели

- Подключить `pino` + `pino-http`
- Убрать `console.log` request logger
- Логировать proxy/stub с `req.log.child`
- Возвращать `requestId` в JSON ошибок
- Проверить формат логов dev (pretty) и raw JSON

---

## Шаг 1. Зависимости

```bash
cd courses/nodejs-basic/examples
npm install pino pino-http
npm install -D pino-pretty
```

В `.env`:

```env
LOG_LEVEL=debug
NODE_ENV=development
```

---

## Шаг 2. logger.js

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

## Шаг 3. httpLogger middleware

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

## Шаг 4. Обновить app.js

```javascript
import { httpLogger } from "./middleware/httpLogger.js";
// удалить import requestLogger

app.use(httpLogger);
// ... cors, json, routes
```

**Не** подключайте старый `requestLogger` — дубли.

---

## Шаг 5. Логи в items service

```javascript
// src/services/itemsService.js — фрагмент
export function listItems(reqLog) {
  const log = reqLog ?? logger;
  const start = Date.now();
  log.info("upstream list stub");
  proxyLog("GET", "/api/v1/items");
  log.debug({ durationMs: Date.now() - start }, "listItems stub done");
  return { items: [...store.values()], total: store.size };
}
```

В route:

```javascript
router.get("/", asyncHandler(async (req, res) => {
  const data = itemsService.listItems(req.log);
  res.json(data);
}));
```

---

## Шаг 6. errorHandler + requestId

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

## Шаг 7. Проверка

```bash
npm run dev
```

```bash
curl -s -D - http://localhost:3096/api/v1/items -o /dev/null
# заголовок X-Request-Id присутствует

curl -s http://localhost:3096/api/v1/items/not-found | jq
# requestId в JSON ошибки совпадает с логом

curl -s -H "X-Request-Id: lab-manual-1" http://localhost:3096/health | jq
# в логах req.id = lab-manual-1
```

### Ожидаемый dev log (pretty)

```text
INFO: GET /api/v1/items completed
    req: { "id": "...", "method": "GET", "url": "/api/v1/items" }
    res: { "statusCode": 200 }
    responseTime: 12
```

### Prod-style (без pretty)

```bash
NODE_ENV=production LOG_LEVEL=info node src/app.js
```

Одна JSON-строка на запрос — парсится `jq`.

---

## Шаг 8. (Опционально) log upstream fetch

Если уже есть real fetch:

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

## Критерии успеха

- [ ] Нет `console.log` в request path (grep чистый)
- [ ] Каждый ответ с `X-Request-Id`
- [ ] Ошибки JSON содержат `requestId`
- [ ] `LOG_LEVEL=debug` показывает debug строки stub
- [ ] `NODE_ENV=production` — JSON без pretty colors

---

## Если что-то пошло не так

| Симптом | Решение |
|---------|---------|
| Два лога на запрос | убрать старый requestLogger |
| req.log undefined | httpLogger не первый middleware |
| Нет pretty | NODE_ENV не development |
| requestId null в error | error до httpLogger — редко; проверьте порядок |
| pino-pretty not found | npm i -D pino-pretty |

---

## grep-audit

```bash
rg "console\.log" src/
# допустимо только в bootstrap до logger init — ideally zero
```

---

## Связь с курсом

- [30-logging-pino.md](30-logging-pino.md) — теория.
- [34-lab-bff.md](34-lab-bff.md) — логировать real proxy latency.
- [37-debugging.md](37-debugging.md) — inspect + logs вместе.

---

## Типичные ошибки

1. Забыли `res.setHeader('X-Request-Id')` — клиент не correlates.

2. Логируют full `req.headers` — утечка Authorization.

3. pino-pretty в production Dockerfile.

4. `req.log` в setTimeout без bind — использовать child logger с id в closure.

---

## Резюме

Лаба заменяет console middleware на pino-http: structured logs, requestId в header и ошибках, уровни через config. Service layer принимает `req.log` для контекстных сообщений. Проверка curl + смена NODE_ENV подтверждает dev/prod форматы.

---

## Чек-лист

- Какой middleware должен быть первым в app.js?
- Откуда клиент берёт id для support ticket?
- Как передать свой X-Request-Id?
- Где логировать 4xx vs 5xx?
- Зачем redact paths?
- Как включить debug без rebuild?
- Чем заменили старый requestLogger?

Следующий урок: [32. Паттерн BFF: зачем прокси перед FastAPI](32-bff-pattern.md).
