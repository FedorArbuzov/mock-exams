# 23. Лаба: базовый Express

## Сценарий с работы

Тимлид создал тикет: «Поднимите минимальный BFF на Express: health, версионированный API, лог каждого запроса. Без FastAPI пока — заглушки JSON». У вас 90 минут до демо для фронтенда. Нужен предсказуемый `npm run dev`, curl-проверки и структура папок, которую не стыдно показать на review.

Эта лаба закрепляет [21-express-routing.md](21-express-routing.md) и [22-middleware.md](22-middleware.md) hands-on в каталоге [`examples/`](examples/package.json).

## Цели лабы

- Создать Express-приложение с ES modules
- Разнести маршруты по `src/routes/`
- Добавить middleware логирования и 404
- Проверить endpoints через `curl`
- Подготовить базу для shop-лабы ([26-lab-express-shop.md](26-lab-express-shop.md))

**Время:** ~45–60 минут (теория 21–22 — до лабы).

---

## Предварительные требования

- Node.js LTS 20+
- Пройдены уроки 21–22
- Каталог `courses/nodejs-basic/examples`

```bash
cd courses/nodejs-basic/examples
npm install
```

В `package.json` должны быть `"type": "module"`, `express`, скрипт `"dev": "node --watch src/app.js"` (или `nodemon`).

---

## Шаг 1. Каркас проекта

```text
examples/
  package.json
  src/
    app.js
    routes/
      health.js
      items.js
    middleware/
      requestLogger.js
      notFound.js
```

---

## Шаг 2. Health router

```javascript
// src/routes/health.js
import { Router } from "express";

const router = Router();

router.get("/", (_req, res) => {
  res.json({
    status: "ok",
    service: "shop-bff",
    uptime: process.uptime(),
  });
});

export default router;
```

---

## Шаг 3. Items stub

```javascript
// src/routes/items.js
import { Router } from "express";

const router = Router();

const STUB_ITEMS = [
  { id: "1", name: "Keyboard", price: 79.99 },
  { id: "2", name: "Mouse", price: 29.99 },
];

router.get("/", (_req, res) => {
  res.json({ items: STUB_ITEMS, total: STUB_ITEMS.length });
});

router.get("/:id", (req, res) => {
  const item = STUB_ITEMS.find((i) => i.id === req.params.id);
  if (!item) {
    return res.status(404).json({ error: "Item not found", id: req.params.id });
  }
  return res.json(item);
});

export default router;
```

---

## Шаг 4. Middleware

```javascript
// src/middleware/requestLogger.js
export function requestLogger(req, res, next) {
  const start = Date.now();
  res.on("finish", () => {
    console.log(
      `[${new Date().toISOString()}] ${req.method} ${req.originalUrl} → ${res.statusCode} (${Date.now() - start}ms)`
    );
  });
  next();
}
```

```javascript
// src/middleware/notFound.js
export function notFoundHandler(_req, res) {
  res.status(404).json({ error: "Not found", path: _req.originalUrl });
}
```

---

## Шаг 5. app.js — сборка цепочки

```javascript
// src/app.js
import express from "express";
import { requestLogger } from "./middleware/requestLogger.js";
import { notFoundHandler } from "./middleware/notFound.js";
import healthRouter from "./routes/health.js";
import itemsRouter from "./routes/items.js";

const app = express();
const PORT = Number(process.env.PORT ?? 3096);

app.use(requestLogger);
app.use(express.json());

app.use("/health", healthRouter);
app.use("/api/v1/items", itemsRouter);

app.use(notFoundHandler);

app.listen(PORT, () => {
  console.log(`BFF ready: http://localhost:${PORT}`);
});

