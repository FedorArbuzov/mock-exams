# Node.js — Basic

Мега-подробный курс **Node.js** для backend и BFF: event loop и libuv, встроенные модули, streams, HTTP с нуля, **Express** и обзор **Fastify**, middleware, env, структурированные логи, HTTP-клиент к [`deploy/fastapi`](../../deploy/fastapi/README.md) `:8090`. **40 уроков** (00–39) + interview cheatsheet.

> Старт JS-маршрута: [`javascript-path.md`](../javascript-path.md). **Предварительно** — [`javascript-basic`](../javascript-basic/README.md) (async/await, modules, `fetch`, event loop обзорно); желательно [`typescript-basic`](../typescript-basic/README.md). Дальше — [`nodejs-intermediate`](../javascript-path.md), [`react-basic`](../react-basic/README.md).

**Предварительно:** Node.js **LTS** (20 или 22), уверенный JS (Promises, `async/await`, ES modules, обработка ошибок). Базовый HTTP — полезно [`api-design`](../api-design/README.md) глава 01.

**Локально:** каталог [`examples/`](examples/package.json). FastAPI стенд `:8090` — опционально до главы 20, обязателен с главы 20 и capstone.

```bash
cd courses/nodejs-basic/examples
npm install
npm run dev              # Express BFF на :3096 (лабы 23+)
# в другом терминале — FastAPI :8090 (deploy/fastapi)
curl http://localhost:3096/health
```

## Как читать главы

Каждый урок — **полноценная глава учебника**, не шпаргалка. Автор ведёт от **рабочего сценария** (инцидент в prod, code review, тикет «BFF тормозит») к концепциям, коду и типичным ошибкам — как в [`javascript-basic`](../javascript-basic/README.md).

1. **Теория** — «Сценарий с работы» → объяснение → примеры → «Типичные ошибки» → «Чек-лист». Закрепляйте чек-лист **своими словами** до лабы.
2. **Лаба** — hands-on в [`examples/`](examples/package.json): `node lab/….js`, `npm run dev`, критерии успеха, таблица «если что-то пошло не так».
3. После блока 37 — [`interview-cheatsheet.md`](interview-cheatsheet.md) **без подглядывания** в главы.
4. [39-capstone.md](39-capstone.md) — **6–8 часов**, BFF «Shop Proxy» к FastAPI `:8090`.

**Время:** **~50–70 минут** на пару «теория + лаба». Весь курс — **~16–20 часов**; capstone отдельно.

## Программа (40 уроков, 00–39)

### Фаза 1. Окружение и ландшафт (00–03)

| # | Урок |
|---|------|
| 00 | [Окружение: npm, структура Node-проекта](00-environment.md) |
| 01 | [Ландшафт: Node.js, BFF, экосистема mock-exams](01-landscape.md) |
| 02 | [`process`: argv, env, exit codes, signals](02-process.md) |
| 03 | [Лаба: CLI-скрипты и диагностика](03-lab-cli.md) |

### Фаза 2. Event loop и libuv (04–08)

| 04 | [Event loop в Node: фазы libuv](04-event-loop-libuv.md) |
| 05 | [`process.nextTick` и `setImmediate`](05-nexttick-setimmediate.md) |
| 06 | [Лаба: порядок вывода и блокировка loop](06-lab-event-loop.md) |
| 07 | [Сравнение с python-async](07-python-async-comparison.md) |
| 08 | [Асинхронный I/O: колбэки, Promises, async/await](08-async-io-patterns.md) |

### Фаза 3. Модули и встроенные API (09–14)

| 09 | [CJS vs ESM в Node](09-modules-cjs-esm.md) |
| 10 | [`fs` и `path`](10-fs-path.md) |
| 11 | [Лаба: чтение и запись файлов](11-lab-fs.md) |
| 12 | [Buffers и кодировки](12-buffers-encoding.md) |
| 13 | [Streams: Readable, Writable, pipeline](13-streams.md) |
| 14 | [Лаба: readline и потоковая обработка](14-lab-streams.md) |

### Фаза 4. HTTP с нуля (15–20)

