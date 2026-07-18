# 29. `fetch` и работа с HTTP

## Сценарий с работы

Фронтенд shop-приложения должен загрузить список товаров с backend. Вы пишете `const data = await fetch(url)` и удивляетесь, что `data` — не JSON, а объект `Response`. Запрос на несуществующий `/api/v1/items/999` не попадает в `catch`, хотя сервер вернул 404. Второй раз вызываете `response.json()` — ошибка «body already read». В браузере запрос на `http://localhost:8090` с другого порта блокирует CORS. В Node 16 ещё нет глобального `fetch` — коллега тянет `node-fetch`.

`fetch` — стандартный API для HTTP в браузере и современном Node. Он возвращает Promise и требует явной работы со статусом и телом ответа.

## Что вы узнаете

- Базовый GET и разбор объекта `Response`
- Чтение тела: `json()`, `text()`, `blob()` — один раз
- POST/PUT/PATCH с JSON и заголовками
- Почему HTTP-ошибки не reject `fetch`
- Обёртка `api()` для стенда FastAPI на `:8090`
- Query-параметры через `URLSearchParams`
- Отмена запроса с `AbortController`
- CORS в браузере vs Node
- Безопасность и валидация ответа

---

## Базовый GET

```javascript
const response = await fetch("http://localhost:8090/health");

console.log(response.status);      // 200
console.log(response.ok);          // true — status в диапазоне 200–299
console.log(response.statusText);  // "OK"
console.log(response.headers.get("content-type"));
```

`fetch(url)` возвращает Promise, который **fulfills** с `Response` при получении ответа от сервера (включая 404 и 500).

Тело ответа **не** парсится автоматически:

```javascript
const data = await response.json();
console.log(data);
```

На стенде [deploy/fastapi](../../deploy/fastapi/README.md) health обычно возвращает JSON со статусом сервиса.

---

## Response: что внутри

| Свойство / метод | Назначение |
|------------------|------------|
| `status` | числовой код HTTP |
| `ok` | `true` если 200–299 |
| `headers` | `Headers` (Map-like) |
| `json()` | парсинг JSON → Promise |
| `text()` | строка тела |
| `blob()` | бинарные данные |
| `arrayBuffer()` | сырые байты |

Тело можно прочитать **только один раз**:

```javascript
const res = await fetch("http://localhost:8090/api/v1/items");
await res.json();
// await res.json(); // TypeError: body stream already read
```

Для повторного разбора — `clone()`:

```javascript
const res = await fetch(url);
const copy = res.clone();
const a = await res.json();
const b = await copy.json(); // тот же JSON дважды — редко нужно
```

---

## Проверка HTTP-ошибок

**Критично:** `fetch` **не reject** на 404, 500 и т.д. Reject — при сетевой ошибке, неверном URL (иногда), отмене (`AbortError`).

```javascript
const res = await fetch("http://localhost:8090/api/v1/items/99999");

if (!res.ok) {
  const body = await res.text();
  throw new Error(`HTTP ${res.status}: ${body}`);
}

const item = await res.json();
```

Без проверки `ok` код продолжит работу с телом ошибки FastAPI (`{"detail":"Not found"}`) как будто это успех.

---

## Обёртка для API mock-exams

Паттерн для уроков nodejs/react — единая точка для base URL и ошибок:

```javascript
const API_BASE = "http://localhost:8090";

async function api(path, options = {}) {
  const res = await fetch(`${API_BASE}${path}`, {
    headers: {
      Accept: "application/json",
      ...options.headers,
    },
    ...options,
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`${res.status} ${body}`);
  }

  if (res.status === 204) {
    return null;
  }

  return res.json();
}

// использование
const items = await api("/api/v1/items");
console.log(items);
```

Стенд FastAPI:

