# 33. Прокси, агрегация, таймауты

## Сценарий с работы

BFF в staging периодически отдаёт 504 Gateway Timeout: FastAPI перегружен, но часть запросов — просто «забыли timeout на fetch». Другой баг: при upstream 422 BFF возвращает 500 с `"Unexpected token"` — тело ошибки парсили как JSON, а пришёл HTML nginx. TL просит: явные таймауты, маппинг статусов, `AbortSignal`, лог duration, graceful 502/504.

Этот урок — техническая реализация BFF ([32-bff-pattern.md](32-bff-pattern.md)) через `fetch`.

## Что вы узнаете

- Proxy handler: method, headers, body forward
- Error mapping upstream → client
- `AbortSignal.timeout` / AbortController
- JSON vs empty body на ошибках
- Parallel aggregation с `Promise.all`
- Retry — когда не делать в BFF

---

## Базовый proxy GET

```javascript
// src/services/upstreamClient.js
import { config } from "../config/index.js";
import { AppError, BadGatewayError } from "../errors/AppError.js";

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

  let res;
  try {
    res = await fetch(url, { ...options, headers, signal });
  } catch (err) {
    req?.log?.error({ err, url, durationMs: Date.now() - start }, "upstream network");
    if (err.name === "TimeoutError" || err.name === "AbortError") {
      throw new AppError("Upstream timeout", 504, "GATEWAY_TIMEOUT");
    }
    throw new BadGatewayError(config.fastapiUrl);
  }

  req?.log?.info(
    { status: res.status, durationMs: Date.now() - start },
    "upstream done"
  );

  return res;
}
```

---

## Чтение тела с error mapping

```javascript
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

FastAPI validation 422:

```json
{ "detail": [{ "loc": ["body", "price"], "msg": "..." }] }
```

BFF может упростить для UI:

```javascript
if (res.status === 422 && Array.isArray(body?.detail)) {
  throw new AppError("Validation failed", 422, "VALIDATION_ERROR");
}
```

---

## Route proxy list items

```javascript
// src/routes/items.js
router.get("/", asyncHandler(async (req, res) => {
  const upstream = await upstreamFetch("/api/v1/items", {}, req);
  const data = await readUpstreamJson(upstream);
  res.json(data);
}));
```

POST с телом:

```javascript
router.post("/", asyncHandler(async (req, res) => {
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
}));
```

---

## Статусы: что видит React

| Upstream | BFF → client | Смысл |
|----------|--------------|-------|
| 200 | 200 | OK |
| 404 | 404 | not found |
| 422 | 422 | validation |
| 500 | 500 | upstream error (проброс или map) |
| network fail | 502 | Bad Gateway |
| timeout | 504 | Gateway Timeout |
| BFF bug | 500 | INTERNAL |

Не маскируйте 404 как 500 — UI показывает разные экраны.

---

## Таймауты

Node 18+ `AbortSignal.timeout(ms)`:

```javascript
const signal = AbortSignal.timeout(5000);
await fetch(url, { signal });
```

Кастомный controller для cancel при shutdown ([nodejs-advanced](../javascript-path.md)):

```javascript
const controller = new AbortController();
setTimeout(() => controller.abort(), 5000);
await fetch(url, { signal: controller.signal });
```

**Connect vs read:** для basic одного общего timeout достаточно; split — advanced.

Рекомендация mock-exams: **10s** default, **3s** для health check upstream.

---

## Health: проверка FastAPI

```javascript
// src/routes/health.js
router.get("/upstream", asyncHandler(async (req, res) => {
  try {
    const r = await upstreamFetch("/health", { timeoutMs: 3000 }, req);
    const ok = r.ok;
    res.status(ok ? 200 : 503).json({
      bff: "ok",
      fastapi: ok ? "ok" : "degraded",
      status: r.status,
    });
  } catch {
    res.status(503).json({ bff: "ok", fastapi: "down" });
  }
}));
```

---

## Агрегация parallel

```javascript
router.get("/dashboard", asyncHandler(async (req, res) => {
  const [itemsRes, statsRes] = await Promise.all([
    upstreamFetch("/api/v1/items?limit=5", {}, req),
    upstreamFetch("/api/v1/stats/summary", {}, req),
  ]);

  const [items, stats] = await Promise.all([
    readUpstreamJson(itemsRes),
    readUpstreamJson(statsRes),
  ]);

  res.json({ recentItems: items.items ?? items, stats });
}));
```

`Promise.all` — fail fast: один upstream fail → весь dashboard error. Альтернатива — `Promise.allSettled` + partial data (UX choice).

---

## Headers forward (осторожно)

Пробрасывайте selectively:

```javascript
const forwardHeaders = ["authorization", "accept-language"];
function pickHeaders(incoming) {
  const out = {};
  for (const key of forwardHeaders) {
    if (incoming[key]) out[key] = incoming[key];
  }
  return out;
}
```

Не forward `host`, `connection` blindly — security и bugs.

---

## Retry в BFF?

Default: **no automatic retry** на GET в browser-facing path — дубли side effects если граница blur. Retry with idempotency — gateway level или dedicated worker.

Исключение: internal cron BFF job — [`nodejs-advanced`](../javascript-path.md).

---

## Streaming (справка)

Large files — `res.status(upstream.status); upstream.body.pipeTo(...)` или ReadableStream pass-through. Shop JSON labs — buffer enough.

---

## Связь с курсом

- [20-fastapi-client.md](20-fastapi-client.md) — fetch basics.
- [24-express-errors.md](24-express-errors.md) — AppError chain.
- [34-lab-bff.md](34-lab-bff.md) — full lab.
- [`api-design`](../api-design/README.md) — HTTP codes.

---

## Типичные ошибки

1. **`await res.json()` на 204** — empty body error; используйте text + parse.

2. **Нет timeout** — event loop забита hanging fetch.

3. **502 на любую ошибку** — теряется 404/422 для UI.

4. **`Promise.all` без try** — один reject → unhandled; wrap in asyncHandler.

5. **Логировать full upstream body** — PII.

6. **Double JSON.stringify body** — upstream получает quoted string.

7. **Игнорировать upstream Content-Type** — assume JSON always.

---

## Резюме

BFF proxy через `fetch`: build URL from config, forward method/body/selected headers, `AbortSignal.timeout` для 504. `readUpstreamJson` маппит FastAPI errors в AppError с сохранением status. Агрегация — `Promise.all` нескольких upstream calls. Логируйте url, status, duration на каждый upstream hop.

---

## Чек-лист

- Какой status вернуть при TimeoutError fetch?
- Как извлечь message из FastAPI 404 `detail`?
- Зачем `res.text()` перед JSON.parse?
- Как пробросить X-Request-Id?
- Чем опасен blind retry POST proxy?
- Default timeout для shop BFF?
- Когда `Promise.allSettled` лучше `Promise.all`?

Следующий урок: [34. Лаба: BFF к `:8090`](34-lab-bff.md).