| 15 | [Модуль `http`: сервер и запросы](15-http-module.md) |
| 16 | [Лаба: сырой HTTP-сервер](16-lab-http-server.md) |
| 17 | [URL, query string, роутинг вручную](17-url-routing.md) |
| 18 | [HTTP-клиент: `fetch` и заголовки](18-http-client.md) |
| 19 | [Лаба: клиент к локальному серверу](19-lab-http-client.md) |
| 20 | [Клиент к FastAPI `:8090`](20-fastapi-client.md) |

### Фаза 5. Express (21–26)

| 21 | [Express: маршруты и `Router`](21-express-routing.md) |
| 22 | [Middleware: цепочка и порядок](22-middleware.md) |
| 23 | [Лаба: базовый Express](23-lab-express.md) |
| 24 | [Обработка ошибок и async handlers](24-express-errors.md) |
| 25 | [Body parser, static, CORS](25-express-body-cors.md) |
| 26 | [Лаба: shop routes на Express](26-lab-express-shop.md) |

### Фаза 6. Конфигурация и логирование (27–31)

| 27 | [Fastify: обзор и сравнение с Express](27-fastify-overview.md) |
| 28 | [Переменные окружения: dotenv и валидация](28-env-config.md) |
| 29 | [Лаба: env-конфигурация](29-lab-env.md) |
| 30 | [Структурированные логи: pino](30-logging-pino.md) |
| 31 | [Лаба: логирование запросов](31-lab-logging.md) |

### Фаза 7. BFF и архитектура (32–35)

| 32 | [Паттерн BFF: зачем прокси перед FastAPI](32-bff-pattern.md) |
| 33 | [Прокси, агрегация, таймауты](33-proxy-aggregation.md) |
| 34 | [Лаба: BFF к `:8090`](34-lab-bff.md) |
| 35 | [Структура Node-проекта](35-project-structure.md) |

### Фаза 8. Безопасность, отладка, финал (36–39)

| 36 | [Безопасность: helmet, базовый rate limit](36-security-basics.md) |
| 37 | [Отладка Node: `--inspect`, breakpoints](37-debugging.md) |
| 38 | [Interview Q&A (топ-35)](38-interview-qa.md) |
| 39 | [Capstone: Shop BFF](39-capstone.md) |

| — | [Interview cheatsheet](interview-cheatsheet.md) |

## Что должно получиться

- Объясняете **event loop Node** (libuv, microtasks, `nextTick`, `setImmediate`) и сравниваете с **asyncio**.
- Работаете с **`fs`**, **`path`**, **streams**, **Buffers** без блокировки loop.
- Поднимаете **HTTP-сервер** на `http` и на **Express**; понимаете request/response lifecycle.
- Пишете **middleware** (логирование, auth stub, error handler) и знаете порядок цепочки.
- Читаете **`process.env`**, валидируете конфиг, не коммитите секреты.
- Логируете через **pino** в JSON, а не только `console.log`.
- Делаете **HTTP-клиент** к FastAPI `:8090`, обрабатываете статусы и таймауты.
- Собираете **BFF**: прокси `/api/v1/items`, health, CORS для React `:5173`.
- Отлаживаете через **`node --inspect`** и понимаете типичные вопросы на собеседовании.

## Связь с курсами

| Курс | Связь |
|------|-------|
| [`javascript-basic`](../javascript-basic/README.md) | язык, Promises, event loop обзор |
| [`typescript-basic`](../typescript-basic/README.md) | typed routes, Zod env |
| [`python-async`](../python-async/README.md) | сравнение event loop |
| [`fastapi`](../../deploy/fastapi/README.md) | shop API `:8090` |
| [`api-design`](../api-design/README.md) | REST, статусы, ошибки |
| [`react-basic`](../react-basic/README.md) | клиент к вашему BFF |
| [`nodejs-intermediate`](../javascript-path.md) | Prisma, JWT, слои |
| [`observability-basic`](../observability-basic/README.md) | метрики, трейсы (позже) |

## Примеры

| Путь | Назначение |
|------|------------|
| [`examples/package.json`](examples/package.json) | Express, pino, dotenv, скрипты |
| [`examples/.env.example`](examples/.env.example) | шаблон env для лаб |
| [`examples/lab/`](examples/lab/) | стартовые файлы лаб |
| [`examples/src/`](examples/src/) | Express BFF (лабы 23+) |
| [`examples/solutions/`](examples/solutions/) | эталоны — после своей попытки |
