# 22. Middleware: цепочка и порядок

## Сценарий с работы

После деплоя BFF на staging React получает CORS-ошибки, а в логах — «Cannot set headers after they are sent». Senior смотрит `app.js`: middleware логирования стоит **после** error handler, auth-stub вызывает `res.json` без `next()`, а парсер JSON подключён только к `/api/v1/items`, но не к `/api/v1/orders`. На standup: «Middleware — это не магия, это конвейер. Порядок — часть контракта».

В Express каждый запрос проходит **цепочку функций** `(req, res, next) => …`. Понимание порядка отличает рабочий BFF от хаотичного `index.js` на 500 строк.

## Что вы узнаете

- Сигнатура middleware и роль `next()`
- Глобальные vs router-level middleware
- Типы: логирование, парсинг, auth stub, error handler
- Почему error middleware имеет 4 аргумента `(err, req, res, next)`
- «Зависание» запроса без `next()` или без ответа
- Порядок регистрации в рекомендуемом BFF

---

## Анатомия middleware

```javascript
function requestLogger(req, res, next) {
  const start = Date.now();
  res.on("finish", () => {
    const ms = Date.now() - start;
    console.log(`${req.method} ${req.url} ${res.statusCode} ${ms}ms`);
  });
  next(); // передать управление следующему слою
}
```

Правила:

1. Вызвать **`next()`** — передать дальше (если не отправили ответ).
2. Или **`res.send` / `res.json` / `res.end`** — завершить запрос.
3. **`next(err)`** — передать ошибку в error middleware ([24-express-errors.md](24-express-errors.md)).

Без `next()` и без ответа клиент ждёт до **таймаута** — классический «зависший» запрос.

---

## Регистрация: порядок имеет значение

```javascript
import express from "express";
import requestLogger from "./middleware/requestLogger.js";

const app = express();

// 1. Логирование — первым (видит все запросы)
app.use(requestLogger);

// 2. Парсеры тела — до маршрутов, которым нужен req.body
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// 3. CORS — до маршрутов (см. урок 25)
// app.use(cors({ origin: "http://localhost:5173" }));

// 4. Маршруты
app.use("/health", healthRouter);
app.use("/api/v1/items", itemsRouter);

// 5. 404 — после всех маршрутов
app.use((_req, res) => {
  res.status(404).json({ error: "Not found" });
});

// 6. Error handler — последним
app.use((err, req, res, next) => {
  console.error(err);
  res.status(err.status ?? 500).json({ error: err.message ?? "Internal error" });
});
```

```text
Запрос → logger → json parser → cors → route handler → (404?) → (error?)
```

---

## app.use без пути — на все URL

```javascript
app.use((req, _res, next) => {
  req.requestId = crypto.randomUUID();
  next();
});
```

С путём — только на prefix и вложенные:

```javascript
app.use("/api/v1", apiTimingMiddleware);
// сработает для /api/v1/items и /api/v1/orders
```

---

## Middleware на Router

```javascript
// src/routes/items.js
import { Router } from "express";

const router = Router();

router.use((req, _res, next) => {
  req.resource = "items";
  next();
});

router.get("/", listItems);
router.get("/:id", getItem);

export default router;
```

Router-level middleware не затрагивает `/health` — изоляция домена.

---

## Auth stub для лаб

На этапе basic BFF часто проверяют заголовок без реального JWT:

```javascript
// src/middleware/requireApiKey.js
export function requireApiKey(req, res, next) {
  const key = req.headers["x-api-key"];
  if (!key || key !== process.env.INTERNAL_API_KEY) {
    return res.status(401).json({ error: "Unauthorized" });
  }
  next();
}

// app.js — только на защищённых маршрутах
app.use("/api/v1/admin", requireApiKey, adminRouter);
```

**Ошибка:** вызвать `next()` после `res.status(401).json` — двойная обработка.

---

## Middleware, который завершает запрос

```javascript
export function cacheControl(seconds) {
  return (_req, res, next) => {
    res.set("Cache-Control", `public, max-age=${seconds}`);
    next();
  };
}

router.get("/", cacheControl(60), listItems);
```