| URL | Назначение |
|-----|------------|
| [http://localhost:8090](http://localhost:8090) | корень API |
| [http://localhost:8090/docs](http://localhost:8090/docs) | Swagger UI |
| [http://localhost:8090/health](http://localhost:8090/health) | health check |
| [http://localhost:8090/api/v1/items](http://localhost:8090/api/v1/items) | каталог товаров |

Запуск стенда — [deploy/fastapi/README.md](../../deploy/fastapi/README.md). Связь с курсами [fastapi](../fastapi/README.md) и [api-design](../api-design/README.md).

---

## POST с JSON

```javascript
const newItem = await api("/api/v1/items", {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
  },
  body: JSON.stringify({
    name: "Keyboard",
    price: 79.99,
    description: "Mechanical",
  }),
});

console.log(newItem.id);
```

`Content-Type: application/json` сообщает серверу формат тела. FastAPI/Pydantic валидирует схему — неверное тело → 422 с деталями в JSON.

Другие методы:

```javascript
await api(`/api/v1/items/${id}`, { method: "PUT", body: JSON.stringify(patch) });
await api(`/api/v1/items/${id}`, { method: "DELETE" });
```

---

## Query-параметры

```javascript
const params = new URLSearchParams({
  page: "1",
  limit: "10",
  q: "keyboard",
});

const url = `http://localhost:8090/api/v1/items?${params}`;
const res = await fetch(url);
```

`URLSearchParams` кодирует спецсимволы. Альтернатива:

```javascript
const u = new URL("/api/v1/items", "http://localhost:8090");
u.searchParams.set("page", "1");
const res = await fetch(u);
```

Не собирайте query конкатенацией строк без encode — пробелы и `&` сломают URL.

---

## Заголовки и авторизация (обзор)

```javascript
await api("/api/v1/items", {
  headers: {
    Authorization: `Bearer ${token}`,
  },
});
```

Секреты — не в URL, не в клиентском коде продакшена (только public tokens / BFF). JWT flow — react-intermediate, nodejs-intermediate.

---

## AbortController: отмена и таймаут

```javascript
const controller = new AbortController();
const timeoutId = setTimeout(() => controller.abort(), 5000);

try {
  const res = await fetch("http://localhost:8090/api/v1/items", {
    signal: controller.signal,
  });
  const data = await res.json();
  console.log(data);
} catch (err) {
  if (err.name === "AbortError") {
    console.log("Request timed out or aborted");
  } else {
    throw err;
  }
} finally {
  clearTimeout(timeoutId);
}
```

При отмене `fetch` reject с `DOMException` / `AbortError`. В React Strict Mode и при размонтировании компонента отмена предотвращает setState после unmount.

---

## Параллельные запросы

```javascript
const [health, items] = await Promise.all([
  api("/health"),
  api("/api/v1/items"),
]);
```

См. [27-async-await.md](27-async-await.md) — не делайте два await подряд, если запросы независимы.

---

## CORS (браузер)

Из браузера на `http://localhost:5173` (Vite) запрос на `http://localhost:8090` — **другой origin** (порт считается). Браузер применяет **CORS**; сервер должен отдать заголовки вроде:

```http
Access-Control-Allow-Origin: http://localhost:5173
```

В **Node** (скрипт, тест без браузера) CORS нет — это ограничение браузера. Настройка на FastAPI — [api-design](../api-design/README.md), [browser-platform](../javascript-path.md).

Preflight `OPTIONS` для нестандартных заголовков и методов — отдельная тема api-design.

---

## Node.js и глобальный fetch

С **Node 18+** `fetch` встроен (Undici). Раньше:

```javascript
import fetch from "node-fetch";
```

В лабах курса предполагается Node LTS с глобальным `fetch` ([00-environment.md](00-environment.md)).

---

## Обработка ошибок: сеть vs HTTP vs JSON

```javascript
async function loadItems() {
  let res;
  try {
    res = await fetch("http://localhost:8090/api/v1/items");
  } catch (err) {
  // сеть, DNS, CORS (браузер), abort
    console.error("Network:", err.message);
    throw err;
  }

  if (!res.ok) {
    console.error("HTTP:", res.status);
    throw new Error(`HTTP ${res.status}`);
  }

  try {
    return await res.json();
  } catch (err) {
    console.error("Invalid JSON");
    throw err;
  }
}
```

После `json()` валидируйте форму данных (в typescript-basic — Zod).

---

## Безопасность

- **HTTPS** в проде — не передавать токены по HTTP.
- Не логировать полные тела с PII.
- **XSS:** не вставлять `json` в `innerHTML` без санитизации ([browser-platform](../javascript-path.md)).
- Ограничивать размер ответа на BFF при проксировании.

---

## fetch vs XMLHttpRequest

`fetch` — Promise-based, streaming body, современный стандарт. `XMLHttpRequest` — legacy, всё ещё в старом коде. Новый код — `fetch` или HTTP-клиенты (axios в nodejs — обёртка с interceptors).

---

## Пример: сквозной сценарий shop

```javascript
async function printCatalog() {
  const items = await api("/api/v1/items");
  for (const item of items) {
    console.log(`${item.name}: $${item.price}`);
  }
}

await printCatalog();
```

Данные с `:8090` совпадают с тем, что используют Python-треки и будущий react-basic.

---

## Связь с курсом

- [26-promises.md](26-promises.md) — fetch возвращает Promise.
- [27-async-await.md](27-async-await.md) — await response.json().
- [28-lab-async.md](28-lab-async.md) — fakeFetch перед реальным стендом.
- [32-error-handling.md](32-error-handling.md) — стратегии ошибок.
- [35-regex-json-date.md](35-regex-json-date.md) — JSON.parse границы.
- [deploy/fastapi](../../deploy/fastapi/README.md) — стенд `:8090`.

---

## Типичные ошибки

1. **Забыть `await response.json()`** — работа с Response, не с данными.

2. **Нет проверки `response.ok`** — 404/500 как «успех».

3. **Двойное чтение body** — stream already read.

4. **Забыть `JSON.stringify` в body POST** — сервер получит `[object Object]`.

5. **Нет `Content-Type: application/json`** — FastAPI может не распарсить тело.

6. **CORS в браузере** — ошибка в консоли, в Node всё «работает».

7. **Секреты в query string** — логируются прокси и историей.

8. **Огромный JSON без пагинации** — блокировка при parse ([24-event-loop.md](24-event-loop.md)).

---

## Резюме

`fetch` возвращает Promise<Response>. Успешный Promise — это получен **ответ**, не обязательно HTTP 200. Проверяйте `ok` и статус. Тело читается один раз через `json()`/`text()`. POST требует `method`, `headers` и `JSON.stringify(body)`. Для mock-exams используйте base `http://localhost:8090` и пути `/api/v1/items`, `/health`, документацию `/docs`. `AbortController` отменяет запрос. CORS — только в браузере. Node 18+ имеет встроенный fetch.

---

## Чек-лист

- Reject ли `fetch` на HTTP 500?
- Чем `response` отличается от данных после `json()`?
- Зачем проверять `response.ok`?
- Как отменить долгий запрос?
- Как собрать URL с query без ручного encode?
- Почему POST с объектом в `body` без stringify ломается?
- Где в репозитории поднять API на порту 8090?

Следующий урок: [30. ES modules](30-es-modules.md).
