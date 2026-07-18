# 26. Лаба: shop routes на Express

## Сценарий с работы

Product owner хочет «как в FastAPI shop», но фронтенд пока подключают к BFF. Задача: реализовать `/api/v1/items` на Express — список, один item, создание — с CORS для React и **заглушкой proxy** (лог «would proxy to :8090»), чтобы завтра заменить на реальный `fetch`. Демо через 2 часа; код должен лежать в `src/routes/items.js`, не в монолитном `index.js`.

Лаба завершает блок Express (21–25) и готовит к BFF-прокси ([34-lab-bff.md](34-lab-bff.md)).

## Цели

- Полный CRUD-stub для items (GET list, GET by id, POST create)
- CORS для `http://localhost:5173`
- Middleware: logger, json, 404, error handler
- Stub-слой «proxy to FastAPI» с env `FASTAPI_URL`
- Проверка curl + опционально браузер

**Время:** ~60–70 минут.

---

## Стартовая точка

Продолжайте проект из [23-lab-express.md](23-lab-express.md) или скопируйте каркас из `examples/lab/26-express-shop/`.

```bash
cd courses/nodejs-basic/examples
npm install cors
```

`.env` (пока опционально):

```env
PORT=3096
FASTAPI_URL=http://localhost:8090
NODE_ENV=development
```

---

## Шаг 1. Конфиг stub proxy

```javascript
// src/config/upstream.js
export const FASTAPI_URL =
  process.env.FASTAPI_URL ?? "http://localhost:8090";

export function proxyLog(method, path) {
  console.log(`[proxy-stub] would ${method} ${FASTAPI_URL}${path}`);
}
```

Позже замените `proxyLog` на реальный `fetch` ([34-lab-bff.md](34-lab-bff.md)).

---

## Шаг 2. Items service (in-memory + stub)

```javascript
// src/services/itemsService.js
import { proxyLog } from "../config/upstream.js";

const store = new Map([
  ["1", { id: "1", name: "Keyboard", price: 79.99, sku: "KB-001" }],
  ["2", { id: "2", name: "Mouse", price: 29.99, sku: "MS-002" }],
]);

export function listItems() {
  proxyLog("GET", "/api/v1/items");
  return { items: [...store.values()], total: store.size };
}

export function getItem(id) {
  proxyLog("GET", `/api/v1/items/${id}`);
  return store.get(id) ?? null;
}

export function createItem(payload) {
  proxyLog("POST", "/api/v1/items");
  const id = String(Date.now());
  const item = { id, ...payload };
  store.set(id, item);
  return item;
}
```

---

## Шаг 3. Routes с валидацией

```javascript
// src/routes/items.js
import { Router } from "express";
import { asyncHandler } from "../middleware/asyncHandler.js";
import { AppError } from "../errors/AppError.js";
import * as itemsService from "../services/itemsService.js";

const router = Router();

router.get(
  "/",
  asyncHandler(async (_req, res) => {
    res.json(itemsService.listItems());
  })
);

router.get(
  "/:id",
  asyncHandler(async (req, res) => {
    const item = itemsService.getItem(req.params.id);
    if (!item) {
      throw new AppError("Item not found", 404, "NOT_FOUND");
    }
    res.json(item);
  })
);

router.post(
  "/",
  asyncHandler(async (req, res) => {
    const { name, price, sku } = req.body ?? {};
    if (!name || price == null) {
      throw new AppError("name and price required", 400, "VALIDATION_ERROR");
    }
    const item = itemsService.createItem({
      name,
      price: Number(price),
      sku: sku ?? null,
    });
    res.status(201).json(item);
  })
);

export default router;
```

---

## Шаг 4. app.js с CORS

```javascript
// src/app.js
import express from "express";
import cors from "cors";
import { requestLogger } from "./middleware/requestLogger.js";
import { notFoundHandler } from "./middleware/notFound.js";
import { errorHandler } from "./middleware/errorHandler.js";
import healthRouter from "./routes/health.js";
import itemsRouter from "./routes/items.js";

const app = express();
const PORT = Number(process.env.PORT ?? 3096);

app.use(requestLogger);
app.use(
  cors({
    origin: ["http://localhost:5173", "http://127.0.0.1:5173"],
    credentials: true,
  })
);
app.use(express.json({ limit: "1mb" }));

app.use("/health", healthRouter);
app.use("/api/v1/items", itemsRouter);

app.use(notFoundHandler);
app.use(errorHandler);

app.listen(PORT, () => {
  console.log(`Shop BFF stub http://localhost:${PORT}`);
});

