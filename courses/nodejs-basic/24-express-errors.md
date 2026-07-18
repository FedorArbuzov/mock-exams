# 24. Обработка ошибок и async handlers

## Сценарий с работы

После подключения proxy к FastAPI `:8090` часть запросов возвращает 500 с HTML `<pre>Cannot read properties of undefined</pre>` вместо JSON. В логах — unhandled promise rejection: `fetch failed`. Async handler бросил исключение, но Express 4 **не ловит** rejected Promise автоматически. SRE просит: «Единый формат ошибок для React, без stack trace наружу, requestId в каждом ответе».

Централизованная обработка ошибок — обязательная часть BFF между браузером и Python-backend.

## Что вы узнаете

- Почему `async (req, res) => { await … }` ломается без wrapper
- `next(err)` и error middleware с 4 параметрами
- Классы ошибок с `statusCode`
- Маппинг ошибок upstream (FastAPI) в ответ BFF
- 404 vs 500 vs 502 Bad Gateway
- Что показывать клиенту, что — только в логах

---

## Проблема: async без catch

```javascript
// ОПАСНО в Express 4
router.get("/:id", async (req, res) => {
  const item = await fetchItem(req.params.id); // reject → unhandled
  res.json(item);
});
```

При `fetch` network error или `throw new Error()` Promise reject **не попадает** в error middleware.

**Решение 1 — try/catch:**

```javascript
router.get("/:id", async (req, res, next) => {
  try {
    const item = await fetchItem(req.params.id);
    res.json(item);
  } catch (err) {
    next(err);
  }
});
```

**Решение 2 — wrapper (рекомендуется):**

```javascript
// src/middleware/asyncHandler.js
export function asyncHandler(fn) {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}

router.get("/:id", asyncHandler(async (req, res) => {
  const item = await fetchItem(req.params.id);
  res.json(item);
}));
```

---

## Error middleware

```javascript
// src/middleware/errorHandler.js
export function errorHandler(err, req, res, next) {
  const status = err.statusCode ?? err.status ?? 500;
  const isProd = process.env.NODE_ENV === "production";

  if (status >= 500) {
    console.error(err); // или pino — урок 30
  }

  res.status(status).json({
    error: err.message ?? "Internal Server Error",
    code: err.code ?? "INTERNAL_ERROR",
    requestId: req.requestId,
    ...(isProd ? {} : { stack: err.stack }),
  });
}
```

Регистрация **после** всех маршрутов и 404:

```javascript
app.use(notFoundHandler);
app.use(errorHandler);
```

Express определяет error handler по сигнатуре `(err, req, res, next)` — не сокращайте до 3 параметров.

---

## Классы ошибок приложения

```javascript
// src/errors/AppError.js
export class AppError extends Error {
  constructor(message, statusCode = 500, code = "APP_ERROR") {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
  }
}

export class NotFoundError extends AppError {
  constructor(resource, id) {
    super(`${resource} not found: ${id}`, 404, "NOT_FOUND");
  }
}

export class BadGatewayError extends AppError {
  constructor(upstream) {
    super(`Upstream unavailable: ${upstream}`, 502, "BAD_GATEWAY");
  }
}
```

Использование в handler:

```javascript
router.get("/:id", asyncHandler(async (req, res) => {
  const item = await fetchFromFastAPI(req.params.id);
  if (!item) {
    throw new NotFoundError("Item", req.params.id);
  }
  res.json(item);
}));
```

---

## Синхронные ошибки

Throw в синхронном handler Express ловит сам:

```javascript
router.get("/broken", (_req, _res) => {
  throw new Error("sync boom");
});
// → попадёт в errorHandler
```

Но смешивать стили без wrapper — плохая практика; используйте `asyncHandler` везде, где есть `await`.

---

## Ошибки валидации — 400

```javascript
router.post("/", asyncHandler(async (req, res) => {
  const { name, price } = req.body ?? {};
  if (!name || typeof price !== "number") {
    throw new AppError("Invalid body: name and numeric price required", 400, "VALIDATION_ERROR");
  }
  res.status(201).json({ name, price });
}));
```

