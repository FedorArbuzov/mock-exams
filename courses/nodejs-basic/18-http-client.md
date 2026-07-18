# 18. HTTP-клиент: `fetch` и заголовки

## Сценарий с работы

BFF на `:3096` должен при старте проверить FastAPI `:8090/health` и подтянуть каталог. Скрипт `await fetch(url)` «успешно» завершается при **503** от upstream — забыли проверить `response.ok`. Второй инцидент: запрос к медленному API висит 10 минут — нет **таймаута**. Третий: повторный `response.json()` — `body stream already read`. В Node 18+ глобальный `fetch` встроен; паттерны те же, что в [`javascript-basic/29-fetch`](../javascript-basic/29-fetch.md).

## Что вы узнаете

- GET/POST через `fetch` в Node
- Заголовки запроса и ответа
- Проверка `response.ok` и разбор ошибок HTTP
- `AbortSignal.timeout` и `AbortController`
- Base URL для BFF → FastAPI
- Отличие сетевой ошибки от 4xx/5xx

---

## Базовый GET

```javascript
const response = await fetch("http://127.0.0.1:3096/health");

console.log(response.status);     // 200
console.log(response.ok);         // true если 200–299
console.log(response.headers.get("content-type"));
```

Тело **не** парсится автоматически:

```javascript
const data = await response.json();
console.log(data.status); // "ok"
```

---

## HTTP-ошибки не reject fetch

**Критично:** `fetch` **fulfills** при 404, 500, 503. Reject — сеть, DNS, abort.

```javascript
const res = await fetch("http://127.0.0.1:8090/api/v1/items/99999");

if (!res.ok) {
  const text = await res.text();
  throw new Error(`HTTP ${res.status}: ${text}`);
}

const item = await res.json();
```

Без `!res.ok` код обрабатывает `{"detail":"Not found"}` как успешный item.

---

## Заголовки запроса

```javascript
const res = await fetch("http://127.0.0.1:8090/api/v1/items", {
  method: "GET",
  headers: {
    Accept: "application/json",
    "User-Agent": "shop-bff/1.0 (nodejs-basic)",
  },
});
```

POST JSON:

```javascript
const res = await fetch("http://127.0.0.1:8090/api/v1/items", {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    Accept: "application/json",
  },
  body: JSON.stringify({
    name: "USB Hub",
    price: 19.5,
    category: "accessories",
  }),
});
```

FastAPI вернёт 422 при невалидной схеме — снова проверяйте `ok`.

---

## Обёртка `apiFetch` для mock-exams

```javascript
const DEFAULT_TIMEOUT_MS = 10_000;

export async function apiFetch(path, options = {}) {
  const baseUrl = process.env.API_BASE_URL ?? "http://127.0.0.1:8090";
  const url = new URL(path, baseUrl);

  const timeoutMs = options.timeoutMs ?? DEFAULT_TIMEOUT_MS;
  const signal =
    options.signal ??
    AbortSignal.timeout(timeoutMs);

  const { timeoutMs: _t, ...fetchOptions } = options;

  const res = await fetch(url, {
    ...fetchOptions,
    signal,
    headers: {
      Accept: "application/json",
      ...fetchOptions.headers,
    },
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`HTTP ${res.status} ${url.pathname}: ${body}`);
  }

  const contentType = res.headers.get("content-type") ?? "";
  if (contentType.includes("application/json")) {
    return res.json();
  }
  return res.text();
}
```

Использование:

```javascript
const health = await apiFetch("/health");
const { items } = await apiFetch("/api/v1/items");
```

---

## Таймаут: AbortSignal

Node 18+:

```javascript
const res = await fetch("http://127.0.0.1:8090/health", {
  signal: AbortSignal.timeout(5_000),
});
```

При превышении — `DOMException` с `name === "TimeoutError"` (или AbortError в зависимости от версии).

Ручной контроллер — отмена из другого места:

```javascript
const controller = new AbortController();
const timer = setTimeout(() => controller.abort(), 5_000);

try {
  const res = await fetch(url, { signal: controller.signal });
  // ...
} finally {
  clearTimeout(timer);
}
```

---

## Query-параметры

```javascript
const url = new URL("/api/v1/items", "http://127.0.0.1:8090");
url.searchParams.set("skip", "0");
url.searchParams.set("limit", "10");

const res = await fetch(url);
```

Не склеивайте строки вручную — encoding спецсимволов.

---

## Чтение тела один раз

```javascript
const res = await fetch(url);
await res.json();
// await res.json(); // TypeError: body stream already read
```

Для логирования сырого тела при ошибке — `clone()` или сначала `text()`:

```javascript
if (!res.ok) {
  const body = await res.text();
  throw new Error(`HTTP ${res.status}: ${body}`);
}
```

---

## Переменные окружения

```javascript
// .env.example
// API_BASE_URL=http://127.0.0.1:8090
// BFF_PORT=3096

const apiBase = process.env.API_BASE_URL ?? "http://127.0.0.1:8090";
```

BFF читает upstream URL из env ([28-env-config.md](28-env-config.md)); не хардкодьте prod URL в коде.

---

## Node vs браузер

| | Node BFF | Браузер React |
|---|----------|---------------|
| CORS | нет (server-to-server) | да, нужны заголовки backend |
| `fetch` | глобальный с Node 18+ | всегда |
| Cookies | вручную через headers | автоматически same-origin |

BFF → FastAPI **без CORS** проблем; React → BFF — CORS на Express ([25-express-body-cors.md](25-express-body-cors.md)).

---

## Типичные ошибки

- **Нет проверки `response.ok`** — silent failures на 4xx/5xx.
- **Нет таймаута** — зависший upstream блокирует BFF.
- **Двойной `json()`** — body already read.
- **Забыли `Content-Type` на POST** — FastAPI не парсит body.
- **`fetch` без scheme** — `fetch("/health")` в Node **не** работает как в браузере; нужен полный URL или `new URL(path, base)`.

---

## Резюме

- `fetch` в Node — основной HTTP-клиент; проверяйте **`response.ok`**.
- Заголовки **`Accept`**, **`Content-Type`** — контракт с FastAPI.
- **`AbortSignal.timeout(ms)`** — обязательный паттерн для BFF.
- Обёртка с base URL и разбором ошибок — переиспользуйте во всех лабах.

## Чек-лист

- Почему 404 не попадает в `catch` у `fetch`?
- Как задать таймаут 5 секунд?
- Какие заголовки нужны для POST JSON?
- Как построить URL с query без ручного encoding?
- Что делать, если нужно и проверить ok, и прочитать JSON?
- Зачем `API_BASE_URL` в env?

Следующий урок: [19. Лаба: клиент к локальному серверу](19-lab-http-client.md).