Express позволяет **цепочку** middleware на одном маршруте: слева направо, затем handler.

---

## Error-handling middleware

Express распознаёт error handler по **четырём параметрам**:

```javascript
app.use((err, req, res, next) => {
  // err пришёл из next(err) или из async wrapper
  const status = err.statusCode ?? err.status ?? 500;
  res.status(status).json({
    error: err.message,
    requestId: req.requestId,
  });
});
```

Обычный middleware с тремя параметрами **не получит** `next(err)` — только 4-arg handler.

---

## Типичный «конвейер» BFF mock-exams

| # | Middleware | Зачем |
|---|------------|-------|
| 1 | pino-http / requestLogger | trace запросов ([30-logging-pino.md](30-logging-pino.md)) |
| 2 | express.json | POST/PATCH тела |
| 3 | cors | React `:5173` → BFF `:3096` |
| 4 | routes | бизнес-логика / proxy |
| 5 | notFound | единый JSON 404 |
| 6 | errorHandler | без stack trace наружу в prod |

---

## next() и async

Сам по себе `async (req, res, next) => { await ... }` **не ловит** reject — нужен try/catch или wrapper ([24-express-errors.md](24-express-errors.md)):

```javascript
export function asyncHandler(fn) {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}

router.get("/", asyncHandler(async (req, res) => {
  const data = await fetchItems();
  res.json(data);
}));
```

---

## Отладка: где застрял запрос?

1. Добавьте временный middleware с `console.log("after json")`.
2. Проверьте, вызван ли `next()` во всех ветках.
3. Убедитесь, что error handler **после** маршрутов.
4. Проверьте OPTIONS для CORS — preflight тоже проходит цепочку.

---

## Сравнение с «ручным» HTTP

В [16-lab-http-server.md](16-lab-http-server.md) вы сами решали, когда читать body. Express middleware **декомпозирует** эту логику: один модуль — одна задача. Это тот же принцип слоёв, что в FastAPI dependencies — но на функциях и порядке регистрации.

---

## Связь с курсом

- [21-express-routing.md](21-express-routing.md) — Router и монтирование.
- [24-express-errors.md](24-express-errors.md) — async и error middleware.
- [25-express-body-cors.md](25-express-body-cors.md) — `express.json`, cors.
- [31-lab-logging.md](31-lab-logging.md) — middleware логирования.
- [35-project-structure.md](35-project-structure.md) — папка `src/middleware/`.

---

## Типичные ошибки

1. **Забыть `next()`** — запрос висит, клиент timeout.

2. **Вызвать `next()` после ответа** — «Cannot set headers after they are sent».

3. **Error handler не последний** — ошибки не перехватываются.

4. **Error handler с 3 параметрами** — Express считает его обычным middleware.

5. **JSON parser после маршрутов** — `req.body` undefined в POST.

6. **CORS после 404 handler** — preflight может не получить заголовки.

7. **Middleware с тяжёлым sync-кодом** — блокирует event loop ([04-event-loop-libuv.md](04-event-loop-libuv.md)).

8. **Дублировать `express.json()`** — лишняя работа; один раз глобально.

---

## Резюме

Middleware в Express — функции `(req, res, next)`, образующие конвейер. Порядок регистрации определяет, что видит каждый handler: сначала логи и парсеры, затем маршруты, затем 404 и error handler. `next()` передаёт управление; `next(err)` — в обработчик ошибок (4 аргумента). Router может иметь свой под-конвейер. BFF mock-exams держит auth stub, CORS и JSON на верхнем уровне, доменную логику — в Router.

---

## Чек-лист

- Что произойдёт, если middleware не вызовет `next()` и не отправит ответ?
- Сколько аргументов у error-handling middleware и почему?
- Почему `express.json()` должен быть до `POST /api/v1/items`?
- Чем router-level middleware отличается от `app.use` без path?
- Как передать ошибку из `async` handler в error middleware?
- Где в цепочке должен стоять 404 handler?
- Зачем `return` перед `res.status(401).json` в auth middleware?

Следующий урок: [23. Лаба: базовый Express](23-lab-express.md).
