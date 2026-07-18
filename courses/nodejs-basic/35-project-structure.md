# 35. Структура Node-проекта

## Сценарий с работы

Репозиторий BFF вырос из одного `app.js` в mess: config в трёх файлах, «временный» fetch прямо в route на 80 строк, тесты не находят entry point. Architect предлагает **layered layout** как в [`fastapi`](../fastapi/README.md): routes тонкие, services — интеграции, middleware — cross-cutting, config — одна точка. Перед capstone и [`nodejs-intermediate`](../javascript-path.md) фиксируем структуру `examples/src/`.

## Что вы узнаете

- Рекомендуемое дерево каталогов BFF
- Ответственность `routes`, `middleware`, `config`, `services`
- Entry point `app.js` vs `server.js`
- Именование файлов и баррель-экспорты
- Что не класть в git
- Эволюция к intermediate (controllers, tests)

---

## Целевое дерево mock-exams

```text
courses/nodejs-basic/examples/
  package.json
  .env.example          # в git
  .env                  # локально, gitignore
  README.md
  scripts/
    validate-config.mjs
  src/
    app.js              # express app, middleware chain, routes mount
    server.js           # listen (optional split)
    config/
      index.js          # validated env export
      upstream.js       # URL helpers (optional)
    lib/
      logger.js         # pino instance
    middleware/
      httpLogger.js
      asyncHandler.js
      errorHandler.js
      notFound.js
    routes/
      health.js
      items.js
      index.js          # optional: aggregate routers
    services/
      upstreamClient.js # fetch + timeout + parse
      itemsService.js   # optional domain orchestration
    errors/
      AppError.js
  lab/                    # стартовые заготовки лаб
  solutions/              # эталоны после попытки
```

Принцип: **imports flow downward** — routes → services → config/lib; config не импортирует routes.

---

## src/app.js — composition root

Собирает приложение **без** `listen` (удобно для тестов):

```javascript
// src/app.js
import express from "express";
import { httpLogger } from "./middleware/httpLogger.js";
import { notFoundHandler } from "./middleware/notFound.js";
import { errorHandler } from "./middleware/errorHandler.js";
import { registerRoutes } from "./routes/index.js";
import { loadExpressMiddleware } from "./middleware/loadExpress.js";

export function createApp() {
  const app = express();
  app.use(httpLogger);
  loadExpressMiddleware(app);
  registerRoutes(app);
  app.use(notFoundHandler);
  app.use(errorHandler);
  return app;
}

const app = createApp();
export default app;
```

```javascript
// src/server.js
import app from "./app.js";
import { config } from "./config/index.js";
import { logger } from "./lib/logger.js";

app.listen(config.port, () => {
  logger.info({ port: config.port, upstream: config.fastapiUrl }, "BFF started");
});
```

`package.json`:

```json
{
  "scripts": {
    "dev": "node --watch src/server.js",
    "start": "node src/server.js"
  }
}
```

---

## src/config/ — единая конфигурация

```javascript
// src/config/index.js — см. урок 28–29
export const config = Object.freeze({ ... });
```

```javascript
// src/config/upstream.js — optional helpers
import { config } from "./index.js";
export function apiPath(path) {
  return new URL(path, config.fastapiUrl).toString();
}
```

**Правило:** никаких `process.env` вне `config/` (кроме bootstrap edge cases).

---

## src/middleware/ — cross-cutting

| Файл | Роль |
|------|------|
| `httpLogger.js` | pino-http, requestId |
| `asyncHandler.js` | wrap async routes |
| `errorHandler.js` | JSON errors, log 4xx/5xx |
| `notFound.js` | 404 JSON |
| `loadExpress.js` | cors + express.json() |

```javascript
// src/middleware/loadExpress.js
import cors from "cors";
import express from "express";

export function loadExpressMiddleware(app) {
  app.use(cors({ origin: ["http://localhost:5173"], credentials: true }));
  app.use(express.json({ limit: "1mb" }));
}
```

Middleware **не** вызывает fetch upstream — только HTTP ingress concerns.

---

## src/routes/ — thin handlers

```javascript
// src/routes/items.js
import { Router } from "express";
import { asyncHandler } from "../middleware/asyncHandler.js";
import * as items from "../services/itemsProxy.js";

const router = Router();

router.get("/", asyncHandler(items.list));
router.get("/:id", asyncHandler(items.getById));
router.post("/", asyncHandler(items.create));

export default router;
```

```javascript
// src/routes/index.js
import healthRouter from "./health.js";
import itemsRouter from "./items.js";

export function registerRoutes(app) {
  app.use("/health", healthRouter);
  app.use("/api/v1/items", itemsRouter);
}
```

Route file: **parse req → call service → set status/res.json**; без business rules.

---

## src/services/ — интеграция и orchestration

