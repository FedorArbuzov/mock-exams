# 30. Структурированные логи: pino

## Сценарий с работы

В prod на BFF разработчики дебажат через `console.log("here1", req.body)`. В Loki/Grafana строки не парсятся, PII утекает в логи, уровни смешаны — error и info выглядят одинаково. SRE: «JSON logs, correlation id, уровни по NODE_ENV; console.log — только локально и ненадолго». В mock-exams стандарт — **pino** + **pino-http** для request logging.

## Что вы узнаете

- Зачем structured logging вместо console.log
- Настройка pino и уровни log
- pino-http для Express
- requestId и поля контекста
- redaction чувствительных полей
- dev vs prod transport (pino-pretty)

---

## Проблема console.log в production

```javascript
console.log(`User ${email} failed login`, password); // PII + секрет
console.log("error:", err); // не JSON, нет level, нет timestamp ISO
```

| console.log | pino |
|-------------|------|
| plain text | JSON lines |
| нет levels | trace/debug/info/warn/error/fatal |
| сложно агрегировать | ELK, Loki, CloudWatch |
| нет child loggers | контекст requestId |

Node **не блокирует** console так же предсказуемо, как sync write в файлы; pino оптимизирован для minimal overhead.

---

## Установка

```bash
npm install pino pino-http
# dev only:
npm install -D pino-pretty
```

---

## Базовый logger

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

Использование:

```javascript
import { logger } from "./lib/logger.js";

logger.info({ port: config.port }, "Server starting");
logger.error({ err }, "Upstream failed");
```

Вывод (одна строка JSON):

```json
{"level":30,"time":1718880000000,"service":"shop-bff","port":3096,"msg":"Server starting"}
```

`level: 30` = info в pino.

---

## Уровни

| Level | pino name | Когда |
|-------|-----------|-------|
| 10 | trace | очень детально |
| 20 | debug | dev отладка |
| 30 | info | штатные события |
| 40 | warn | деградация |
| 50 | error | ошибки, 5xx |
| 60 | fatal | процесс умирает |

```javascript
logger.debug({ query: req.query }, "list items");
logger.warn({ latencyMs: 3000 }, "slow upstream");
logger.error({ err, upstream: config.fastapiUrl }, "fetch failed");
```

В prod обычно `info`; в dev — `debug`.

---

## pino-http для Express

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

Подключение **первым** middleware:

```javascript
import { httpLogger } from "./middleware/httpLogger.js";

app.use(httpLogger);
```

В handler:

```javascript
req.log.info({ itemId: id }, "fetching item from upstream");
```

---

## Замена requestLogger из лабы 23

Удалите `console.log` middleware; один `pino-http` покрывает:

- method, url, statusCode, responseTime
- requestId (`req.id`)
- автolog при завершении ответа

---

## Логирование ошибок в errorHandler

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

Передавайте `{ err }` — pino сериализует stack через `pino.stdSerializers.err`.

---

## pino-pretty в development

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

В production — **сырой JSON** в stdout; форматирование — на стороне log aggregator.

---

## Почему не console.log в prod (кратко для lead)

1. **Parsing** — JSON vs regex по произвольным строкам.
2. **Levels** — фильтрация alert только на `error`.
3. **Context** — child logger с requestId без ручной склейки строк.
4. **Performance** — pino async destination, меньше блокировок.
5. **Security** — redact paths для headers/body.

`console.log` допустим в одноразовом локальном скрипте ([03-lab-cli.md](03-lab-cli.md)), не в request path BFF.

---

## Корреляция с FastAPI

Пробрасывайте `X-Request-Id` на upstream:

```javascript
const res = await fetch(url, {
  headers: {
    "X-Request-Id": req.id,
    "Content-Type": "application/json",
  },
});
```

Трейс одного запроса через BFF → FastAPI ([observability-basic](../observability-basic/README.md) позже).

---

## Fastify note

Fastify использует pino как default logger ([27-fastify-overview.md](27-fastify-overview.md)) — те же принципы.

---

## Связь с курсом

- [31-lab-logging.md](31-lab-logging.md) — hands-on middleware.
- [29-lab-env.md](29-lab-env.md) — LOG_LEVEL в config.
- [24-express-errors.md](24-express-errors.md) — log в errorHandler.
- [35-project-structure.md](35-project-structure.md) — `src/lib/logger.js`.

---

## Типичные ошибки

1. **Логировать password/token** — используйте redact.

2. **console.log + pino** — дубли, разный формат.

3. **httpLogger после routes** — не логирует rejected early.

4. **Строковая интерполяция вместо objects** — `log.info('user ' + id)` хуже `log.info({ userId: id })`.

5. **pino-pretty в Docker prod** — лишний CPU, нет JSON.

6. **level debug в prod** — шум и cost storage.

7. **Не пробрасывать req.id клиенту** — сложнее support tickets.

---

## Резюме

Pino пишет structured JSON logs с уровнями и minimal overhead. `pino-http` интегрируется с Express: requestId, duration, status. Error handler логирует через `req.log`. В dev — pino-pretty; в prod — JSON stdout и redact секретов. Заменяет ad-hoc `console.log` в request lifecycle BFF.

---

## Чек-лист

- Какой numeric level у `info` в pino?
- Зачем `genReqId` и заголовок `X-Request-Id`?
- Почему логируют `{ err }`, а не только `err.message`?
- Где в цепочке Express ставить `pino-http`?
- Чем prod logging отличается от dev (transport)?
- Какие поля redact в BFF?
- Почему console.log плохо для Loki/Grafana?

Следующий урок: [31. Лаба: логирование запросов](31-lab-logging.md).
