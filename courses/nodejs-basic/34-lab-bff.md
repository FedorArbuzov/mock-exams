# 34. Лаба: BFF к `:8090`

## Сценарий с работы

Фронтенд готов; stub in-memory больше не устраивает. Нужен **реальный BFF proxy** на FastAPI shop `:8090`: list/create/get items, CORS для React, pino logs, env config. FastAPI поднимают из [`deploy/fastapi`](../../deploy/fastapi/README.md). Демо end-to-end: React или curl → BFF `:3096` → FastAPI `:8090`.

**Время:** ~70–90 минут. Пререквизиты: уроки 28–33, лабы 26, 29, 31.

---

## Цели

- Заменить stub `itemsService` на `upstreamClient`
- Проксировать `GET/POST /api/v1/items` и `GET /api/v1/items/:id`
- Поднять FastAPI `:8090` и проверить сквозной flow
- Health BFF + optional upstream check
- Обработка upstream down (502/504)

---

## Шаг 0. Поднять FastAPI

В отдельном терминале (из корня репозитория или deploy):

```bash
# следуйте deploy/fastapi README
cd deploy/fastapi
docker compose up -d
# или локальный uvicorn — порт 8090
curl -s http://localhost:8090/health
curl -s http://localhost:8090/api/v1/items | jq
```

Без работающего `:8090` лаба проверяет только error paths.

---

## Шаг 1. .env

```env
PORT=3096
FASTAPI_URL=http://localhost:8090
NODE_ENV=development
LOG_LEVEL=info
```

---

## Шаг 2. upstreamClient.js

Создайте `src/services/upstreamClient.js` по образцу [33-proxy-aggregation.md](33-proxy-aggregation.md):

```javascript
import { config } from "../config/index.js";
import { AppError } from "../errors/AppError.js";

export async function upstreamFetch(path, options = {}, req = null) {
  const url = new URL(path, config.fastapiUrl).toString();
  const timeoutMs = options.timeoutMs ?? 10_000;
  const signal = AbortSignal.timeout(timeoutMs);

  const headers = {
    Accept: "application/json",
    ...options.headers,
  };
  if (req?.id) headers["X-Request-Id"] = req.id;

  const start = Date.now();
  req?.log?.info({ url, method: options.method ?? "GET" }, "upstream start");

  try {
    const res = await fetch(url, { ...options, headers, signal });
    req?.log?.info(
      { status: res.status, durationMs: Date.now() - start },
      "upstream done"
    );
    return res;
  } catch (err) {
    req?.log?.error({ err, url }, "upstream failed");
    if (err.name === "TimeoutError" || err.name === "AbortError") {
      throw new AppError("Upstream timeout", 504, "GATEWAY_TIMEOUT");
    }
    throw new AppError("Upstream unavailable", 502, "BAD_GATEWAY");
  }
}

export async function readUpstreamJson(res) {
  const text = await res.text();
  let body = null;
  if (text) {
    try {
      body = JSON.parse(text);
    } catch {
      throw new AppError("Invalid JSON from upstream", 502, "BAD_GATEWAY");
    }
  }
  if (!res.ok) {
    const message =
      body?.detail ??
      (typeof body?.error === "string" ? body.error : null) ??
      res.statusText;
    throw new AppError(message, res.status, "UPSTREAM_ERROR");
  }
  return body;
}
```

---

## Шаг 3. items routes — proxy only

```javascript
// src/routes/items.js
import { Router } from "express";
import { asyncHandler } from "../middleware/asyncHandler.js";
import { upstreamFetch, readUpstreamJson } from "../services/upstreamClient.js";

const router = Router();

router.get(
  "/",
  asyncHandler(async (req, res) => {
    const upstream = await upstreamFetch("/api/v1/items", {}, req);
    const data = await readUpstreamJson(upstream);
    res.json(data);
  })
);

router.get(
  "/:id",
  asyncHandler(async (req, res) => {
    const upstream = await upstreamFetch(
      `/api/v1/items/${encodeURIComponent(req.params.id)}`,
      {},
      req
    );
    const data = await readUpstreamJson(upstream);
    res.json(data);
  })
);

router.post(
  "/",
  asyncHandler(async (req, res) => {
    const upstream = await upstreamFetch(
      "/api/v1/items",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(req.body),
      },
      req
    );
    const data = await readUpstreamJson(upstream);
    res.status(upstream.status).json(data);
  })
);

export default router;
```

Удалите in-memory store из [26-lab-express-shop.md](26-lab-express-shop.md).

---

## Шаг 4. app.js — полная сборка

Убедитесь в цепочке:

```javascript
app.use(httpLogger);
app.use(cors({ origin: ["http://localhost:5173"], credentials: true }));
app.use(express.json({ limit: "1mb" }));
app.use("/health", healthRouter);
app.use("/api/v1/items", itemsRouter);
app.use(notFoundHandler);
app.use(errorHandler);
```

---

## Шаг 5. Extended health (опционально)

```javascript
// GET /health/upstream
router.get("/upstream", asyncHandler(async (req, res) => {
  const r = await upstreamFetch("/health", { timeoutMs: 3000 }, req);
  res.status(r.ok ? 200 : 503).json({
    bff: "ok",
    fastapi: r.ok ? "ok" : "degraded",
  });
}));
```

---

## Шаг 6. Запуск BFF

```bash
cd courses/nodejs-basic/examples
npm run dev
```

---

## Шаг 7. Сквозные тесты curl

```bash
# BFF health
curl -s http://localhost:3096/health | jq

# List через proxy
curl -s http://localhost:3096/api/v1/items | jq

# Сравнение с direct FastAPI — данные должны совпадать
curl -s http://localhost:8090/api/v1/items | jq

# Create через BFF
curl -s -X POST http://localhost:3096/api/v1/items \
  -H "Content-Type: application/json" \
  -d '{"name":"BFF Test Item","price":42.5,"sku":"BFF-001"}' | jq

# Get by id (подставьте id из ответа create)
curl -s http://localhost:3096/api/v1/items/1 | jq

# 404 upstream
curl -s http://localhost:3096/api/v1/items/nonexistent-id-999 | jq
```

Проверьте заголовок `X-Request-Id` и JSON `requestId` в ошибках.

---

## Шаг 8. Upstream down

Остановите FastAPI или укажите неверный порт:

```env
FASTAPI_URL=http://localhost:9999
```

```bash
curl -s http://localhost:3096/api/v1/items | jq
# ожидание: 502 BAD_GATEWAY или connection error mapped
```

Верните корректный URL после теста.

---

## Шаг 9. Browser / React

```javascript
fetch("http://localhost:3096/api/v1/items")
  .then((r) => r.json())
  .then(console.log);
```

CORS должен пройти; данные — из FastAPI через BFF.

---

## Критерии успеха

- [ ] `GET /api/v1/items` через BFF ≡ direct FastAPI (структурно)
- [ ] `POST` создаёт item visible в обоих paths
- [ ] Upstream 404 → BFF 404 JSON с message
- [ ] FastAPI down → 502/504, не hang
- [ ] Логи pino: upstream start/done с durationMs
- [ ] Нет in-memory stub; нет hardcoded `:8090` в routes

---

## Если что-то пошло не так

| Симптом | Решение |
|---------|---------|
| ECONNREFUSED | FastAPI не запущен; проверьте 8090 |
| 502 Invalid JSON | upstream вернул HTML; curl FastAPI direct |
| CORS | cors middleware; origin 5173 |
| 404 на BFF, OK на FastAPI | path mismatch; encodeURIComponent id |
| Empty items | другая БД FastAPI; create item |
| Hang >10s | timeout должен дать 504 |

---

## Диаграмма успешного запроса

```text
curl → BFF GET /api/v1/items
         → pino req.id=abc
         → fetch http://localhost:8090/api/v1/items
         → FastAPI 200 JSON
         → BFF res.json + log durationMs
```

---

## Связь с capstone

[39-capstone.md](39-capstone.md) расширит BFF: dashboard aggregation, security headers, Docker. Эта лаба — **минимальный рабочий proxy**.

---

## Типичные ошибки

1. Забыли `encodeURIComponent` для id с special chars.

2. POST без `JSON.stringify(req.body)`.

3. Тестируют только BFF, не сравнивают с FastAPI direct.

4. Оставили stub store — данные расходятся.

5. `FASTAPI_URL` с trailing slash + path `/api/...` — double slash (часто OK, но лучше origin only).

---

## Резюме

Лаба заменяет stub на production-shaped BFF proxy к FastAPI `:8090`: upstreamClient с timeout и error mapping, items routes transparent proxy, pino correlation, env config. Проверка: curl parity BFF/FastAPI, upstream down, CORS из browser.

---

## Чек-лист

- Какие два порта участвуют в сквозном запросе?
- Где единственное место с base URL FastAPI?
- Как проверить, что POST дошёл до Python?
- Какой status при 10s timeout?
- Как передать request id в FastAPI?
- Что удалить из lab 26 (stub)?
- Как убедиться, что ошибки FastAPI не превращаются в 500?

Следующий урок: [35. Структура Node-проекта](35-project-structure.md).
