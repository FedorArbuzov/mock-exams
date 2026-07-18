# 21. Express: маршруты и Router

## Сценарий с работы

Команда поднимает BFF для React-админки каталога. Junior копирует из туториала `app.get('/users', ...)` и `app.post('/users', ...)` прямо в `index.js` — через неделю там 400 строк и merge-конфlicts на каждый PR. Tech lead просит: «Вынеси shop в отдельный модуль, версионируй API как `/api/v1`, health оставь на корне». На code review спрашивают: «Почему `GET /api/v1/items` отвечает 404, хотя handler есть?» — оказывается, опечатка в пути и отсутствует `Router` с префиксом.

Express — de facto стандарт HTTP-сервера в Node.js для BFF и внутренних API. В mock-exams BFF на `:3096` проксирует запросы к FastAPI `:8090`; маршруты должны быть предсказуемыми и модульными.

## Что вы узнаете

- Минимальное приложение Express и lifecycle запроса
- HTTP-методы, пути, параметры `:id` и query `?page=`
- `express.Router()` и монтирование префиксов
- Порядок регистрации маршрутов и «catch-all»
- Разница между `app.use` и `app.get` для путей
- Структура `/api/v1` для shop-трека
- Типичные ошибки: trailing slash, дубли путей, 404 без handler

---

## Минимальный сервер

```javascript
// src/app.js
import express from "express";

const app = express();
const PORT = process.env.PORT ?? 3096;

app.get("/health", (_req, res) => {
  res.status(200).json({ status: "ok", service: "shop-bff" });
});

app.listen(PORT, () => {
  console.log(`BFF listening on http://localhost:${PORT}`);
});
```

Запуск (из [`examples/`](examples/package.json)):

```bash
node src/app.js
curl http://localhost:3096/health
```

Express не парсит JSON-тело сам по себе — это middleware ([25-express-body-cors.md](25-express-body-cors.md)). Сейчас важно понять **сопоставление URL → handler**.

---

## Маршруты по HTTP-методу

```javascript
// Заглушки для shop — позже прокси к FastAPI
app.get("/api/v1/items", (_req, res) => {
  res.json({ items: [], source: "stub" });
});

app.get("/api/v1/items/:id", (req, res) => {
  const { id } = req.params;
  res.json({ id, name: "Stub item", price: 0 });
});

app.post("/api/v1/items", (_req, res) => {
  res.status(201).json({ id: "new-stub", created: true });
});
```

| Компонент | Где живёт | Пример |
|-----------|-----------|--------|
| Path params | `req.params` | `/items/:id` → `id=42` |
| Query string | `req.query` | `/items?page=2&limit=10` |
| Тело | `req.body` | после `express.json()` |

```javascript
app.get("/api/v1/items", (req, res) => {
  const page = Number(req.query.page ?? 1);
  const limit = Number(req.query.limit ?? 20);
  res.json({ page, limit, items: [] });
});
```

**Важно:** query всегда строки (или массив строк). Явно приводите типы.

---

## express.Router — модульные маршруты

Один файл на домен: `items`, `orders`, `health`.

```javascript
// src/routes/items.js
import { Router } from "express";

const itemsRouter = Router();

itemsRouter.get("/", (_req, res) => {
  res.json({ items: [] });
});

itemsRouter.get("/:id", (req, res) => {
  res.json({ id: req.params.id });
});

itemsRouter.post("/", (_req, res) => {
  res.status(201).json({ id: "1" });
});

export default itemsRouter;
```

Монтирование с префиксом:

```javascript
// src/app.js
import itemsRouter from "./routes/items.js";

app.use("/api/v1/items", itemsRouter);
// GET /api/v1/items      → itemsRouter.get("/")
// GET /api/v1/items/42   → itemsRouter.get("/:id")
```

Router — «мини-приложение» с собственной цепочкой middleware ([22-middleware.md](22-middleware.md)).

---

## Версионирование API

Префикс `/api/v1` — контракт для React-клиента. При breaking change добавляют `/api/v2`, старый маршрут живёт параллельно:

```javascript
import itemsV1 from "./routes/v1/items.js";
import itemsV2 from "./routes/v2/items.js";

