# 08. Асинхронный I/O: колбэки, Promises, async handlers

## Сценарий с работы

Legacy скрипт синхронизации каталога shop написан на **колбэках** `fs.readFile` — «callback hell» на три уровня вложенности. В rewrite PR всё перевели на **`async/await`**, но Express route `async (req, res) => { ... }` без try/catch роняет процесс с **unhandledRejection** при 502 от FastAPI `:8090`. Code review: «Используйте `fs.promises` или `node:fs/promises`, не promisify вручную». Джун оборачивает каждый колбэк в `new Promise` — работает, но шумно.

Эта глава закрывает **фазу 2** nodejs-basic: от event loop ([04–06](04-event-loop-libuv.md)) к **реальному I/O** — файлы, HTTP upstream, обработчики сервера. Опирается на Promises из [`javascript-basic/26-promises`](../javascript-basic/26-promises.md) и `async/await` из [27-async-await](../javascript-basic/27-async-await.md).

## Что вы узнаете

- **`fs.promises`** и async чтение/запись без блокировки loop.
- Паттерн **callback → Promise** (`util.promisify`, обёртка).
- **`async` handlers** в HTTP-сервере и Express — ошибки и `next(err)`.
- Композиция: `Promise.all`, последовательный await.
- Антипаттерns: sync fs, забытый catch, floating promises.
- Связь с BFF прокси к [`deploy/fastapi`](../../deploy/fastapi/README.md).

---

## Три эры Node I/O

```text
1. Callbacks (error-first)     err => fs.readFile(path, cb)
2. Promises                      fs.promises.readFile(path)
3. async/await                   await fs.promises.readFile(path)
```

| Стиль | Плюсы | Минусы |
|-------|-------|--------|
| Callback | без зависимостей, streams native | вложенность, error handling |
| Promise | chain, all/settle | boilerplate без async |
| async/await | читаемость как sync | try/catch, забытый await |

Современный код mock-exams: **async/await** + **fs.promises** + **fetch** для HTTP.

---

## fs.promises: не блокировать loop

```javascript
import { readFile, writeFile, mkdir } from "node:fs/promises";
import { join } from "node:path";

async function loadConfig(configDir) {
  const path = join(configDir, "shop-bff.json");
  const raw = await readFile(path, "utf8");
  return JSON.parse(raw);
}

async function saveSnapshot(dir, data) {
  await mkdir(dir, { recursive: true });
  const path = join(dir, `catalog-${Date.now()}.json`);
  await writeFile(path, JSON.stringify(data, null, 2), "utf8");
  return path;
}
```

Пока `await readFile` ждёт диск, libuv в фазе **poll** — другие запросы BFF могут обрабатываться ([04-event-loop-libuv.md](04-event-loop-libuv.md)).

**Избегайте** на request path:

```javascript
import { readFileSync } from "node:fs"; // блокирует loop
```

Лабы по fs — [10-fs-path.md](10-fs-path.md), [11-lab-fs.md](11-lab-fs.md).

---

## Callback → Promise

Старый API error-first:

```javascript
import { readFile as readFileCb } from "node:fs";

readFileCb("./data.json", "utf8", (err, content) => {
  if (err) {
    console.error(err);
    return;
  }
  console.log(JSON.parse(content));
});
```

### util.promisify (Node built-in)

```javascript
import { readFile } from "node:fs";
import { promisify } from "node:util";

const readFileAsync = promisify(readFile);

const content = await readFileAsync("./data.json", "utf8");
```

Работает для функций с signature `(err, result) =>`. Для **native promises API** promisify не нужен — используйте `fs.promises`.

### Ручная обёртка (понимание механики)

```javascript
function readFilePromise(path, encoding) {
  return new Promise((resolve, reject) => {
    readFileCb(path, encoding, (err, data) => {
      if (err) reject(err);
      else resolve(data);
    });
  });
}
```

Так устроен `promisify` внутри. В новом коде предпочитайте **`fs.promises`**.

---

## fetch к FastAPI :8090

Node 18+ — global **`fetch`** (как в [javascript-basic/29-fetch](../javascript-basic/29-fetch.md)):

```javascript
const base = process.env.SHOP_API_URL ?? "http://localhost:8090";

async function getItems() {
  const res = await fetch(`${base}/api/v1/items`, {
    headers: { Accept: "application/json" },
    signal: AbortSignal.timeout(5000),
  });

  if (!res.ok) {
    throw new Error(`Upstream ${res.status}: ${res.statusText}`);
  }

  return res.json();
}
```

| Статус | Действие BFF |
|--------|--------------|
| 200 | проксировать/трансформировать JSON |
| 404 | 404 клиенту или fallback |
| 502/timeout | 503 + log; см. [`api-design`](../api-design/README.md) |

Контракты REST — тот же shop, что в Python [`deploy/fastapi`](../../deploy/fastapi/README.md).

---

## Композиция async операций

**Параллельно** — независимые запросы:

```javascript
async function getDashboardData() {
  const [items, health] = await Promise.all([
    fetch(`${base}/api/v1/items`).then((r) => r.json()),
    fetch(`${base}/health`).then((r) => r.json()),
  ]);
  return { items, health };
}
```

**Последовательно** — когда нужен результат предыдущего шага:

```javascript
async function getItemDetail(id) {
  const res = await fetch(`${base}/api/v1/items/${id}`);
  if (!res.ok) throw new Error(`Item ${id} not found`);
  return res.json();
}
```

**Promise.allSettled** — когда частичный успех OK (отчёты, batch sync).

---

## Async handlers в HTTP-сервере

### Сырой `node:http` (preview [15-http-module.md](15-http-module.md))

```javascript
import { createServer } from "node:http";

createServer(async (req, res) => {
  try {
    if (req.url === "/health") {
      res.writeHead(200, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ ok: true }));
      return;
    }
    const data = await getItems();
    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(JSON.stringify(data));
  } catch (err) {
    console.error(err);
    res.writeHead(500, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ error: "internal_error" }));
  }
}).listen(3096);
```

**Без try/catch** rejection из `async` listener может стать **unhandledRejection** ([02-process.md](02-process.md)).

### Express (preview [21–24](21-express-routing.md))

```javascript
import express from "express";

const app = express();

app.get("/api/shop/items", async (req, res, next) => {
  try {
    const data = await getItems();
    res.json(data);
  } catch (err) {
    next(err);
  }
});

app.use((err, req, res, next) => {
  console.error(err);
  res.status(502).json({ error: "upstream_failed" });
});
```

### Паттерн «async wrapper»

```javascript
function asyncHandler(fn) {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}

app.get("/api/shop/items", asyncHandler(async (req, res) => {
  const data = await getItems();
  res.json(data);
}));
```

---

## Callback hell → async refactor

**До:**

```javascript
readFile("./a.json", "utf8", (err, a) => {
  if (err) return console.error(err);
  readFile("./b.json", "utf8", (err2, b) => {
    if (err2) return console.error(err2);
    const merged = { ...JSON.parse(a), ...JSON.parse(b) };
    console.log(merged);
  });
});
```

**После:**

```javascript
import { readFile } from "node:fs/promises";

try {
  const [a, b] = await Promise.all([
    readFile("./a.json", "utf8"),
    readFile("./b.json", "utf8"),
  ]);
  const merged = { ...JSON.parse(a), ...JSON.parse(b) };
  console.log(merged);
} catch (err) {
  console.error(err);
  process.exit(1);
}
```

Читаемость ближе к Python `aiofiles` — см. [07-python-async-comparison.md](07-python-async-comparison.md).

---

## Floating promises и fire-and-forget

```javascript
// Плохо в request handler — ошибка потеряна
logAccess(req.url); // async function без await

// Лучше
await logAccess(req.url);
// или явно void с .catch
void logAccess(req.url).catch((err) => console.error(err));
```

---

## Связь с экосистемой

| Материал | Связь |
|----------|-------|
| [10-fs-path.md](10-fs-path.md) | path, sync vs async |
| [18-http-client.md](18-http-client.md) | заголовки, retry |
| [20-fastapi-client.md](20-fastapi-client.md) | полный клиент shop |
| [typescript-basic](../typescript-basic/README.md) | типы для JSON от API |
| [react-basic](../react-basic/README.md) | клиент к BFF |

---

## Типичные ошибки

**`async function` без `await` в handler** — лишний wrapper; ошибки sync части не в Promise.

**Забытый `await fetch`** — `res.json` на Promise, не на data.

**`JSON.parse` на huge string** — блок CPU после async read; streams/workers.

**Глотать ошибки upstream** — всегда log + правильный status клиенту.

**promisify то, что уже promise** — `fs.promises.readFile` проще.

**Parallel `Promise.all` с зависимостями** — второй запрос нуждается в id из первого → sequential await.

---

## Резюме

Асинхронный I/O в Node — **`fs.promises`**, **`fetch`**, **`async/await`** поверх Promises и libuv. Callbacks legacy — переводите через **promisify** или native promise API. HTTP handlers **обязаны** обрабатывать rejections (try/catch, `next(err)`, wrapper). Композиция **`Promise.all`** для параллельных вызовов к `:8090`. Sync fs и CPU parse на hot path блокируют BFF для всех клиентов. Дальше — модули CJS/ESM и углублённый `fs` (фаза 3).

## Чек-лист

- [ ] Прочитали файл через `fs.promises.readFile` с await
- [ ] Объяснили error-first callback и `promisify`
- [ ] Написали async handler с try/catch и статусом 502
- [ ] Знаете, когда `Promise.all` vs последовательный await
- [ ] Понимаете unhandledRejection в async Express route
- [ ] Связали fetch BFF с FastAPI shop API

Следующий урок: [09. CJS vs ESM в Node](09-modules-cjs-esm.md).