Согласуйте формат с FastAPI (`detail` vs `error`) — в BFF можно нормализовать ([33-proxy-aggregation.md](33-proxy-aggregation.md)).

---

## Маппинг ошибок FastAPI

FastAPI `:8090` возвращает:

```json
{ "detail": "Item not found" }
```

BFF при `response.status === 404`:

```javascript
async function fetchItem(id) {
  const url = `${process.env.FASTAPI_URL}/api/v1/items/${id}`;
  const res = await fetch(url);
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    const message = body.detail ?? res.statusText;
    throw new AppError(message, res.status, "UPSTREAM_ERROR");
  }
  return res.json();
}
```

Не пробрасывайте сырой stack Python клиенту.

---

## 404 handler vs NotFoundError

| Ситуация | Механизм |
|----------|----------|
| URL не зарегистрирован в Express | `notFoundHandler` → 404 |
| URL есть, ресурс не найден upstream | `throw new NotFoundError` → errorHandler |

```javascript
app.use((_req, _res, next) => {
  next(new AppError("Route not found", 404, "ROUTE_NOT_FOUND"));
});
```

Оба варианта валидны; главное — единый JSON-формат.

---

## next() после ошибки

```javascript
// ПЛОХО
catch (err) {
  res.status(500).json({ error: err.message });
  next(err); // попытка второго ответа
}

// ХОРОШО
catch (err) {
  next(err);
}
```

---

## Express 5 (справка)

Express 5 автоматически forwarding rejected promises из async handlers. В LTS-проектах mock-exams часто ещё Express 4 — **не полагайтесь** на автоматику, используйте wrapper.

---

## Пример полной цепочки

```javascript
import express from "express";
import { asyncHandler } from "./middleware/asyncHandler.js";
import { errorHandler } from "./middleware/errorHandler.js";
import { notFoundHandler } from "./middleware/notFound.js";
import itemsRouter from "./routes/items.js";

const app = express();
app.use(express.json());
app.use("/api/v1/items", itemsRouter);
app.use(notFoundHandler);
app.use(errorHandler);
```

---

## Связь с курсом

- [22-middleware.md](22-middleware.md) — порядок error handler.
- [20-fastapi-client.md](20-fastapi-client.md) — fetch и статусы.
- [33-proxy-aggregation.md](33-proxy-aggregation.md) — 502, таймауты.
- [30-logging-pino.md](30-logging-pino.md) — логировать 5xx с контекстом.
- [`api-design`](../api-design/README.md) — коды HTTP.

---

## Типичные ошибки

1. **Async handler без try/catch/wrapper** — unhandled rejection, висящий запрос.

2. **Error handler с 3 параметрами** — `(req, res, next)` не перехватит `next(err)`.

3. **Stack trace в prod JSON** — утечка внутренней структуры.

4. **Дублировать ответ и `next(err)`** — headers already sent.

5. **500 на 404 upstream** — забыли пробросить `res.status` из fetch.

6. **Строка вместо Error** — `next("bad")` работает, но теряется stack; используйте `AppError`.

7. **Не логировать 5xx** — невозможно расследовать инцидент.

---

## Резюме

В Express 4 rejected Promise из async handler не попадает в error middleware без `catch` или `asyncHandler`. Error middleware — функция с 4 аргументами, регистрируется последней. Прикладные ошибки — классы с `statusCode`; upstream FastAPI маппится в тот же JSON-формат. Клиент получает message и code; stack — только в dev и логах.

---

## Чек-лист

- Почему `await fetch()` в handler может «потерять» ошибку?
- Как устроен `asyncHandler` в одном предложении?
- Сколько параметров у error middleware и что будет, если их три?
- Чем 404 от `notFoundHandler` отличается от `NotFoundError` в proxy?
- Что вернуть клиенту при недоступном FastAPI (502)?
- Где показывать `stack` — в prod или только dev?
- Зачем `requestId` в теле ошибки?

Следующий урок: [25. Body parser, static, CORS](25-express-body-cors.md).
