# 20. Клиент к FastAPI `:8090`

## Сценарий с работы

Команда поднимает shop stack: FastAPI на **8090**, ваш BFF на **3096** должен проксировать каталог. Вы пишете `fetch("localhost:8090/health")` — `TypeError: Invalid URL`. После fix видите `Connection refused` — забыли `docker compose up` в [`deploy/fastapi`](../../deploy/fastapi/README.md). QA получает пустой список — парсят `{ data: items }`, а API отдаёт массив или обёртку иначе. Этот урок — **первое живое подключение** Node BFF к Python backend mock-exams.

## Что вы узнаете

- Запуск стенда FastAPI `:8090`
- Endpoints `/health` и `/api/v1/items`
- Клиент на `fetch` с env `API_BASE_URL`
- Сравнение контракта FastAPI и локального JSON BFF
- Smoke-проверки curl и Node
- Подготовка к BFF-прокси (главы 32–34)

---

## Стенд deploy/fastapi

Из корня репозитория:

```bash
cd deploy/fastapi
docker compose up -d --build
docker compose ps
```

| URL | Назначение |
|-----|------------|
| http://localhost:8090/health | liveness |
| http://localhost:8090/api/v1/items | список товаров |
| http://localhost:8090/docs | Swagger UI |
| http://localhost:8090/metrics | Prometheus |

Smoke:

```bash
bash scripts/smoke.sh
# Windows: .\scripts\smoke.ps1
```

Ожидаемо: health содержит `ok`, items — demo-товары.

---

## Проверка curl

```bash
curl -s http://localhost:8090/health
curl -s http://localhost:8090/api/v1/items | head -c 300
curl -i http://localhost:8090/api/v1/items/99999
```

Последний запрос — **404** с JSON `detail` (формат FastAPI).

---

## Переменные окружения

`courses/nodejs-basic/examples/.env.example`:

```env
API_BASE_URL=http://127.0.0.1:8090
BFF_BASE_URL=http://127.0.0.1:3096
REQUEST_TIMEOUT_MS=10000
```

Загрузка dotenv — в лабах 28+; пока:

```javascript
const API_BASE = process.env.API_BASE_URL ?? "http://127.0.0.1:8090";
```

**Важно:** в Node `fetch` нужен полный URL с **`http://`**.

---

## Модуль `fastapi-client.js`

```javascript
// lab/fastapi-client.js
const API_BASE = process.env.API_BASE_URL ?? "http://127.0.0.1:8090";
const TIMEOUT_MS = Number(process.env.REQUEST_TIMEOUT_MS ?? "10000");

export async function fastapiFetch(path, options = {}) {
  const url = new URL(path, API_BASE);

  const res = await fetch(url, {
    ...options,
    signal: AbortSignal.timeout(TIMEOUT_MS),
    headers: {
      Accept: "application/json",
      ...options.headers,
    },
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`FastAPI ${res.status} ${url.pathname}: ${body}`);
  }

  const ct = res.headers.get("content-type") ?? "";
  if (ct.includes("application/json")) {
    return res.json();
  }
  return res.text();
}

export async function checkHealth() {
  return fastapiFetch("/health");
}

export async function listItems(query = {}) {
  const url = new URL("/api/v1/items", API_BASE);
  for (const [key, value] of Object.entries(query)) {
    url.searchParams.set(key, String(value));
  }
  const res = await fetch(url, {
    signal: AbortSignal.timeout(TIMEOUT_MS),
    headers: { Accept: "application/json" },
  });
  if (!res.ok) {
    throw new Error(`FastAPI ${res.status}: ${await res.text()}`);
  }
  return res.json();
}
```

---

## CLI `20-fastapi-cli.js`