export default app;
```

---

## Шаг 6. Запуск и проверка

```bash
npm run dev
```

В другом терминале:

```bash
curl -s http://localhost:3096/health | jq
curl -s http://localhost:3096/api/v1/items | jq
curl -s http://localhost:3096/api/v1/items/1 | jq
curl -s http://localhost:3096/api/v1/items/999 | jq
curl -s http://localhost:3096/unknown | jq
```

### Ожидаемые результаты

| Запрос | Статус | Тело (фрагмент) |
|--------|--------|-----------------|
| `GET /health` | 200 | `"status":"ok"` |
| `GET /api/v1/items` | 200 | массив `items` |
| `GET /api/v1/items/1` | 200 | `"name":"Keyboard"` |
| `GET /api/v1/items/999` | 404 | `"error":"Item not found"` |
| `GET /unknown` | 404 | `"error":"Not found"` |

В консоли сервера — строка лога на каждый запрос.

---

## Шаг 7. (Опционально) POST заглушка

```javascript
router.post("/", (req, res) => {
  const { name, price } = req.body ?? {};
  if (!name || price == null) {
    return res.status(400).json({ error: "name and price required" });
  }
  const item = { id: String(Date.now()), name, price: Number(price) };
  STUB_ITEMS.push(item);
  return res.status(201).json(item);
});
```

```bash
curl -s -X POST http://localhost:3096/api/v1/items \
  -H "Content-Type: application/json" \
  -d '{"name":"Monitor","price":199}' | jq
```

Без `express.json()` тело будет `{}` — см. [25-express-body-cors.md](25-express-body-cors.md).

---

## Критерии успеха

- [ ] `npm run dev` стартует без ошибок
- [ ] Все curl из таблицы возвращают ожидаемые статусы
- [ ] Логи показывают method, url, status, время
- [ ] Маршруты в отдельных файлах, не в одном `app.js`
- [ ] 404 для несуществующих путей — JSON, не HTML

---

## Если что-то пошло не так

| Симптом | Вероятная причина | Решение |
|---------|-------------------|---------|
| `Cannot find module` | неверный путь import | проверьте `.js` в ESM import |
| `req.body` пустой | нет `express.json()` | добавьте до маршрутов |
| Вечная загрузка curl | нет `next()` в middleware | добавьте `next()` |
| 404 на `/api/v1/items` | опечатка в prefix | сверьте `app.use` и router |
| `EADDRINUSE` | порт занят | `PORT=3097 npm run dev` |
| Двойной ответ 500 | нет `return` после `res.json` | добавьте `return` |

---

## Расширение (если осталось время)

1. Добавьте `requestId` в middleware и в JSON ошибок.
2. Вынесите `PORT` в `process.env` ([28-env-config.md](28-env-config.md)).
3. Напишите минимальный `errorHandler` ([24-express-errors.md](24-express-errors.md)).

---

## Связь с курсом

- Эталон — [`examples/solutions/`](examples/solutions/) после своей попытки.
- Следующая лаба shop — [26-lab-express-shop.md](26-lab-express-shop.md).
- FastAPI клиент — [20-fastapi-client.md](20-fastapi-client.md).

---

## Типичные ошибки в лабе

1. Забыли `"type": "module"` — синтаксис `import` падает.

2. `itemsRouter.get("/api/v1/items")` вместо `get("/")` при монтировании prefix.

3. `notFoundHandler` **до** маршрутов — всё 404.

4. Не экспортировали `default router`.

5. Тестируют порт 8090 вместо 3096 — это FastAPI, не BFF.

---

## Резюме

Лаба собирает минимальный Express BFF: health, versioned items stub, logging middleware, централизованный 404. Структура `src/routes` и `src/middleware` масштабируется до proxy на FastAPI. Проверка через curl обязательна до интеграции с React.

---

## Чек-лист

- Какой URL health endpoint?
- Где монтируется items router и какой полный path для списка?
- Почему POST требует `express.json()`?
- Что должно появиться в логе после `GET /api/v1/items/999`?
- Какой порт BFF по умолчанию и как его переопределить?
- Где должен стоять `notFoundHandler` относительно маршрутов?

Следующий урок: [24. Обработка ошибок и async handlers](24-express-errors.md).
