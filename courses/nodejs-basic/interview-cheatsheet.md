# Node.js Basic — шпаргалка к собеседованию

Проверьте себя **без подглядывания**, затем откройте разборы в [38-interview-qa.md](38-interview-qa.md).

---

## Event loop (libuv)

```text
sync → очередь nextTick → microtasks (Promise.then) → фаза libuv → …
```

| Фаза | Примеры |
|------|---------|
| timers | setTimeout, setInterval |
| poll | I/O callbacks |
| check | setImmediate |
| close | socket.on('close') |

| API | Когда |
|-----|-------|
| `process.nextTick` | до microtasks после текущей операции |
| `queueMicrotask` | очередь microtasks |
| `setImmediate` | фаза check |
| `setTimeout(0)` | фаза timers |

**Правило:** синхронный CPU-код блокирует всё. I/O — non-blocking через libuv (+ thread pool для части fs/crypto/DNS).

**vs asyncio:** оба single-threaded cooperative I/O; Node — фазы libuv, Python — await/Task.

---

## Модули

| | ESM | CJS |
|---|-----|-----|
| синтаксис | import/export | require/module.exports |
| включение | `"type":"module"` | default / .cjs |
| top-level await | да | нет |

---

## Потоки (streams)

| Тип | Роль |
|-----|------|
| Readable | источник (HTTP req, fs read) |
| Writable | приёмник (HTTP res, fs write) |
| Transform | map/filter (gzip, csv line) |
| pipeline() | backpressure + проброс ошибок |

**Зачем:** постоянная память, не грузить 2 GB через readFile в RAM.

---

## HTTP / Express

**Жизненный цикл:** TCP → http parser → цепочка middleware → handler → res.end.

**Middleware:** `(req, res, next) =>`; без `next()` — стоп. Ошибки: `(err, req, res, next)`.

**Порядок (типичный):**

```text
helmet → cors → pino-http → express.json → routes → errorHandler
```

**Async-ошибки:** try/catch + next(err) или обёртка asyncHandler.

---

## fetch (Node 18+)

- 4xx/5xx — **не throw**; проверяйте `response.ok`.
- Таймаут: `AbortSignal.timeout(ms)`.
- На сервере — **нет** проверки CORS (это делает браузер).

---

## BFF

**Backend for Frontend** — слой между SPA и API:

- прокси / агрегация
- скрытие ключей
- CORS для браузера
- формат под UI
- rate limit на edge

**mock-exams:** React `:5173` → BFF `:3096` → FastAPI `:8090`.

---

## CORS

- Проверяет **браузер**, не curl.
- Preflight: OPTIONS + Allow-Headers/Methods.
- `credentials: true` → origin **не** `*`.
- BFF выставляет заголовки для dev origins 5173.

---

## Env и конфиг

- `process.env` — источник правды в prod (K8s/Docker).
- dotenv — dev `.env` → `process.env`.
- Не коммитить секреты; валидировать обязательные переменные при старте.
- `FASTAPI_URL` без trailing slash.

---

## Логирование (pino)

- JSON lines → Loki/ELK.
- `pino-http`: method, url, status, duration, **req.id**.
- Проброс `X-Request-Id` в upstream.
- Stack — **в log**, не в теле HTTP-ответа.

---

## Health

| Маршрут | Смысл |
|---------|-------|
| `/health` | liveness — процесс жив |
| `/health/ready` | readiness — upstream OK |

---

## Безопасность (базовый уровень)

| Мера | Зачем |
|------|-------|
| helmet | security headers, убрать X-Powered-By |
| rate limit | 429 при flood/brute-force; in-memory vs Redis |
| json limit | защита от огромного body (DoS) |
| без stack в prod response | утечка путей и версий |
| NODE_ENV=production | безопасная форма ошибок |

---

## Отладка

| Команда | Эффект |
|---------|--------|
| `node --inspect` | debug port, код выполняется |
| `node --inspect-brk` | пауза до attach |
| VS Code Attach :9229 | breakpoints в handlers |

**Prod:** логи + requestId + метрики; не открывать `--inspect` на публичном порту.

---

## Процесс

| | |
|---|---|
| SIGTERM | graceful shutdown (stop accept, drain) |
| unhandledRejection | может убить процесс — исправляйте async |
| exit code | 0 ok, non-zero error |

---

## Структура проекта

```text
src/index.js      # bootstrap
src/app.js        # createApp
src/config.js     # env
src/routes/
src/services/     # upstream client
src/middleware/
```

---

## Быстрые Q&A (одна строка)

| Вопрос | Ответ |
|--------|-------|
| Node однопоточный? | один JS thread; I/O async через libuv |
| readFileSync на сервере? | блокирует loop — плохо |
| Express vs Fastify? | Express — экосистема; Fastify — schema, скорость |
| Зачем BFF если есть API? | CORS, агрегация, скрытие ключей, API под UI |
| 502 vs 503 от BFF? | 502 — плохой ответ upstream; 503 — недоступен |
| ECONNREFUSED | upstream не слушает порт |
| Middleware после routes? | не выполнится для matched route |
| Buffer vs string? | binary vs text; важна кодировка |

---

## Smoke-команды

```bash
curl -s http://localhost:3096/health
curl -s http://localhost:3096/health/ready
curl -s http://localhost:3096/api/v1/items
curl -H "Origin: http://localhost:5173" -I http://localhost:3096/api/v1/items
```

---

## Порты mock-exams

| Сервис | Порт |
|--------|------|
| FastAPI | 8090 |
| Shop BFF | 3096 |
| React Vite | 5173 |

---

## Связь с курсами

- Сравнение event loop → [python-async](../python-async/README.md)
- REST upstream → [fastapi](../../deploy/fastapi/README.md)
- UI-клиент → [react-basic](../react-basic/README.md)
- JWT/DB дальше → nodejs-intermediate
