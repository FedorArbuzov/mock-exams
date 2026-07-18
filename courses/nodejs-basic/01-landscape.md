# 01. Ландшафт: Node.js, BFF и экосистема mock-exams

## Введение: сценарий с работы

Спринт-планирование. Product: «React-витрина shop, каталог и корзина — как в Python-демо». Архитектор рисует схему: браузер → **Node BFF** → **FastAPI** `:8090` → Postgres. Junior спрашивает: «Зачем Node, если API уже есть?» DevOps добавляет: «На :3096 nginx, CORS для фронта, JWT refresh — всё в BFF». В параллельном чате кто-то предлагает **Deno** «потому что без node_modules», а другой — **Bun** «потому что быстрее npm».

Без карты ландшафта вы путаете **движок V8**, **runtime Node.js**, **HTTP-фреймворк** (Express/Fastify) и **роль BFF** в shop-домене mock-exams. На [`javascript-basic`](../javascript-basic/01-landscape.md) вы уже различали ECMAScript и среду выполнения. Здесь — **серверная** картина: один процесс Node обслуживает много HTTP-запросов через event loop, пока FastAPI на Python обрабатывает бизнес-логику и БД.

## Что вы узнаете

- Что такое **Node.js** как runtime (V8 + libuv + встроенные модули).
- Роль **BFF** (Backend for Frontend) между React и FastAPI.
- Домен **shop** в mock-exams и порты стендов.
- Обзор **Express** и **Fastify** — без глубокого API (главы 21–27).
- Где на карте **Deno** и **Bun** — альтернативы, не фокус курса.
- Связь с [`typescript-basic`](../typescript-basic/README.md), [`react-basic`](../react-basic/README.md), [`python-async`](../python-async/README.md).

---

## Node.js как runtime

**Node.js** — не язык и не фреймворк. Это **среда выполнения JavaScript** вне браузера:

```text
Ваш код (.js / .ts после компиляции)
        │
        ▼
   V8 (парсинг, JIT, GC) — тот же движок, что в Chrome
        │
        ▼
   libuv (event loop, thread pool, async I/O)
        │
        ▼
   Встроенные модули: http, fs, crypto, process, …
        │
        ▼
   npm-пакеты: express, pino, …
```

| Компонент | Задача |
|-----------|--------|
| **V8** | Выполняет JavaScript, однопоточный call stack для вашего кода |
| **libuv** | Event loop, таймеры, сетевой I/O, часть файловых операций |
| **Node bindings** | Мост JS ↔ C++ (fs, http, crypto) |
| **npm** | Экосистема библиотек |

JavaScript-синтаксис тот же, что в [`javascript-basic`](../javascript-basic/README.md). Отличия — **глобальные API**: `process`, `node:fs`, `node:http`, нет `document` и CORS «со стороны сервера» (CORS настраивает BFF для браузера — [`api-design`](../api-design/README.md)).

```javascript
// server.js — минимальная иллюстрация (подробно в главах 15–21)
import { createServer } from "node:http";

createServer((req, res) => {
  res.writeHead(200, { "Content-Type": "application/json" });
  res.end(JSON.stringify({ service: "nodejs-basic-bff", ok: true }));
}).listen(3096, () => {
  console.log("BFF listening on :3096");
});
```

---

## BFF: зачем слой между React и FastAPI

**BFF** адаптирует backend под нужды **конкретного клиента** (SPA, мобильное приложение):

| Без BFF | С BFF |
|---------|-------|
| React знает все URL FastAPI, версии, агрегацию | React ходит на один origin (`localhost:3096`) |
| CORS и cookies сложнее на Python API | BFF выставляет CORS для `:5173` |
| Несколько запросов с фронта для одного экрана | BFF агрегирует `/api/v1/items` + `/api/v1/cart` |
| JWT refresh на клиенте | Refresh cookie httpOnly на BFF |

В mock-exams типичная цепочка:

```text
Browser (React :5173)
    │  fetch /api/shop/items
    ▼
Node BFF (:3096 / deploy/nodejs :8096)
    │  proxy + transform + auth stub
    ▼
FastAPI shop API (:8090)
    │  SQLAlchemy, Pydantic
    ▼
Postgres (:5432)
```

Python-трек: [`deploy/fastapi`](../../deploy/fastapi/README.md). Node-курс не заменяет FastAPI — **дополняет** фронтенд-ветку. Сравнение async-моделей — [07-python-async-comparison.md](07-python-async-comparison.md).

---

## Shop-домен и контракты API

Единый учебный домен **shop** (товары, корзина, заказы) связывает курсы:

| Ресурс | Пример FastAPI | Задача BFF |
|--------|----------------|------------|
| Каталог | `GET /api/v1/items` | Прокси, кэш (позже) |
| Товар | `GET /api/v1/items/{id}` | Прокси |
| Health | `GET /health` | Агрегация BFF + upstream |

Упрощённый JSON каталога (как в javascript-basic [01-landscape](../javascript-basic/01-landscape.md)):

```json
{
  "items": [
    { "id": 1, "title": "Keyboard", "price": 79.99 }
  ],
  "total": 1
}
```

