# 25. Body parser, static, CORS

## Сценарий с работы

React на `http://localhost:5173` шлёт `POST /api/v1/items` с JSON-телом на BFF `:3096`. В DevTools: «CORS policy blocked» и «No 'Access-Control-Allow-Origin'». Отдельно QA жалуется: «POST создаёт item с `price: undefined`» — тело не парсится, потому что разработчик забыл middleware. Ещё один тикет: «Отдайте `/docs` со static OpenAPI» — для BFF реже, но `express.static` полезен для локальных fixture.

BFF — мост между браузером и backend; **CORS и парсинг тела** настраиваются на Node, не на FastAPI, если браузер бьёт именно в BFF.

## Что вы узнаете

- `express.json()` и лимиты размера
- `express.urlencoded` для form-data
- Пакет `cors` и preflight OPTIONS
- `express.static` для файлов
- Порядок middleware относительно маршрутов
- Разница: CORS на BFF vs на FastAPI напрямую

---

## express.json() — парсинг JSON-тела

```javascript
import express from "express";

const app = express();

// По умолчанию limit ~100kb
app.use(express.json());

app.post("/api/v1/items", (req, res) => {
  console.log(req.body); // объект, не строка
  const { name, price } = req.body;
  if (!name) {
    return res.status(400).json({ error: "name required" });
  }
  res.status(201).json({ id: "1", name, price });
});
```

С лимитом для защиты от огромных payload:

```javascript
app.use(express.json({ limit: "1mb" }));
```

При превышении — `413 Payload Too Large` (обрабатывайте в error handler).

**Content-Type:** клиент должен слать `Content-Type: application/json`. Иначе `req.body` может быть `{}`.

```bash
curl -X POST http://localhost:3096/api/v1/items \
  -H "Content-Type: application/json" \
  -d '{"name":"Pen","price":3.5}'
```

---

## express.raw и express.text (справка)

| Middleware | Content-Type | req.body |
|------------|--------------|----------|
| `express.json()` | application/json | object |
| `express.urlencoded()` | application/x-www-form-urlencoded | object |
| `express.raw()` | application/octet-stream | Buffer |
| `express.text()` | text/plain | string |

Для shop API достаточно `json` + иногда `urlencoded` для legacy форм.

---

## express.urlencoded

```javascript
app.use(express.urlencoded({ extended: true }));
```

`extended: true` — библиотека `qs`, вложенные объекты в form. Для чистого JSON API можно не подключать.

---

## CORS — зачем на BFF

Браузер **Same-Origin Policy**: страница с `:5173` не может читать ответ с `:3096` без заголовков CORS.

```text
React :5173  ──fetch──►  BFF :3096  ──►  FastAPI :8090
         ▲                      │
         └── CORS headers ──────┘
              (нужны на BFF)
```

Если React ходит **только** в BFF, CORS на FastAPI для браузера не обязателен — server-to-server без CORS.

---

## Пакет cors

```bash
npm install cors
```

```javascript
import cors from "cors";

const allowedOrigins = [
  "http://localhost:5173",   // Vite React dev
  "http://localhost:8097",   // deploy/react
];

app.use(
  cors({
    origin(origin, callback) {
      // curl / Postman — origin undefined, разрешаем
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error("Not allowed by CORS"));
      }
    },
    credentials: true, // если cookies / Authorization из браузера
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization", "X-Request-Id"],
  })
);
```

Простой dev-вариант (не для prod без списка origin):

```javascript
app.use(cors({ origin: "http://localhost:5173" }));
```

---

## Preflight OPTIONS

Для `POST` с `Content-Type: application/json` браузер сначала шлёт **OPTIONS**:

```text
OPTIONS /api/v1/items
Access-Control-Request-Method: POST
Access-Control-Request-Headers: content-type
```

Пакет `cors` отвечает автоматически. Если CORS middleware **после** auth, который блокирует OPTIONS без API key — preflight ломается:

```javascript
// Решение: пропускать OPTIONS или ставить cors первым
app.use(cors({ ... }));
app.use(requireApiKey); // только на нужных prefix, не глобально
```

---

## credentials и wildcard

```javascript
// Нельзя: origin: "*" с credentials: true
cors({ origin: "*", credentials: true }); // браузер отклонит

// Нужен явный origin
cors({ origin: "http://localhost:5173", credentials: true });
```

---

## express.static

Раздача файлов из папки:

```javascript
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

app.use("/public", express.static(path.join(__dirname, "../public")));
// GET /public/logo.png → файл public/logo.png
```

Для BFF mock-exams static опционален (mock JSON, локальная документация). Не путайте с production nginx — там static часто на edge.

---

## Рекомендуемый порядок middleware

```javascript
app.use(requestLogger);
app.use(cors({ origin: allowedOrigins, credentials: true }));
app.use(express.json({ limit: "1mb" }));
app.use(express.urlencoded({ extended: true }));

app.use("/health", healthRouter);
app.use("/api/v1/items", itemsRouter);

app.use(notFoundHandler);
app.use(errorHandler);
```

CORS и парсеры — **до** маршрутов, которые читают `req.body` или отвечают браузеру.

---

## Proxy POST: проброс тела

При BFF-proxy тело уже распарсено в `req.body`; при forward на FastAPI серialize снова:

```javascript
router.post("/", asyncHandler(async (req, res) => {
  const upstream = await fetch(`${FASTAPI_URL}/api/v1/items`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(req.body),
  });
  const data = await upstream.json();
  res.status(upstream.status).json(data);
}));
```

Альтернатива — stream raw body (advanced); для лаб достаточно JSON.

---

## Ошибки CORS в DevTools

| Сообщение | Причина |
|-----------|---------|
| No 'Access-Control-Allow-Origin' | cors middleware не подключён или origin не в списке |
| Response to preflight doesn't pass | OPTIONS не обработан |
| Credential flag is true but ACAO is * | см. выше |

Исправление на **сервере BFF**, не в React.

---

## Связь с курсом

- [22-middleware.md](22-middleware.md) — порядок цепочки.
- [26-lab-express-shop.md](26-lab-express-shop.md) — shop + CORS.
- [32-bff-pattern.md](32-bff-pattern.md) — зачем BFF для браузера.
- [`api-design`](../api-design/README.md) — CORS глава.
- [`react-basic`](../react-basic/README.md) — клиент `:5173`.

---

## Типичные ошибки

1. **Нет `express.json()`** — `req.body` undefined, silent bugs.

2. **CORS после маршрутов** — preflight не доходит.

3. **`origin: "*"` + credentials** — браузер блокирует.

4. **Забыть Content-Type в curl** — тело не JSON для сервера.

5. **Доверять `req.body` без валидации** — injection, неверные типы.

6. **Настроить CORS только на FastAPI** — браузер всё равно бьёт в BFF.

7. **Огромный limit json** — DoS vector; разумный лимит + 413 handler.

---

## Резюме

`express.json()` парсит JSON-тело в `req.body` — подключать до POST/PATCH handlers. `cors` добавляет заголовки для cross-origin запросов из React; в dev — явный origin `:5173`. Preflight OPTIONS обрабатывает пакет `cors`. `express.static` раздаёт файлы по prefix. На BFF mock-exams CORS обязателен для SPA; парсинг тела нужен для proxy POST на FastAPI.

---

## Чек-лист

- Почему `req.body` пустой при POST из Postman с JSON?
- Какой origin разрешить для Vite dev server?
- Что такое preflight и когда браузер его шлёт?
- Почему `credentials: true` несовместим с `origin: "*"`?
- Где в цепочке поставить `cors` относительно auth middleware?
- Зачем лимит на `express.json()`?
- Кто должен отдавать CORS — BFF или FastAPI, если клиент — React?

Следующий урок: [26. Лаба: shop routes на Express](26-lab-express-shop.md).
