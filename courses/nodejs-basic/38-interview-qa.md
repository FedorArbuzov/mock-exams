# 38. Interview Q&A: топ-35 по Node.js

## Введение

Вопросы на **Middle Node / BFF** — не «что такое npm», а event loop под нагрузкой, порядок middleware, backpressure streams, проектирование прокси. Сначала ответьте **вслух 1–2 минуты**, затем сверьтесь с разбором. Шпаргалка без спойлеров: [interview-cheatsheet.md](interview-cheatsheet.md).

---

## Блок 1. Event loop и libuv

### 1. Из чего состоит event loop Node?

**Ответ.** Один поток JS + **libuv** для I/O. Loop проходит фазы: **timers** (`setTimeout`) → **pending callbacks** → **idle/prepare** → **poll** (I/O) → **check** (`setImmediate`) → **close callbacks**. Между фазами выполняются **microtasks** (`Promise.then`, `queueMicrotask`). **`process.nextTick`** — отдельная очередь, выполняется **до** следующей microtask после текущей операции.

**Где в курсе:** [04-event-loop-libuv.md](04-event-loop-libuv.md), [05-nexttick-setimmediate.md](05-nexttick-setimmediate.md).

---

### 2. Порядок: `setTimeout(0)`, `Promise.then`, `nextTick`, `setImmediate`?

**Ответ.** Синхронный код → `nextTick` → microtasks (Promise) → **следующая фаза loop** (часто timers, затем poll/check) → `setImmediate` vs `setTimeout(0)` зависит от контекста (внутри I/O callback `setImmediate` обычно раньше `setTimeout`).

**Где в курсе:** [06-lab-event-loop.md](06-lab-event-loop.md).

---

### 3. Чем Node event loop отличается от asyncio?

**Ответ.** Оба — **single-threaded** cooperative multitasking для I/O. asyncio: `await` + Task + loop на Python. Node: libuv phases + microtasks. Блокирующий sync код **останавливает оба**. CPU-bound в Node — `worker_threads` / вынести процесс; в Python — ProcessPool.

**Где в курсе:** [07-python-async-comparison.md](07-python-async-comparison.md).

---

### 4. Почему `fs.readFileSync` опасен на сервере?

**Ответ.** **Блокирует** event loop — все HTTP-запросы ждут. Под нагрузкой latency взлетает. Используйте `fs.promises.readFile` или streams; для CPU — workers.

**Где в курсе:** [10-fs-path.md](10-fs-path.md), [08-async-io-patterns.md](08-async-io-patterns.md).

---

### 5. Что такое libuv thread pool?

**Ответ.** Часть операций (некоторые `fs`, DNS `lookup`, crypto) выполняется в **пуле потоков** (по умолчанию 4), результат возвращается в loop. Не путать с «Node многопоточный для JS» — JS по-прежнему один поток.

**Где в курсе:** [04-event-loop-libuv.md](04-event-loop-libuv.md).

---

## Блок 2. Модули и встроенные API

### 6. CJS vs ESM в Node — когда что?

**Ответ.** **ESM:** `import`/`export`, `"type":"module"` в package.json, top-level await. **CJS:** `require`, `module.exports`, синхронная загрузка. Смешивание через `createRequire`. Новые проекты — ESM; legacy npm — часто CJS.

**Где в курсе:** [09-modules-cjs-esm.md](09-modules-cjs-esm.md).

---

### 7. Зачем streams вместо `readFile` + `split`?

**Ответ.** **Backpressure** и **константная память** — обрабатываете чанки, не грузите 2 GB файл в RAM. `pipeline()` пробрасывает ошибки и `destroy`. HTTP request/response — streams.

**Где в курсе:** [13-streams.md](13-streams.md), [14-lab-streams.md](14-lab-streams.md).

---

### 8. Readable vs Writable vs Transform?

**Ответ.** **Readable** — источник данных (`read()`, events `data`). **Writable** — приёмник (`write()`, `end()`). **Transform** — и readable, и writable (gzip, parse line-by-line). **`Duplex`** — два независимых канала (TCP socket).

**Где в курсе:** [13-streams.md](13-streams.md).

---

### 9. Что такое Buffer?

**Ответ.** Бинарные данные вне heap JS — сырые байты для файлов, сети, crypto. Кодировки `utf8`, `hex`, `base64`. Не путать со строкой: `Buffer.from("a")` ≠ `"a"` для бинарных протоколов.

**Где в курсе:** [12-buffers-encoding.md](12-buffers-encoding.md).

---

### 10. `process.env` vs dotenv?

**Ответ.** **`process.env`** — объект окружения OS/container. **dotenv** — загружает `.env` в `process.env` при старте (dev). В prod — env из orchestrator (K8s secrets, Docker `-e`), не коммит `.env`.

**Где в курсе:** [28-env-config.md](28-env-config.md), [02-process.md](02-process.md).

---

