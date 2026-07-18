# 15. Модуль `http`: сервер и запросы

## Сценарий с работы

Тимлид: «Для понимания Express поднимите **сырой** HTTP-сервер на `http`. BFF на `:3096` должен отвечать `/health` JSON и отдавать 404 с телом, а не пустым обрывом». Джун пишет `res.end(JSON.stringify({ ok: true }))` без статуса и заголовка — React-клиент получает `200` с `text/plain`, `response.json()` иногда падает. Второй баг: забыли `res.end()` — клиент висит до таймаута. Третий: на `POST` не читают body и wonder why `req.body` undefined (его **нет** в core `http`).

Модуль **`node:http`** — минимальный HTTP/1.1 сервер и клиент в Node. Express/Fastify строятся поверх этих примитивов. Для mock-exams BFF слушает **`:3096`**, FastAPI backend — **`:8090`**.

## Что вы узнаете

- `http.createServer` и lifecycle запроса
- Объекты `IncomingMessage` (req) и `ServerResponse` (res)
- Статус-коды, `writeHead`, `setHeader`, `end`
- `Content-Type` и charset для JSON
- Чтение тела запроса из stream
- Graceful basics: один handler — один ответ

---

## Минимальный сервер

```javascript
import { createServer } from "node:http";

const server = createServer((req, res) => {
  res.statusCode = 200;
  res.setHeader("Content-Type", "text/plain; charset=utf-8");
  res.end("Hello from Node BFF\n");
});

server.listen(3096, "127.0.0.1", () => {
  console.log("Listening http://127.0.0.1:3096");
});
```

Проверка:

```bash
curl -i http://127.0.0.1:3096/
```

Флаг `-i` показывает статус и заголовки.

---

## Объект запроса `req`

| Свойство / метод | Описание |
|------------------|----------|
| `req.method` | `GET`, `POST`, … |
| `req.url` | path + query (`/items?page=1`) |
| `req.headers` | объект заголовков (нижний регистр ключей) |
| `req.httpVersion` | `1.1` |
| `req` как stream | тело POST — через `data` / async iteration |

```javascript
createServer((req, res) => {
  console.log(req.method, req.url);
  console.log("host:", req.headers.host);
  console.log("accept:", req.headers.accept);
  res.end("ok");
});
```

**Нет** `req.body`, `req.params`, `req.query` — их добавляет фреймворк или вы сами ([17-url-routing.md](17-url-routing.md)).

---

## Объект ответа `res`

| Метод | Назначение |
|-------|------------|
| `res.statusCode = 404` | код до отправки заголовков |
| `res.setHeader(name, value)` | один заголовок |
| `res.writeHead(code, headers)` | код + заголовки сразу |
| `res.write(chunk)` | часть тела (опционально) |
| `res.end(data?)` | завершить ответ |

**Правило:** на каждый запрос ровно **один** финальный `res.end()` (или `end` после `write`).

---

## JSON и Content-Type

Клиенты (fetch, React) ожидают явный тип:

```javascript
function sendJson(res, statusCode, data) {
  const body = JSON.stringify(data);
  res.writeHead(statusCode, {
    "Content-Type": "application/json; charset=utf-8",
    "Content-Length": Buffer.byteLength(body, "utf8"),
  });
  res.end(body);
}

createServer((req, res) => {
  if (req.url === "/health" && req.method === "GET") {
    sendJson(res, 200, { status: "ok", service: "shop-bff" });
    return;
  }
  sendJson(res, 404, { error: "Not found" });
});
```

`Content-Length` не обязателен для маленьких ответов (Node выставит chunked), но явная длина помогает некоторым клиентам.

---

## Статус-коды — минимум для BFF

| Код | Когда | Тело |
|-----|-------|------|
| 200 | успех GET | JSON data |
| 201 | создан ресурс POST | JSON + Location (позже) |
| 400 | невалидный запрос | `{ error: "..." }` |
| 404 | маршрут не найден | JSON, не пустая строка |
| 405 | метод не разрешён | Allow header (позже) |
| 500 | необработанная ошибка | без stack trace наружу |

