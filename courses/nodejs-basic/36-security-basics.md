# 36. Безопасность: helmet, rate limit, stack traces

## Сценарий с работы

Пятница, 17:00. React-клиент на `:5173` уже ходит в ваш BFF на `:3096`, BFF проксирует FastAPI `:8090`. В Slack прилетает скриншот: в ответе на `POST /api/v1/items` с битым JSON — **полный stack trace** Node.js с путями к `examples/src/routes/items.js`. Параллельно security-сканер CI ругается: нет заголовка `X-Content-Type-Options`, а `/health` отдаёт `X-Powered-By: Express`. Тикет: «закрыть очевидное до релиза».

Вы не строите zero-trust за один день — но **базовая гигиена HTTP-сервера** обязательна уже на уровне `nodejs-basic`. Эта глава — три практичных слоя: заголовки безопасности, ограничение частоты запросов, безопасная обработка ошибок.

## Что вы узнаете

- Зачем BFF — публичная граница и какие риски закрываем на старте
- Настройка **helmet** и порядок middleware в цепочке Express
- Концепция **rate limiting**: алгоритмы, 429, in-memory vs Redis
- Почему **stack trace** нельзя отдавать клиенту и куда писать полный `err`
- Различие dev/prod в форме JSON-ошибок
- Практика: лаба с небезопасным error handler

## Зачем безопасность на BFF

BFF — **публичная граница** для браузера. Даже если FastAPI «за прокси» и недоступен напрямую:

| Риск | Что видит атакующий / сканер |
|------|----------------------------|
| Verbose errors | пути файлов, версии пакетов, SQL/ORM hints |
| Отсутствие security headers | XSS через reflected content, clickjacking |
| Нет rate limit | brute-force login, DoS на `/api/*`, исчерпание upstream |
| Утечка env в логах | `DATABASE_URL`, API keys в pino JSON |

Полный OWASP-разбор — в [`secrets-advanced`](../secrets-advanced/README.md) и [`nodejs-advanced`](../javascript-path.md). Здесь — **минимум**, который не стыдно показать на code review.

## Helmet: HTTP-заголовки по умолчанию