```javascript
// lab/20-fastapi-cli.js
import { checkHealth, listItems } from "./fastapi-client.js";

async function main() {
  console.log("FastAPI base:", process.env.API_BASE_URL ?? "http://127.0.0.1:8090");

  console.log("\n--- /health ---");
  const health = await checkHealth();
  console.log(health);

  console.log("\n--- /api/v1/items ---");
  const items = await listItems();
  console.log("type:", Array.isArray(items) ? "array" : typeof items);
  const rows = Array.isArray(items) ? items : items.items ?? items.data ?? [];
  console.log("count:", rows.length);
  if (rows[0]) {
    console.log("first:", rows[0].name ?? rows[0].title, rows[0].price);
  }
}

main().catch((err) => {
  console.error("FastAPI unreachable:", err.message);
  console.error("Hint: cd deploy/fastapi && docker compose up -d");
  process.exitCode = 1;
});
```

Запуск:

```bash
cd courses/nodejs-basic/examples
node lab/20-fastapi-cli.js
```

Адаптируйте разбор `rows` под **фактический** JSON стенда (откройте `/docs` или curl).

---

## Контракт ответов FastAPI

Типичные форматы mock-exams:

**Health:**

```json
{ "status": "ok" }
```

**Items list** — массив или объект с полем; проверьте live response:

```bash
curl -s http://localhost:8090/api/v1/items | jq 'type, length'
```

**404:**

```json
{ "detail": "Not found" }
```

BFF должен **пробрасывать** status и body или нормализовать в единый формат для React ([32-bff-pattern.md](32-bff-pattern.md)).

---

## Сравнение :3096 локальный BFF vs :8090 FastAPI

| | Лаба 16 (`:3096`) | FastAPI (`:8090`) |
|---|-------------------|-------------------|
| Данные | `catalog.json` | PostgreSQL + Redis |
| Валидация | ручная | Pydantic |
| OpenAPI | нет | `/docs` |
| Auth | нет | позже в intermediate |

Путь миграции: заменить `readFile(catalog)` на `fastapiFetch("/api/v1/items")` в handler.

---

## Таймаут и retry (обзор)

Для лабы — только `AbortSignal.timeout`. Retry с backoff — [33-proxy-aggregation.md](33-proxy-aggregation.md). Не retry без idempotency на POST.

---

## Docker troubleshooting

| Симптом | Действие |
|---------|----------|
| `Connection refused` | `docker compose ps`, api healthy? |
| Port 8090 busy | другой процесс / compose |
| Пустой items | `docker compose logs api` |
| Windows bcrypt | auth-лабы — в контейнере |

Подробнее — [deploy/fastapi/README.md](../../deploy/fastapi/README.md).

---

## Интеграционный smoke Node + FastAPI

```bash
# 1. FastAPI up
cd deploy/fastapi && docker compose up -d

# 2. Node client
cd courses/nodejs-basic/examples
node lab/20-fastapi-cli.js

# 3. Optional: local BFF + compare counts
node lab/16-server.js   # terminal A
node lab/19-client.js   # terminal B
```

---

## Связь с Python-треком

| Ресурс | Связь |
|--------|-------|
| [courses/fastapi](../fastapi/README.md) | авторы API |
| [api-design](../api-design/README.md) | REST, статусы |
| [python-async](../python-async/README.md) | asyncio vs Node loop |

---

## Типичные ошибки

- **URL без `http://`** — Invalid URL в Node fetch.
- **FastAPI не запущен** — ECONNREFUSED; не путать с HTTP 503.
- **Игнор `!res.ok`** — парсите HTML/error JSON как catalog.
- **Неверная форма items** — всегда смотрите live `/docs` Schemas.
- **Хардкод prod URL** — только env `API_BASE_URL`.

---

## Резюме

- Поднимите **`deploy/fastapi`** на **`:8090`** перед лабой.
- Клиент: **`fetch` + полный base URL + timeout + `response.ok`**.
- Основные endpoints: **`/health`**, **`/api/v1/items`**.
- BFF `:3096` дальше **агрегирует/проксирует** FastAPI для React.

## Чек-лист

- Как запустить FastAPI стенд mock-exams?
- Какие URL для health и items?
- Почему `fetch("localhost:8090/...")` неверен в Node?
- Как задать `API_BASE_URL`?
- Чем ответ 404 FastAPI отличается от вашего BFF JSON?
- Что проверить, если `ECONNREFUSED`?

Следующий урок: [21. Express: маршруты и Router](21-express-routing.md).