## Блок 3. HTTP и Express

### 11. Жизненный цикл HTTP-запроса в Express?

**Ответ.** TCP → Node `http` парсит → `req`/`res` → цепочка **middleware** (`next()`) → route handler → response end. Error middleware (4 args) — после `next(err)`. Порядок регистрации = порядок выполнения.

**Где в курсе:** [22-middleware.md](22-middleware.md), [21-express-routing.md](21-express-routing.md).

---

### 12. Что делает middleware?

**Ответ.** Функция `(req, res, next) =>`. Может: логировать, парсить body, проверять auth, **не вызывать** `next()` — тогда цепочка стоп. **Mount path** — `app.use("/api", router)`.

**Где в курсе:** [22-middleware.md](22-middleware.md).

---

### 13. Как обрабатывать ошибки в async route?

**Ответ.** `try/catch` + `next(err)` или обёртка `asyncHandler(fn)`. Иначе rejected Promise — unhandled rejection, клиент висит. Централизованный error handler — один формат JSON.

**Где в курсе:** [24-express-errors.md](24-express-errors.md).

---

### 14. Express vs Fastify — кратко?

**Ответ.** Express — де-факто стандарт, огромная экосystem, callback-стиль. Fastify — schema-first, hooks, быстрее benchmarks, встроенная JSON schema. BFF mock-exams — Express; Fastify — альтернатива в [27-fastify-overview.md](27-fastify-overview.md).

**Где в курсе:** [27-fastify-overview.md](27-fastify-overview.md).

---

### 15. Зачем `express.json({ limit })`?

**Ответ.** Ограничение размера body — защита от **DoS** огромным JSON и accidental OOM. Default разумный лимит (100kb–1mb) по endpoint.

**Где в курсе:** [25-express-body-cors.md](25-express-body-cors.md), [36-security-basics.md](36-security-basics.md).

---

## Блок 4. CORS, BFF, прокси

### 16. Что такое BFF?

**Ответ.** **Backend for Frontend** — тонкий слой между SPA и микросервисами: агрегация, формат под UI, скрытие ключей, CORS, cookie session. Не дублирует всю бизнес-логику — **оркестрация** и адаптация.

**Где в курсе:** [32-bff-pattern.md](32-bff-pattern.md).

---

### 17. Зачем BFF, если React может ходить в FastAPI?

**Ответ.** Скрыть API keys, единый cookie domain, **агрегация** N запросов в один, версионирование под UI, rate limit на edge, обход CORS в dev через один origin. Прямой доступ — OK для internal admin с OAuth.

**Где в курсе:** [32-bff-pattern.md](32-bff-pattern.md), [33-proxy-aggregation.md](33-proxy-aggregation.md).

---

### 18. Как проксировать `/api/v1/items` на FastAPI?

**Ответ.** BFF route `GET /api/v1/items` → `fetch(`${FASTAPI_URL}/api/v1/items`)` → проброс status/body или маппинг. Заголовки: `Content-Type`, опционально `X-Request-Id`. Таймаут через `AbortSignal.timeout(ms)`.

**Где в курсе:** [33-proxy-aggregation.md](33-proxy-aggregation.md), [20-fastapi-client.md](20-fastapi-client.md).

---

### 19. CORS — кто проверяет и когда?

**Ответ.** **Бrowser** перед JS читает response. Preflight `OPTIONS` для non-simple requests. Сервер отвечает `Access-Control-Allow-Origin` (не `*` с credentials). BFF на `:3096`, React на `:5173` — разные origins → CORS на BFF.

**Где в курсе:** [25-express-body-cors.md](25-express-body-cors.md).

---

### 20. Что такое preflight?

**Ответ.** Браузер шлёт `OPTIONS` с `Access-Control-Request-Method/Headers`. Сервер должен ответить 204/200 с allow headers. Забытый `OPTIONS` на route → CORS fail в browser, curl OK.

**Где в курсе:** [25-express-body-cors.md](25-express-body-cors.md).

---

## Блок 5. Логирование, конфиг, безопасность

### 21. Зачем pino вместо console.log?

**Ответ.** **Structured JSON** — парсинг в ELK/Loki, уровни, child loggers, низкий overhead. `pino-http` — `req.id`, duration, status. `console.log` — не machine-readable, нет correlation.

**Где в курсе:** [30-logging-pino.md](30-logging-pino.md).

---

### 22. Что логировать на каждый HTTP-запрос?

**Ответ.** Минимум: method, path, status, duration, **requestId**. Не логировать: passwords, Authorization full, PII без redaction. Ошибки — `err` object со stack **в log only**.

**Где в курсе:** [31-lab-logging.md](31-lab-logging.md), [36-security-basics.md](36-security-basics.md).

---

### 23. `/health` vs `/health/ready`?

**Ответ.** **Liveness** — процесс жив (`/health`). **Readiness** — готов принимать трафик (upstream FastAPI ping, DB). K8s использует оба probe по-разному.

