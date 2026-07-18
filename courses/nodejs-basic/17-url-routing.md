# 17. URL, query string, роутинг вручную

## Сценарий с работы

Фронтенд запрашивает `/api/v1/items?category=peripherals&page=2&limit=10`. BFF на чистом `http` получает `req.url === "/api/v1/items?category=peripherals&page=2&limit=10"`. Разработчик сравнивает `url === "/api/v1/items"` — **всегда 404**. Второй баг: ручной `split("?")` ломается на encoded `?` в query. Третий: `/api/v1/items/kb-001` и `/api/v1/items/kb-001/` treated as different routes.

Класс **`URL`** (WHATWG) и **`URLSearchParams`** — стандартный разбор адреса в Node и браузере. До Express вы строите **ручной роутер** — switch/if по method + pathname.

## Что вы узнаете

- `new URL(req.url, base)` для относительных path на сервере
- `url.pathname`, `url.searchParams`
- Ручной роутинг: таблица маршрутов, параметры path
- Нормализация trailing slash
- Отличие routing в Node от Express `Router`
- Связь с BFF `:3096` и FastAPI `:8090`

---

## Проблема `req.url`

`req.url` содержит **path + query**, без host:

```text
/api/v1/items?category=peripherals&limit=5
```

Прямое сравнение с `/api/v1/items` **не работает**.

---

## Класс URL на сервере

Нужен **base** с origin (host + port):

```javascript
import { createServer } from "node:http";

createServer((req, res) => {
  const host = req.headers.host ?? "127.0.0.1:3096";
  const url = new URL(req.url, `http://${host}`);

  console.log(url.pathname);  // /api/v1/items
  console.log(url.search);    // ?category=peripherals&limit=5
  console.log(url.searchParams.get("category")); // peripherals
  console.log(url.searchParams.get("limit"));    // 5

  res.end("ok");
}).listen(3096);
```

| Свойство | Пример |
|----------|--------|
| `pathname` | `/api/v1/items` |
| `searchParams` | `URLSearchParams` |
| `search` | `?a=1&b=2` |
| `href` | полный URL |

---

## URLSearchParams

```javascript
const params = url.searchParams;

const category = params.get("category"); // string | null
const page = Number(params.get("page") ?? "1");
const limit = Math.min(Number(params.get("limit") ?? "20"), 100);

if (category) {
  items = items.filter((x) => x.category === category);
}
```

Итерация:

```javascript
for (const [key, value] of url.searchParams) {
  console.log(key, value);
}
```

Построение query для клиента:

```javascript
const q = new URLSearchParams({ category: "peripherals", page: "2" });
const path = `/api/v1/items?${q.toString()}`;
// /api/v1/items?category=peripherals&page=2
```

---

## Ручной роутер — таблица маршрутов

```javascript
const routes = [
  {
    method: "GET",
    pattern: /^\/health$/,
    handler: healthHandler,
  },
  {
    method: "GET",
    pattern: /^\/api\/v1\/items$/,
    handler: listItemsHandler,
  },
  {
    method: "GET",
    pattern: /^\/api\/v1\/items\/([^/]+)$/,
    handler: getItemHandler,
  },
];

function matchRoute(method, pathname) {
  for (const route of routes) {
    if (route.method !== method) continue;
    const m = pathname.match(route.pattern);
    if (m) return { route, params: m.slice(1) };
  }
  return null;
}

createServer((req, res) => {
  const host = req.headers.host ?? "127.0.0.1:3096";
  const url = new URL(req.url, `http://${host}`);
  const pathname = normalizePath(url.pathname);

  const matched = matchRoute(req.method, pathname);
  if (!matched) {
    sendJson(res, 404, { error: "Not found" });
    return;
  }
  matched.route.handler(req, res, url, matched.params);
});
```

---

## Path-параметры

```javascript
function getItemHandler(req, res, url, params) {
  const [id] = params;
  const item = catalog.items.find((x) => x.id === id);
  if (!item) {
    sendJson(res, 404, { error: "Item not found", id });
    return;
  }
  sendJson(res, 200, item);
}
```

Regex `[^/]+` запрещает slash в id — защита от traversal в path.

---

## Query + path вместе

```javascript
function listItemsHandler(req, res, url) {
  let items = catalog.items;
  const category = url.searchParams.get("category");
  if (category) {
    items = items.filter((x) => x.category === category);
  }
  const q = url.searchParams.get("q");
  if (q) {
    const lower = q.toLowerCase();
    items = items.filter((x) => x.name.toLowerCase().includes(lower));
  }
  sendJson(res, 200, { items, count: items.length });
}
```

Контракт близок к FastAPI query params на `:8090`.

---

## Trailing slash

```javascript
function normalizePath(pathname) {
  if (pathname.length > 1 && pathname.endsWith("/")) {
    return pathname.slice(0, -1);
  }
  return pathname;
}
```

Или редирект 308 — в Express `strict routing`. Для лаб достаточно normalize.

---

## Method dispatch

```javascript
function matchRoute(method, pathname) {
  // ...
}

// или Map:
const handlers = new Map([
  ["GET /api/v1/items", listItems],
  ["GET /health", health],
]);

const key = `${req.method} ${pathname}`;
const handler = handlers.get(key);
```

Express использует `app.get`, `app.post` — sugar над этим же.

---

## Ошибки парсинга URL

```javascript
try {
  const url = new URL(req.url, `http://${host}`);
} catch {
  sendJson(res, 400, { error: "Bad request URL" });
  return;
}
```

Невалидный percent-encoding в path — редко, но возможно.

---

## Клиентская сторона — тот же URL API

```javascript
const base = "http://127.0.0.1:3096";
const url = new URL("/api/v1/items", base);
url.searchParams.set("category", "peripherals");

const res = await fetch(url);
```

См. [18-http-client.md](18-http-client.md).

---

## Связь с FastAPI

FastAPI `:8090`:

```text
GET /api/v1/items?skip=0&limit=10
```

BFF `:3096` может **проксировать** query as-is ([20-fastapi-client.md](20-fastapi-client.md), [34-lab-bff.md](34-lab-bff.md)).

---

## Типичные ошибки

- **Сравнение `req.url` без отделения query** — маршрут не матчится.
- **Ручной split("?")** вместо `URL` — ломается на encoding.
- **Дублирование `/items` и `/items/`** — 404 для половины клиентов.
- **Невалидный `page`** — `Number("abc")` → NaN; нужна валидация.
- **Regex без `^` `$`** — частичный match лишних path.

---

## Резюме

- Парсите запрос через **`new URL(req.url, "http://" + host)`**.
- **`pathname`** — для роутинга; **`searchParams`** — для фильтров и пагинации.
- Ручной роутер: method + regex/switch + нормализация slash.
- Express/Fastify добавляют sugar, но модель та же.

## Чек-лист

- Почему `req.url === "/api/v1/items"` ломается при query string?
- Как получить `category` из `?category=peripherals`?
- Зачем base URL при `new URL` на сервере?
- Как извлечь `id` из `/api/v1/items/kb-001`?
- Чем `URLSearchParams` удобен для построения query?
- Зачем нормализовать trailing slash?

Следующий урок: [18. HTTP-клиент: `fetch` и заголовки](18-http-client.md).
