# 16. Лаба: минимальный HTTP-сервер на :3096

Цель — **поднять BFF-заготовку** на чистом `node:http`: `/health`, `/api/v1/items` из локального JSON, корректные статусы и заголовки. Порт **3096** — стандарт лаб mock-exams (Express BFF позже на том же порту).

**Время:** ~30–40 минут после [15-http-module.md](15-http-module.md).

## Стенд

```bash
cd courses/nodejs-basic/examples
node --version
```

Эталон: `solutions/lab/16-http-server.js`.

---

## Структура

```text
lab/
├── 16-server.js
└── data/
    └── catalog.json    # из лабы 11 или копия
```

---

## Задание 1. Хелпер `sendJson`

```javascript
// lab/16-server.js
function sendJson(res, statusCode, payload) {
  const body = JSON.stringify(payload);
  res.writeHead(statusCode, {
    "Content-Type": "application/json; charset=utf-8",
    "Content-Length": Buffer.byteLength(body, "utf8"),
  });
  res.end(body);
}
```

---

## Задание 2. Загрузка каталога при старте

```javascript
import { readFile } from "node:fs/promises";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const catalogPath = join(__dirname, "data", "catalog.json");

let catalogCache;

async function loadCatalogOnce() {
  const raw = await readFile(catalogPath, "utf8");
  catalogCache = JSON.parse(raw);
}

await loadCatalogOnce();
```

Для лабы кэш в памяти OK; capstone — прокси на FastAPI `:8090`.

---

## Задание 3. Роутинг (простой)

```javascript
import { createServer } from "node:http";

const server = createServer((req, res) => {
  const { method, url } = req;

  if (method === "GET" && url === "/health") {
    sendJson(res, 200, {
      status: "ok",
      service: "lab-16-bff",
      items: catalogCache.items.length,
    });
    return;
  }

  if (method === "GET" && url === "/api/v1/items") {
    sendJson(res, 200, { items: catalogCache.items });
    return;
  }

  sendJson(res, 404, { error: "Not found", path: url });
});

const PORT = 3096;
const HOST = "127.0.0.1";

server.listen(PORT, HOST, () => {
  console.log(`http://${HOST}:${PORT}/health`);
});
```

---

## Задание 4. Smoke-тесты curl

Терминал 1:

```bash
node lab/16-server.js
```

Терминал 2:

```bash
curl -i http://127.0.0.1:3096/health
curl -s http://127.0.0.1:3096/api/v1/items | head -c 200
curl -i http://127.0.0.1:3096/unknown
```

**Ожидаемо:**

- `/health` → `200`, JSON с `"status":"ok"`
- `/api/v1/items` → `200`, массив `items`
- `/unknown` → `404`, JSON `{ "error": "Not found", ... }`

---

## Задание 5. GET одного item по id

Добавьте маршрут `/api/v1/items/kb-001` (пока **без** URL class — простой `startsWith` + slice):

```javascript
if (method === "GET" && url.startsWith("/api/v1/items/")) {
  const id = url.slice("/api/v1/items/".length);
  const item = catalogCache.items.find((x) => x.id === id);
  if (!item) {
    sendJson(res, 404, { error: "Item not found", id });
    return;
  }
  sendJson(res, 200, item);
  return;
}
```

Проверка:

```bash
curl -s http://127.0.0.1:3096/api/v1/items/kb-001
curl -i http://127.0.0.1:3096/api/v1/items/missing
```

Улучшенный парсинг URL — [17-url-routing.md](17-url-routing.md).

---

## Задание 6. Method not allowed

```javascript
if (url === "/health" && method !== "GET") {
  sendJson(res, 405, { error: "Method not allowed" });
  return;
}
```

```bash
curl -i -X POST http://127.0.0.1:3096/health
```

---

## Задание 7. Логирование запроса

Перед роутингом:

```javascript
const started = Date.now();
res.on("finish", () => {
  console.log(method, url, res.statusCode, `${Date.now() - started}ms`);
});
```

---

## Критерии успеха

- [ ] Сервер слушает **127.0.0.1:3096**
- [ ] `/health` → 200 JSON
- [ ] `/api/v1/items` → 200 с массивом
- [ ] Несуществующий item → 404 JSON
- [ ] Неизвестный path → 404 JSON
- [ ] POST `/health` → 405
- [ ] Все JSON-ответы с `Content-Type: application/json; charset=utf-8`
- [ ] В логах время обработки после каждого запроса

---

## Если что-то пошло не так

| Симптом | Проверка |
|---------|----------|
| `EADDRINUSE` | другой процесс на 3096 — `npm run dev` или старый node |
| Пустой items | путь к catalog.json через `__dirname` |
| `ERR_HTTP_HEADERS_SENT` | `return` после каждого `sendJson` |
| curl висит | забыли `res.end()` |
| JSON invalid | catalog.json UTF-8, валидный синтаксис |

---

## Рефлексия

Зачем слушать `127.0.0.1`, а не `0.0.0.0`, на dev-машине?

---

Следующий урок: [17. URL, query string, роутинг вручную](17-url-routing.md).
