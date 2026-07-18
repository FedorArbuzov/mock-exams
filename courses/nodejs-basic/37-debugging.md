# 37. Отладка Node.js: `--inspect`, VS Code, production

## Сценарий с работы

BFF на `:3096` проксирует `/api/v1/items` на FastAPI. В браузере React — пустой список, без ошибок в UI. `curl http://localhost:3096/api/v1/items` иногда 502, иногда 200. В логах pino — только `statusCode: 502`, без тела upstream. Коллега спрашивает: «ты breakpoints ставил или опять `console.log` в десять middleware?»

Отладка backend — не «угадайка по логам», а **воспроизведение → гипотеза → наблюдение → fix**. В [javascript-basic/36-debugging.md](../javascript-basic/36-debugging.md) вы уже видели `console`, DevTools и `--inspect` для чистого JS. Здесь — **Node-сервер**, Express middleware chain, async I/O к `:8090`, и что меняется в **production**.

## Что вы узнаете

- Алгоритм отладки: repro → hypothesis → observe → fix
- `node --inspect` и `--inspect-brk`, Chrome DevTools, `debugger`
- Подключение **VS Code / Cursor**: attach и launch с nodemon
- Breakpoints в Express middleware и async handlers
- Диагностика прокси BFF → FastAPI (`curl`, `fetch`, `req.id`)
- Production: structured logs, requestId, чего не делать на prod
- Лаба: порядок async и event loop в `debug-async.js`

## Мышление отладчика (кратко)

```text
1. Repro     — curl / один endpoint / минимальный script
2. Hypothesis — «таймаут upstream», «CORS preflight», «забыли await»
3. Observe   — breakpoint, watch, structured log field
4. Fix       — один change, перепроверить repro
5. Regression — health, другие routes
```

Для BFF первый шаг — **разделить слои**: проблема в BFF, в FastAPI или в клиенте?

```bash
curl -s http://localhost:8090/api/v1/items | head
curl -s http://localhost:3096/api/v1/items | head
```

Если upstream OK, а BFF нет — отладка в `examples/src/`, не в React.

## `node --inspect` и `--inspect-brk`

Node встраивает **V8 Inspector** — тот же протокол, что Chrome DevTools для Node.

```bash
cd courses/nodejs-basic/examples
node --inspect src/index.js
# Debugger listening on ws://127.0.0.1:9229/...
```

| Ф | Поведение |
|------|-----------|
| `--inspect` | inspector сразу, скрипт бежит |
| `--inspect-brk` | **пауза на первой строке** до attach |
| `--inspect=0.0.0.0:9229` | listen на всех интерфейсах (Docker — осторожно, firewall) |

### Chrome DevTools

1. Запустите `node --inspect-brk src/index.js`.
2. Откройте `chrome://inspect`.
3. **Open dedicated DevTools for Node** → Sources → breakpoint в handler.

### Программная точка

```javascript
export function proxyItems(req, res) {
  debugger; // пауза только если inspector attached
  // ...
}
```

**Удаляйте** `debugger` перед merge — в prod с открытым debug-port это дыра; без port — просто шум в code review.

### NODE_OPTIONS

```bash
NODE_OPTIONS='--inspect-brk' npm run dev
```

Удобно, если `nodemon` перезапускает процесс — inspector port тот же (9229 по умолчанию).

## VS Code / Cursor: attach и launch

### Attach to running process

1. Запустите сервер: `node --inspect src/index.js`.
2. Run and Debug → конфигурация **Attach**:

```json
{
  "version": "0.2.0",
  "configurations": [
    {
      "type": "node",
      "request": "attach",
      "name": "Attach :9229",
      "port": 9229,
      "skipFiles": ["<node_internals>/**"]
    }
  ]
}
```

3. F5 → breakpoint в `src/routes/proxy.js` сработает на реальном HTTP-запросе.

### Launch с nodemon

```json
{
  "type": "node",
  "request": "launch",
  "name": "BFF dev",
  "runtimeExecutable": "npm",
  "runtimeArgs": ["run", "dev"],
  "console": "integratedTerminal",
  "skipFiles": ["<node_internals>/**"]
}
```

Добавьте в `package.json` dev-скрипт с `--inspect` при необходимости:

```json
"dev:debug": "nodemon --inspect src/index.js"
```

### Что смотреть при паузе

| Панель | Для Express/BFF |
|--------|-----------------|
| **Variables** | `req.params`, `req.body`, locals |
| **Watch** | `process.env.FASTAPI_URL`, `res.statusCode` |
| **Call Stack** | какой middleware вызвал handler |
| **Debug Console** | `await fetch(...)` **осторожно** — side effects |

### Conditional breakpoint

Правый клик на breakpoint → **Edit Breakpoint** → `req.path === "/api/v1/items" && req.method === "GET"`. Спасает в hot path с сотнями запросов в секунду.

## Отладка Express-цепочки