[`helmet`](https://helmetjs.github.io/) — middleware для Express (и совместимых фреймворков), который выставляет **рекомендуемые заголовки**:

```javascript
import express from "express";
import helmet from "helmet";

const app = express();

app.use(helmet());
// или точечно:
// app.use(helmet({ contentSecurityPolicy: false })); // если CSP ломает dev inline scripts
```

### Что обычно добавляет Helmet

| Заголовок | Зачем |
|-----------|-------|
| `X-Content-Type-Options: nosniff` | браузер не «угадывает» MIME |
| `X-Frame-Options: SAMEORIGIN` / CSP `frame-ancestors` | защита от clickjacking |
| `Strict-Transport-Security` | HSTS (только за HTTPS в prod) |
| `X-Powered-By` | **убирает** утечку «Express» |
| Content-Security-Policy | ограничивает источники script/style (настраивать под SPA) |

### CSP и React dev

На `:5173` Vite использует inline HMR — жёсткий CSP на BFF **не заменяет** CSP фронтенда. Для BFF JSON API часто достаточно:

```javascript
app.use(
  helmet({
    contentSecurityPolicy: {
      useDefaults: true,
      directives: {
        defaultSrc: ["'none'"],
        frameAncestors: ["'none'"],
      },
    },
  })
);
```

Или отключить CSP на BFF, если он отдаёт только JSON — но **остальные** заголовки Helmet оставить.

### Порядок middleware

Helmet — **до** роутов, сразу после создания `app`:

```text
helmet → cors → pino-http → body parser → routes → error handler
```

См. [22-middleware.md](22-middleware.md): порядок цепочки критичен.

## Rate limiting: концепция

**Rate limiting** — ограничение числа запросов за окно времени (per IP, per user, per API key). Цели:

1. **Защита upstream** — FastAPI `:8090` не должен получать 10 000 req/s из-за одного клиента.
2. **Защита ресурсов Node** — каждый прокси-запрос = память + сокет + CPU на JSON parse.
3. **Brute-force** — login/register (в `nodejs-intermediate`).

### Алгоритмы (обзор)

| Алгоритм | Поведение |
|----------|-----------|
| Fixed window | N запросов за минуту; всплеск на границе окна |
| Sliding window | точнее, дороже по памяти |
| Token bucket | «burst» + средняя скорость |
| Leaky bucket | сглаживание всплесков |

На собеседовании достаточно объяснить: «считаем ключ `(ip, route)` за интервал; при превышении — **429 Too Many Requests** с `Retry-After`».

### In-memory vs Redis

```text
Один инстанс BFF     → Map в памяти (express-rate-limit store: memory)
N реплик за nginx    → Redis / shared store (nodejs-advanced)
```

Для capstone и лаб достаточно **in-memory**; в prod за балансировщиком — shared store.

### Пример с express-rate-limit (концепция)

Пакет не входит в минимальный `examples/package.json` курса — установите для лабы:

```bash
npm install express-rate-limit
```

```javascript
import rateLimit from "express-rate-limit";

const apiLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 100,
  standardHeaders: true, // RateLimit-* headers
  legacyHeaders: false,
  message: { error: "too_many_requests" },
});

app.use("/api/", apiLimiter);

const strictAuthLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  skipSuccessfulRequests: true,
});

app.use("/api/v1/auth/login", strictAuthLimiter);
```

### Что отвечать клиенту

- Статус **429**, не 500.
- Тело JSON в том же формате, что и остальные ошибки BFF.
- Заголовок **`Retry-After`** (секунды) — если библиотека поддерживает.
- **Не** раскрывать внутренние лимиты upstream.

### Rate limit на BFF vs на FastAPI

| Слой | Что ограничиваем |
|------|------------------|
| BFF | агрессивный браузер, скрипты, DDoS на edge |
| FastAPI | бизнес-критичные endpoints, auth, write |

Defense in depth: оба уровня могут лимитировать, с разными квотами.

## Не отдавать stack traces клиенту

### Антипаттерн

```javascript
app.use((err, req, res, next) => {
  res.status(500).json({
    error: err.message,
    stack: err.stack, // ← НИКОГДА в production response
  });
});
```

Клиент (и злоумышленник) видит:

- абсолютные пути `/app/examples/src/...`;
- версии зависимостей из сообщений;
- иногда фрагменты SQL/validation.

### Правильный error handler

```javascript
app.use((err, req, res, next) => {
  const status = err.status ?? err.statusCode ?? 500;
  const isServerError = status >= 500;

  if (isServerError) {
    req.log?.error({ err }, "unhandled error");
  }

  const body = {
    error: isServerError ? "internal_server_error" : err.code ?? "request_error",
    message: isServerError ? "Internal server error" : err.message,
    requestId: req.id,
  };

  res.status(status).json(body);
});
```

Принципы:

1. **Клиенту** — стабильный код ошибки + безопасное сообщение.
2. **В лог (pino)** — полный `err` с stack ([30-logging-pino.md](30-logging-pino.md)).
3. **`NODE_ENV=production`** — никаких stack/details в JSON; в development можно расширить тело для DX.

### Различие dev и prod

```javascript
const isProd = process.env.NODE_ENV === "production";

res.status(500).json({
  error: "internal_server_error",
  ...(isProd ? {} : { detail: err.message, stack: err.stack }),
});
```

Не полагайтесь только на `NODE_ENV` для секретов — но для **формы ответа** это стандарт.

### Async errors

Забытый `catch` в async handler — unhandled rejection или зависший запрос. Используйте обёртку из [24-express-errors.md](24-express-errors.md):

```javascript
const asyncHandler = (fn) => (req, res, next) =>
  Promise.resolve(fn(req, res, next)).catch(next);
```

## Дополнительная гигиена (чек-лист)

| Практика | Детали |
|----------|--------|
| Валидация body | не trust client; Zod/joi в intermediate |
| Размер body | `express.json({ limit: "100kb" })` |
| CORS | не `origin: *` с credentials ([25-express-body-cors.md](25-express-body-cors.md)) |
| Secrets | `.env` в `.gitignore`, не логировать токены |
| Dependencies | `npm audit`, renovate/dependabot |
| HTTPS | terminate TLS на nginx/ingress, не на голом Node в prod |

## Лаба: unsafe vs safe error handler

Файл [`examples/lab/unsafe-error-handler.js`](examples/lab/unsafe-error-handler.js) — намеренно плохой handler. Задача:

1. Запустите с `NODE_ENV=production`, вызовите ошибку — убедитесь, что stack **не** в теле.
2. Перепишите handler по образцу выше; проверьте, что stack есть в логах pino.
3. Подключите `helmet()` и проверьте заголовки через `curl -I`.

**Критерий успеха:** `curl -i` показывает security headers; ответ 500 — `{ "error": "internal_server_error" }` без `stack`.

## Типичные ошибки

1. **Helmet после роутов** — заголовки не применяются ко всем ответам.
2. **Rate limit только на login** — забыли GET flood на `/api/v1/items`.
3. **Логировать stack в stdout и в response** — двойная утечка.
4. **Доверять `err.message` от upstream** — проброс FastAPI detail может содержать SQL; маппите на свои коды.
5. **CORS `*` + cookie auth** — браузерная модель ломается; отдельная тема, но на review всплывает вместе с security.

## Чек-лист

- Что делает `helmet()` в Express и где его ставить в цепочке?
- Зачем rate limit на BFF, если FastAPI тоже может лимитировать?
- Чем опасен stack trace в JSON-ответе?
- Куда писать полный stack — в response или в log?
- Почему in-memory rate limit не работает «как есть» за 3 репликами?
- Какой HTTP-статус при превышении лимита?

Следующий урок: [37. Отладка Node.js](37-debugging.md).