BFF может добавить поля для UI (формат цены, локаль) без изменения Python-сервиса — тема [33-proxy-aggregation.md](33-proxy-aggregation.md). REST-конвенции — [`api-design`](../api-design/README.md).

---

## Express и Fastify: обзор фреймворков

Курс **не** начинает с Express в первой неделе — сначала `process`, event loop, `http` с нуля. Но карта местности нужна заранее:

| | **Express** | **Fastify** |
|---|-------------|-------------|
| Стиль | минималистичный, middleware-цепочка | схемы, hooks, быстрее out of the box |
| Экосистема | огромная, много туториалов | растёт, плагины |
| В mock-exams | основной для лаб 21–26 | обзор в [27-fastify-overview.md](27-fastify-overview.md) |
| Похоже на Python | Flask-подобный | ближе к FastAPI (валидация, schema) |

Express-пример (preview):

```javascript
import express from "express";

const app = express();
app.get("/health", (_req, res) => {
  res.json({ status: "ok", layer: "bff" });
});
// app.listen(3096);
```

Fastify-пример (preview):

```javascript
import Fastify from "fastify";

const app = Fastify();
app.get("/health", async () => ({ status: "ok", layer: "bff" }));
// await app.listen({ port: 3096 });
```

Выбор для production — в [`nodejs-intermediate`](../javascript-path.md); здесь достаточно понимать: **оба** сидят на том же Node HTTP server и event loop.

---

## Deno и Bun: альтернативы на карте

| Runtime | Идея | На курсе |
|---------|------|----------|
| **Deno** | TypeScript из коробки, security permissions, без node_modules по умолчанию | упоминание |
| **Bun** | JS runtime + bundler + npm-совместимость, акцент на скорость | упоминание |
| **Node.js** | де-факто стандарт, deploy mock-exams, максимум материалов | **фокус** |

Код shop BFF в репозитории и CI ориентирован на **Node LTS**. Навыки переносятся: event loop, HTTP, async I/O — концептуально общие; API модулей (`node:fs` vs `Deno.readFile`) различаются.

---

## Место курса в javascript-path

```text
javascript-basic  →  typescript-basic (желательно)
       │
       ▼
nodejs-basic  ←── вы здесь (фаза 1: окружение, process, event loop)
       │
       ├── nodejs-intermediate (Prisma, JWT, слои)
       ├── react-basic (UI к BFF)
       └── python-async (параллельное сравнение asyncio)
```

**Предварительно:** Promises, `async/await`, ES modules, обзор event loop из javascript-basic 24–30. **Параллельно полезно:** [`api-design`](../api-design/README.md) глава про REST и статусы.

---

## Однопоточность и масштабирование (обзор)

Node обрабатывает много **одновременных** соединений, но **ваш JS** в одном потоке на процесс. I/O не блокирует loop; CPU-bound цикл блокирует всех клиентов процесса. Масштабирование в production:

- несколько **worker-процессов** (cluster, PM2, Kubernetes replicas);
- **worker_threads** для тяжёлых вычислений;
- очереди (BullMQ в [`nodejs-advanced`](../javascript-path.md)) — аналог Celery.

Детали — [04-event-loop-libuv.md](04-event-loop-libuv.md), [06-lab-event-loop.md](06-lab-event-loop.md).

---

## Типичные ошибки

**«Node = Express».** Express — библиотека; Node можно без неё (`node:http`). Путаница мешает понимать middleware и lifecycle.

**«BFF дублирует всю бизнес-логику».** BFF **не** заменяет FastAPI; он адаптирует протокол, auth, агрегацию. Дублирование правил ценообразования в двух языках — антипаттерн.

**«Напишем BFF на Deno в учебном репо».** Потеряете совместимость с примерами и CI mock-exams. Эксперименты — в pet-проектах.

**Игнорировать `:8090`.** BFF без upstream — пустой прокси. Поднимайте FastAPI стенд до глав 20 и 34.

**Путать порты.** `:8090` — FastAPI; `:3096` (или `:8096` deploy) — Node BFF; `:5173` — Vite React. Запишите в README команды.

---

## Резюме

Node.js — **runtime** (V8 + libuv) для серверного JS, npm и HTTP. В mock-exams Node играет роль **BFF** перед FastAPI shop API на **8090**, готовя данные для **React**. Express — основной фреймворк курса; Fastify — быстрая альтернатива с обзором позже. Deno/Bun — на карте, не в фокусе. Дальше — `process`, CLI-лабы и глубокий event loop.

## Чек-лист

- [ ] Объясните разницу **V8**, **Node.js** и **Express** одним предложением каждый
- [ ] Нарисуйте цепочку Browser → BFF → FastAPI → Postgres
- [ ] Знаете порт FastAPI (**8090**) и будущий порт BFF (**3096**)
- [ ] Понимаете, зачем BFF, а не прямой `fetch` с React на `:8090`
- [ ] Назвали два HTTP-фреймворка курса и одну альтернативу runtime
- [ ] Связали nodejs-basic с javascript-basic и python-async

Следующий урок: [02. Объект process](02-process.md).