app.use("/api/v1/items", itemsV1);
app.use("/api/v2/items", itemsV2);
```

Не смешивайте версии в одном Router без явной структуры папок — review становится кошмаром.

---

## Порядок регистрации

Express проверяет маршруты **в порядке регистрации**. Первый подходящий handler побеждает.

```javascript
// ПЛОХО: параметрический маршрут перехватит "search"
itemsRouter.get("/:id", handlerById);
itemsRouter.get("/search", handlerSearch); // никогда не вызовется для /search

// ХОРОШО: конкретные пути выше
itemsRouter.get("/search", handlerSearch);
itemsRouter.get("/:id", handlerById);
```

Catch-all для SPA не нужен в BFF — только явные API-пути и 404 ([24-express-errors.md](24-express-errors.md)).

---

## app.use vs app.METHOD

| Вызов | Методы | Назначение |
|-------|--------|------------|
| `app.get(path, fn)` | только GET | чтение |
| `app.post(path, fn)` | только POST | создание |
| `app.use(path, router)` | все методы | монтирование Router или middleware |
| `app.use(fn)` | все, все пути | глобальный middleware |

```javascript
// middleware на все /api/v1/*
app.use("/api/v1", (req, _res, next) => {
  req.apiVersion = 1;
  next();
});
```

---

## Ответы: status и JSON

```javascript
itemsRouter.get("/:id", (req, res) => {
  const id = req.params.id;
  if (id === "missing") {
    return res.status(404).json({ error: "Item not found", id });
  }
  return res.status(200).json({ id, name: "Keyboard" });
});
```

Используйте `return` после `res.json`, иначе код ниже может отправить второй ответ → `Error: Cannot set headers after they are sent`.

---

## Связь с HTTP-модулем

В [15-http-module.md](15-http-module.md) вы вручную парсили URL и метод. Express делает то же через `path-to-regexp`:

```text
Клиент: GET /api/v1/items/5?page=1
         ↓
Express: method === 'GET', path match, req.params.id === '5'
         ↓
Handler → res.json(...)
```

---

## Пример структуры для лабы 23

```text
examples/src/
  app.js
  routes/
    health.js
    items.js
```

```javascript
// src/routes/health.js
import { Router } from "express";
const router = Router();
router.get("/", (_req, res) => res.json({ status: "ok" }));
export default router;

// app.js
import healthRouter from "./routes/health.js";
app.use("/health", healthRouter);
```

---

## Связь с курсом

- [17-url-routing.md](17-url-routing.md) — роутинг без фреймворка.
- [22-middleware.md](22-middleware.md) — цепочка до и после handler.
- [23-lab-express.md](23-lab-express.md) — hands-on.
- [26-lab-express-shop.md](26-lab-express-shop.md) — shop routes + stub proxy.
- [`deploy/fastapi`](../../deploy/fastapi/README.md) — целевой API `:8090`.

---

## Типичные ошибки

1. **Забыть `export default router`** — при импорте `undefined`, сервер падает при `app.use`.

2. **Дублировать префикс** — `Router` с `get("/api/v1/items")` и `app.use("/api/v1/items")` → путь `/api/v1/items/api/v1/items`.

3. **Путать `/items` и `/items/`** — `strict routing` по умолчанию off; клиенты могут слать разные URL. Договоритесь в команде.

4. **Не возвращать после `res.send`** — двойной ответ и 500 в логах.

5. **Query как число без парсинга** — `"10" + 5 === "105"` в JS.

6. **Параметрический маршрут раньше статического** — `/search` попадает в `/:id` с `id=search`.

7. **ESM: забыть `"type": "module"`** в `package.json` — `import` не работает.

---

## Резюме

Express сопоставляет HTTP-метод и путь с функцией-handler. `express.Router()` группирует маршруты домена и монтируется через `app.use(prefix, router)`. Версия API — префикс `/api/v1`. Параметры пути — `req.params`, query — `req.query`. Порядок регистрации критичен: конкретные пути выше `:id`. Для BFF mock-exams health на корне, shop под `/api/v1/items`.

---

## Чек-лист

- Чем `app.get` отличается от `app.use` для одного пути?
- Как смонтировать `itemsRouter`, чтобы `GET /api/v1/items/7` попал в `get("/:id")`?
- Где взять `page` из `GET /items?page=2`?
- Почему `GET /search` может вернуть `{ id: "search" }`?
- Зачем `return` перед `res.status(404).json(...)`?
- Какой порт BFF в examples по умолчанию?
- Что произойдёт, если вызвать `res.json()` дважды в одном handler?

Следующий урок: [22. Middleware: цепочка и порядок](22-middleware.md).