### Порядок middleware

Симптом: «лог не печатается» — handler **до** вашего middleware или `next()` не вызван.

```javascript
app.use((req, res, next) => {
  req.log.info({ path: req.path }, "incoming");
  next();
});
```

Breakpoint в **error handler** (4 аргумента) — только после `next(err)`.

### Async handler

```javascript
app.get("/api/v1/items", async (req, res, next) => {
  try {
    const upstream = await fetch(`${config.fastapiUrl}/api/v1/items`);
    const data = await upstream.json();
    res.json(data);
  } catch (err) {
    next(err);
  }
});
```

Без `try/catch` или `asyncHandler` — rejection может **не попасть** в ваш error middleware; симптом будет зависший запрос или process warning.

### «Кто изменил status?»

Watch `res.statusCode` после `await` — иногда двойной `res.json()` или `headers already sent`.

## Отладка HTTP-клиента к FastAPI

### curl vs fetch в Node

| Инструмент | Когда |
|------------|-------|
| `curl -v` | заголовки, TLS, raw body |
| `fetch` в Debug Console | воспроизвести точный URL из `config` |
| breakpoint после `fetch` | `upstream.status`, `upstream.headers` |

Типичные баги:

- **ECONNREFUSED** — FastAPI не поднят (`docker compose up` в `deploy/fastapi`).
- **404** — неверный prefix (`/api/v1/items` vs `/items`).
- **504** — нет таймаута, hang forever ([33-proxy-aggregation.md](33-proxy-aggregation.md)).

### Логирование вместо console.log

```javascript
req.log.info(
  { upstreamStatus: upstream.status, durationMs: elapsed },
  "proxy items"
);
```

Корреляция: `req.id` из pino-http ([31-lab-logging.md](31-lab-logging.md)).

## Лаба: порядок async и event loop

Файл [`examples/lab/debug-async.js`](examples/lab/debug-async.js):

```bash
node --inspect-brk examples/lab/debug-async.js
```

1. Предскажите порядок `console.log` **до** запуска.
2. Поставьте breakpoint на `setImmediate` / `Promise.then`.
3. Сравните с [04-event-loop-libuv.md](04-event-loop-libuv.md).

**Критерий:** можете объяснить, почему microtasks выполняются до следующей фазы timers.

## Production debugging: что меняется

В prod **нет** `--inspect-brk` на публичном порту по умолчанию. Основные инструменты:

| Подход | Назначение |
|--------|------------|
| Structured logs (pino) | `level`, `reqId`, `err.stack` **в log**, не в client |
| `X-Request-Id` / `req.id` | связать browser → BFF → FastAPI |
| Health / ready | `GET /health`, `GET /health/ready` (upstream ping) |
| Metrics | RPS, latency p95 ([`observability-basic`](../observability-basic/README.md)) |
| Repro on staging | тот же образец Docker, anonymized data |

### Чего не делать в prod

- SSH + `node --inspect=0.0.0.0` без firewall — **remote code execution** риск.
- Включать `DEBUG=*` на всех репликах — disk/PII flood.
- «Hotfix» через `console.log` без деплоя образа — теряется воспроизводимость.

### Post-mortem workflow

1. Найти `requestId` в ответе или логах клиента.
2. `grep` по pino JSON в Loki/ELK/stdout pod.
3. Проверить upstream logs на `:8090` с тем же id (если пробрасываете).
4. Воспроизвести на staging с тем же `FASTAPI_URL`.

### Source maps

TypeScript BFF (в `nodejs-intermediate`) — stack trace в log указывает на `.ts`; нужны source maps в образе. Чистый JS курса — maps опциональны.

## node inspect (CLI REPL debugger)

Legacy REPL:

```bash
node inspect examples/lab/debug-async.js
```

Команды: `cont`, `next`, `step`, `out`, `repl`. Менее удобен, чем Chrome/VS Code, но работает на сервере без GUI.

## Типичные ошибки

1. **Отладка React, когда сломан upstream** — сначала `:8090`, потом BFF.
2. **Скрипт завершился до attach** — используйте `--inspect-brk` или `setInterval` keep-alive.
3. **Breakpoint в скомпилированном файле** — ставьте в тот файл, который реально исполняет Node.
4. **Inspect на каждом nodemon restart** — IDE disconnect; re-attach или `"restart": true` в launch config.
5. **Смотреть только message, не `err.cause`** — цепочка fetch errors (Node 18+) в `error.cause`.

## Чек-лист

- Разница `--inspect` и `--inspect-brk`?
- Как подключить VS Code к уже запущенному `node --inspect`?
- Где ставить breakpoint для Express error middleware?
- Первые три команды диагностики «BFF 502, FastAPI ?»?
- Почему `debugger` в коде опасен в production?
- Чем production-отладка отличается от локальной?

Следующий урок: [38. Interview Q&A](38-interview-qa.md).