```javascript
if (req.method !== "GET") {
  sendJson(res, 405, { error: "Method not allowed" });
  return;
}
```

Подробнее REST — [`api-design`](../api-design/README.md).

---

## Health endpoint — паттерн mock-exams

```javascript
createServer((req, res) => {
  if (req.method === "GET" && req.url === "/health") {
    sendJson(res, 200, {
      status: "ok",
      uptime: process.uptime(),
      timestamp: new Date().toISOString(),
    });
    return;
  }
  // ...
});
```

Тот же контракт, что FastAPI [`/health`](../../deploy/fastapi/README.md) на `:8090` — удобно для orchestrator и smoke-тестов.

---

## Чтение тела POST

```javascript
async function readBody(req) {
  const chunks = [];
  for await (const chunk of req) {
    chunks.push(chunk);
  }
  return Buffer.concat(chunks).toString("utf8");
}

createServer(async (req, res) => {
  if (req.method === "POST" && req.url === "/echo") {
    const raw = await readBody(req);
    let data;
    try {
      data = JSON.parse(raw);
    } catch {
      sendJson(res, 400, { error: "Invalid JSON" });
      return;
    }
    sendJson(res, 200, { received: data });
    return;
  }
  sendJson(res, 404, { error: "Not found" });
});
```

Лимит размера body в production обязателен; в Express — `express.json({ limit: "100kb" })`.

---

## Обработка ошибок в handler

```javascript
createServer(async (req, res) => {
  try {
    await handle(req, res);
  } catch (err) {
    console.error(err);
    if (!res.headersSent) {
      sendJson(res, 500, { error: "Internal server error" });
    }
  }
});
```

Если заголовки уже отправлены — второй `writeHead` невозможен; только `res.end()`.

---

## `res` как Writable stream

Большой файл — stream в ответ ([13-streams.md](13-streams.md)):

```javascript
import { createReadStream } from "node:fs";
import { pipeline } from "node:stream/promises";

// внутри handler:
res.writeHead(200, { "Content-Type": "application/json; charset=utf-8" });
await pipeline(createReadStream(catalogPath), res);
```

---

## Связь с Express (preview)

Express:

```javascript
app.get("/health", (req, res) => res.json({ status: "ok" }));
```

Под капотом — тот же `http.createServer`, плюс routing, middleware, body parser ([21-express-routing.md](21-express-routing.md)).

---

## Типичные ошибки

- **Нет `Content-Type: application/json`** — клиент не парсит JSON.
- **Забыли `return` после ответа** — вызывается второй `end` → `ERR_HTTP_HEADERS_SENT`.
- **404 с пустым телом** — fetch ok=false, но `json()` падает на пустой строке.
- **`req.url` без парсинга** — путают path и query; нужен `URL` ([17-url-routing.md](17-url-routing.md)).
- **Слушать `0.0.0.0` в dev без нужды** — лишняя поверхность; для лаб `127.0.0.1`.

---

## Резюме

- `http.createServer` принимает `(req, res)` callback на каждый запрос.
- Ответ: статус + заголовки + **`res.end(body)`**.
- JSON API: **`Content-Type: application/json; charset=utf-8`** и осмысленные коды 4xx/5xx.
- Тело запроса читают из **stream** `req`; в core нет `req.body`.

## Чек-лист

- Чем `res.writeHead` отличается от `res.statusCode` + `setHeader`?
- Почему на один запрос нужен один `end`?
- Какой Content-Type для JSON в BFF?
- Где взять HTTP method и path в core http?
- Почему 404 лучше отдавать с JSON `{ error }`?
- Как прочитать тело POST в async handler?

Следующий урок: [16. Лаба: сырой HTTP-сервер](16-lab-http-server.md).