```javascript
// src/services/itemsProxy.js
import { upstreamFetch, readUpstreamJson } from "./upstreamClient.js";

export async function list(req, res) {
  const upstream = await upstreamFetch("/api/v1/items", {}, req);
  const data = await readUpstreamJson(upstream);
  res.json(data);
}

export async function getById(req, res) {
  const id = encodeURIComponent(req.params.id);
  const upstream = await upstreamFetch(`/api/v1/items/${id}`, {}, req);
  const data = await readUpstreamJson(upstream);
  res.json(data);
}

export async function create(req, res) {
  const upstream = await upstreamFetch(
    "/api/v1/items",
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(req.body),
    },
    req
  );
  const data = await readUpstreamJson(upstream);
  res.status(upstream.status).json(data);
}
```

`upstreamClient.js` — shared fetch logic ([33-proxy-aggregation.md](33-proxy-aggregation.md)).

Когда появится агрегация dashboard — новый `dashboardService.js`, не fat route.

---

## src/errors/

```javascript
// src/errors/AppError.js
export class AppError extends Error {
  constructor(message, statusCode = 500, code = "APP_ERROR") {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
  }
}
```

Централизованные error classes — импорт из services и middleware.

---

## src/lib/

Shared utilities без Express dependency: logger, maybe `id.js`, formatters. **`lib` vs `utils`:** в mock-exams — `lib/logger.js`.

---

## Именование и модули

- ES modules: **`.js` extension** в relative imports
- Один router per file: `health.js`, `items.js`
- `camelCase` functions, `PascalCase` errors
- Default export для router; named для handlers/services

---

## Что не коммитить

```gitignore
node_modules/
.env
.env.local
dist/
coverage/
*.log
```

Коммитить: `package.json`, `package-lock.json`, `.env.example`, `src/`, `lab/`.

---

## Anti-patterns (видели на review)

| Плохо | Хорошо |
|-------|--------|
| 200-line `app.js` | `createApp` + `registerRoutes` |
| `fetch` в каждом route | `upstreamClient` |
| `process.env` в routes | `config` |
| `console.log` everywhere | `req.log` / `logger` |
| Circular imports config ↔ routes | routes → config only |

---

## Сравнение с FastAPI layers

| FastAPI | Node BFF mock-exams |
|---------|---------------------|
| `routers/` | `src/routes/` |
| `dependencies` | `middleware` |
| `services/` | `src/services/` |
| `core/config.py` | `src/config/` |
| `main.py` | `app.js` + `server.js` |

[`nodejs-intermediate`](../javascript-path.md) добавит `controllers`, Prisma, Vitest `tests/`.

---

## Рост проекта

```text
basic (этот курс)     → routes + services + proxy
intermediate          → + validation (Zod), auth, DB
advanced              → + workers, metrics, graceful shutdown
capstone (39)         → shop BFF dockerized, aggregation route
```

Не создавайте папки «на будущее» пустыми — YAGNI до тикета.

---

## Checklist рефакторинга lab → structure

1. Вынести `listen` в `server.js`
2. `registerRoutes(app)` из `routes/index.js`
3. Переместить fetch в `services/upstreamClient.js`
4. Items handlers → `services/itemsProxy.js`
5. `loadExpress.js` для cors/json
6. Grep: zero `process.env` outside config
7. Grep: zero `console.log` in `src/`

---

## Связь с курсом

- Лабы 23–34 — источник файлов для реорганизации.
- [39-capstone.md](39-capstone.md) — финальный проект на этой структуре.
- [36-security-basics.md](36-security-basics.md) — middleware helmet/rate limit в ту же папку.
- [`deploy/nodejs`](../../deploy/nodejs/README.md) — deploy layout (когда появится).

---

## Типичные ошибки

1. **Circular import** `app.js` ↔ `routes/items.js` — используйте `createApp` factory.

2. **config импортирует logger импортирует config** — logger читает config один раз at init; разорвите цикл.

3. **Тесты импортируют server.js** — side effect listen; импорт `createApp` only.

4. **Barrel `index.js` re-export всего** — tree-shaking и циклы; barrel только для routes register.

5. **Смешать lab и solutions в src** — solutions отдельно.

---

## Резюме

Структура BFF mock-exams: `config` (env), `middleware` (ingress), `routes` (thin HTTP), `services` (upstream/proxy), `lib` (logger), `errors`. Entry: `app.js` composition, `server.js` listen. Imports только вниз по слоям. Эта layout масштабируется до capstone и nodejs-intermediate без переписывания с нуля.

---

## Чек-лист

- Какой файл вызывает `app.listen`?
- Может ли `routes/items.js` импортировать `config` напрямую?
- Где живёт `upstreamFetch` и почему не в middleware?
- Зачем `createApp()` для тестов?
- Какие три папки добавились после лабы Express 23?
- Что в git вместо `.env`?
- Какой FastAPI-аналог у `src/middleware/errorHandler.js`?

Следующий урок: [36. Безопасность: helmet, базовый rate limit](36-security-basics.md).
