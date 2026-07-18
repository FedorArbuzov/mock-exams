# 19. Лаба: HTTP-клиент к локальному серверу

Цель — **написать CLI-клиент** на `fetch`, который обращается к вашему серверу из [16-lab-http-server.md](16-lab-http-server.md) на `:3096`: health, список items, один item, обработка 404 и таймаут.

**Время:** ~25–35 минут после [18-http-client.md](18-http-client.md).

## Стенд

Два терминала:

**Терминал 1 — сервер:**

```bash
cd courses/nodejs-basic/examples
node lab/16-server.js
```

**Терминал 2 — клиент:**

```bash
node lab/19-client.js
```

Эталон: `solutions/lab/19-client.js`.

---

## Задание 1. Конфиг base URL

```javascript
// lab/19-client.js
const BFF_BASE = process.env.BFF_BASE_URL ?? "http://127.0.0.1:3096";
const TIMEOUT_MS = 5_000;
```

---

## Задание 2. Функция `bffFetch`

```javascript
async function bffFetch(path, options = {}) {
  const url = new URL(path, BFF_BASE);
  const res = await fetch(url, {
    ...options,
    signal: AbortSignal.timeout(TIMEOUT_MS),
    headers: {
      Accept: "application/json",
      ...options.headers,
    },
  });

  const contentType = res.headers.get("content-type") ?? "";

  if (!res.ok) {
    let detail = await res.text();
    try {
      if (contentType.includes("json")) detail = JSON.stringify(JSON.parse(detail));
    } catch {
      /* keep text */
    }
    throw new Error(`BFF ${res.status} ${path}: ${detail}`);
  }

  if (contentType.includes("application/json")) {
    return res.json();
  }
  return res.text();
}
```

---

## Задание 3. Вызовы API

```javascript
async function main() {
  console.log("=== GET /health ===");
  const health = await bffFetch("/health");
  console.log(health);

  console.log("\n=== GET /api/v1/items ===");
  const list = await bffFetch("/api/v1/items");
  console.log("count:", list.items?.length ?? list.items);

  console.log("\n=== GET /api/v1/items/kb-001 ===");
  const item = await bffFetch("/api/v1/items/kb-001");
  console.log(item.name, item.price);

  console.log("\n=== GET missing item (expect error) ===");
  try {
    await bffFetch("/api/v1/items/does-not-exist");
  } catch (err) {
    console.log("Caught:", err.message);
  }
}

main().catch((err) => {
  console.error("Fatal:", err.message);
  process.exitCode = 1;
});
```

---

## Задание 4. Query string — фильтр category

Если сервер из лабы 16 поддерживает `?category=` (добавьте handler или используйте [17-url-routing.md](17-url-routing.md)):

```javascript
const url = new URL("/api/v1/items", BFF_BASE);
url.searchParams.set("category", "peripherals");
const res = await fetch(url, { signal: AbortSignal.timeout(TIMEOUT_MS) });
// ... проверка ok и json
```

Или через helper:

```javascript
async function bffFetchWithQuery(path, query) {
  const url = new URL(path, BFF_BASE);
  for (const [k, v] of Object.entries(query)) {
    url.searchParams.set(k, String(v));
  }
  const res = await fetch(url, { signal: AbortSignal.timeout(TIMEOUT_MS) });
  // ... same ok/json logic
}
```

---

## Задание 5. Тест таймаута

Временно укажите неверный порт или поднимите «медленный» сервер:

```javascript
// опционально: lab/19-slow-server.js — sleep 10s перед ответом
```

```javascript
try {
  await fetch("http://127.0.0.1:3099/health", {
    signal: AbortSignal.timeout(500),
  });
} catch (err) {
  console.log("Timeout as expected:", err.name);
}
```

---

## Задание 6. Проверка без запущенного сервера

Остановите `16-server.js`, запустите клиент:

```bash
node lab/19-client.js
```

**Ожидаемо:** понятная ошибка (`ECONNREFUSED` / fetch failed), `process.exitCode = 1`.

---

## Задание 7. Smoke-скрипт (опционально)

```javascript
// lab/19-smoke.js
import { spawn } from "node:child_process";

// 1. spawn server
// 2. await sleep 500ms
// 3. run client checks
// 4. kill server
```

Для CI позже; в лабе достаточно ручного двух терминалов.

---

## Ожидаемый вывод (фрагмент)

```text
=== GET /health ===
{ status: 'ok', service: 'lab-16-bff', items: 2 }

=== GET /api/v1/items ===
count: 2

=== GET /api/v1/items/kb-001 ===
Mechanical Keyboard 79.9

=== GET missing item (expect error) ===
Caught: BFF 404 /api/v1/items/does-not-exist: {"error":"Item not found",...}
```

---

## Критерии успеха

- [ ] Клиент читает `/health` и `/api/v1/items` при работающем сервере
- [ ] 404 на missing id — **catch**, процесс не падает без handler
- [ ] Используется `AbortSignal.timeout`
- [ ] Проверка `response.ok` внутри `bffFetch`
- [ ] Base URL из `BFF_BASE_URL` env
- [ ] Без сервера — осмысленная ошибка и ненулевой exit code

---

## Если что-то пошло не так

| Симптом | Проверка |
|---------|----------|
| `fetch failed` | сервер на 3096; `127.0.0.1` vs `localhost` |
| JSON parse error | Content-Type; тело не HTML ошибки nginx |
| Timeout на health | сервер завис; порт занят другим процессом |
| 404 на /items | query ломает match в сервере — см. урок 17 |
| `body already read` | один read на response в helper |

---

## Рефлексия

Почему BFF-клиент (Node → Node `:3096`) и браузерный клиент (React → `:3096`) могут использовать **одинаковые** path, но разные base URL?

---

Следующий урок: [20. Клиент к FastAPI `:8090`](20-fastapi-client.md).