export default app;
```

---

## Шаг 5. Проверка curl

```bash
npm run dev

curl -s http://localhost:3096/api/v1/items | jq
curl -s http://localhost:3096/api/v1/items/1 | jq
curl -s -X POST http://localhost:3096/api/v1/items \
  -H "Content-Type: application/json" \
  -d '{"name":"Monitor","price":199,"sku":"MN-100"}' | jq
curl -s http://localhost:3096/api/v1/items/not-exist | jq
```

В логах сервера на каждый items-запрос:

```text
[proxy-stub] would GET http://localhost:8090/api/v1/items
```

---

## Шаг 6. Проверка CORS из браузера

Консоль DevTools на любой странице `:5173` (или временный HTML):

```javascript
fetch("http://localhost:3096/api/v1/items")
  .then((r) => r.json())
  .then(console.log)
  .catch(console.error);
```

Без CORS — ошибка в консоли; с middleware — JSON с items.

---

## Шаг 7. (Опционально) Query pagination stub

```javascript
router.get("/", asyncHandler(async (req, res) => {
  const page = Math.max(1, Number(req.query.page ?? 1));
  const limit = Math.min(100, Number(req.query.limit ?? 20));
  const all = itemsService.listItems().items;
  const start = (page - 1) * limit;
  const items = all.slice(start, start + limit);
  res.json({ items, page, limit, total: all.length });
}));
```

---

## Критерии успеха

- [ ] `GET /api/v1/items` — 200, массив items
- [ ] `GET /api/v1/items/:id` — 200 или 404 JSON
- [ ] `POST /api/v1/items` — 201, item с id
- [ ] `POST` без name — 400 через error handler
- [ ] CORS: fetch из `:5173` без блокировки
- [ ] Лог `[proxy-stub] would …` на операции items
- [ ] Структура: routes / services / middleware / config

---

## Если что-то пошло не так

| Симптом | Решение |
|---------|---------|
| CORS error | проверьте `origin` в cors(); BFF перезапущен |
| 500 на POST | `asyncHandler` + `AppError`; смотрите stack |
| 404 на `/api/v1/item` | опечатка: `items` |
| Дубли items после restart | in-memory store — ожидаемо; позже FastAPI |
| Нет proxy-stub лога | вызов `proxyLog` в service |

---

## Переход к реальному proxy

Замените тело `listItems`:

```javascript
export async function listItems() {
  const res = await fetch(`${FASTAPI_URL}/api/v1/items`);
  if (!res.ok) throw new AppError("Upstream error", res.status);
  return res.json();
}
```

Полная лаба — [34-lab-bff.md](34-lab-bff.md). FastAPI стенд: [`deploy/fastapi`](../../deploy/fastapi/README.md).

---

## Связь с курсом

- [25-express-body-cors.md](25-express-body-cors.md) — json + cors.
- [24-express-errors.md](24-express-errors.md) — AppError.
- [28-env-config.md](28-env-config.md) — FASTAPI_URL из env.
- [35-project-structure.md](35-project-structure.md) — финальная структура папок.

---

## Типичные ошибки

1. Business-логика в route handler на 100 строк — вынесите в `services/`.

2. Забыли `Number(price)` — строка в JSON store.

3. CORS только на `/api/v1/items` через router — проще глобально на app.

4. Ждут данные FastAPI без поднятого `:8090` — stub как раз для автономной работы.

5. Не экспортировали `asyncHandler` — copy-paste ошибок.

---

## Резюме

Лаба собирает shop API на Express: versioned routes, validation, CORS для React, in-memory store с логом будущего proxy на `:8090`. Структура routes + services готовит к BFF. Проверяйте curl и браузерный fetch до интеграции с FastAPI.

---

## Чек-лист

- Какой полный URL списка items?
- Где логируется намерение proxy и зачем stub?
- Какие поля обязательны в POST body?
- Какой origin в cors для Vite?
- Где обрабатывается 404 «item not found» vs «route not found»?
- Как заменить stub на реальный fetch одной функцией?
- Какие папки появились кроме routes?

Следующий урок: [27. Fastify: обзор и сравнение с Express](27-fastify-overview.md).