**Где в курсе:** capstone [39-capstone.md](39-capstone.md).

---

### 24. Зачем helmet?

**Ответ.** Security HTTP headers: `X-Content-Type-Options`, frame guard, убрать `X-Powered-By`. Снижает поверхность browser-side атак и information disclosure.

**Где в курсе:** [36-security-basics.md](36-security-basics.md).

---

### 25. Rate limiting — где ставить?

**Ответ.** На **публичной границе** (BFF/nginx) — защита от flood. На auth endpoints — строже. In-memory OK для одного инстанса; Redis — несколько реплик. Ответ **429** + `Retry-After`.

**Где в курсе:** [36-security-basics.md](36-security-basics.md).

---

## Блок 6. Отладка и production

### 26. `node --inspect` vs `--inspect-brk`?

**Ответ.** `--inspect` — debugger port открыт, код бежит. `--inspect-brk` — **пауза на старте** до attach Chrome/VS Code. Для быстрых scripts — `-brk`, иначе процесс завершится до attach.

**Где в курсе:** [37-debugging.md](37-debugging.md).

---

### 27. Как отлаживать «502 от BFF, curl FastAPI OK»?

**Ответ.** Разделить слои: curl upstream → curl BFF → breakpoint в proxy handler → смотреть `fetch` status, timeout, URL из env (`FASTAPI_URL` trailing slash). Логи с `req.id`.

**Где в курсе:** [37-debugging.md](37-debugging.md), [33-proxy-aggregation.md](33-proxy-aggregation.md).

---

### 28. Почему не отдавать stack trace клиенту?

**Ответ.** Information disclosure: пути, версии, hints к уязвимостям. Stack — только в structured log. Client gets `{ error: "internal_server_error" }`.

**Где в курсе:** [36-security-basics.md](36-security-basics.md).

---

### 29. Unhandled rejection — что происходит?

**Ответ.** Node 15+ по умолчанию может **завершить процесс** на unhandled rejection. В сервере — global handler + fix async routes. Promise rejection без `.catch` в fire-and-forget — баг.

**Где в курсе:** [24-express-errors.md](24-express-errors.md), [08-async-io-patterns.md](08-async-io-patterns.md).

---

### 30. Graceful shutdown — зачем?

**Ответ.** SIGTERM → перестать принимать новые connections, дождаться in-flight requests, закрыть pool/Redis, exit 0. Избегает обрыва mid-request при deploy. Подробнее в nodejs-advanced.

**Где в курсе:** обзор в [02-process.md](02-process.md).

---

## Блок 7. Архитектура и misc

### 31. Структура папок Node BFF?

**Ответ.** `src/index.js` entry, `config.js`, `app.js` factory, `routes/`, `middleware/`, `services/` (upstream client), `errors.js`. Не один `index.js` на 800 строк — [35-project-structure.md](35-project-structure.md).

**Где в курсе:** [35-project-structure.md](35-project-structure.md).

---

### 32. Singleton vs factory для HTTP client?

**Ответ.** Переиспользуйте **keep-alive** agents (Undici/fetch default в Node 18+) — меньше TCP handshakes. Не создавайте новый `fetch` wrapper на каждый request с тяжёлыми TLS options.

**Где в курсе:** [18-http-client.md](18-http-client.md), [33-proxy-aggregation.md](33-proxy-aggregation.md).

---

### 33. Когда использовать raw `http` vs Express?

**Ответ.** `http` — обучение, ultra-minimal, full control. Express — routing, middleware ecosystem, скорость разработки BFF. Fastify — performance + schema.

**Где в курсе:** [15-http-module.md](15-http-module.md), [21-express-routing.md](21-express-routing.md).

---

### 34. `fetch` в Node — нюансы vs browser?

**Ответ.** Global с Node 18+. Нет CORS enforcement (server-side). `response.ok` false для 4xx/5xx — **не throw**. Используйте `AbortSignal.timeout`. Undici под капотом.

**Где в курсе:** [18-http-client.md](18-http-client.md), [20-fastapi-client.md](20-fastapi-client.md).

---

### 35. Как объяснить «Node однопоточный, но concurrent»?

**Ответ.** Один **JS thread** выполняет callbacks по очереди. **I/O** делегируется OS/libuv; пока ждём disk/network, loop обслуживает другие запросы. Concurrency через **non-blocking I/O**, не parallel JS на одном ядре.

**Где в курсе:** [04-event-loop-libuv.md](04-event-loop-libuv.md), [01-landscape.md](01-landscape.md).

---

## После главы

1. Пройдите [interview-cheatsheet.md](interview-cheatsheet.md) ещё раз без подглядывания.
2. Слабые блоки — вернитесь к урокам из колонки «Где в курсе».
3. Следующий шаг: [39-capstone.md](39-capstone.md) — Shop BFF.
