# JavaScript learning path (план)

План курсов по JavaScript / TypeScript / Node.js / React для репозитория mock-exams.

**Статус:** в работе — реализованы [`javascript-basic`](javascript-basic/README.md), [`typescript-basic`](typescript-basic/README.md), [`nodejs-basic`](nodejs-basic/README.md), [`react-basic`](react-basic/README.md), [`react-intermediate`](react-intermediate/README.md) и [`nextjs-basic`](nextjs-basic/README.md); остальные курсы ветки — планирование.

Связь с существующим backend-треком: [fastapi](fastapi/README.md), [django](django/README.md), [api-design](api-design/README.md), [python-async](python-async/README.md), [python-testing](python-testing/README.md). Общая карта курсов: [README.md](README.md). DevOps-маршрут: [devops-path.md](devops-path.md).

## Контекст

Сейчас в репозитории сильный **DevOps + Python backend** трек, а **отдельных JS-курсов нет**. Предлагаемая ветка закрывает фронтенд и Node.js и встраивается в уже существующие стенды:

| Стенд | Порт | Назначение |
|-------|------|------------|
| [deploy/fastapi](../deploy/fastapi/README.md) | 8090 | REST API для лаб Node/React |
| [deploy/django](../deploy/django/README.md) | 8092 | Каталог, admin, DRF |
| [deploy/redis](../deploy/redis/README.md) | 6379 | Кэш, сессии, BullMQ |
| [deploy/rabbitmq](../deploy/rabbitmq/README.md) | 5672 | Очереди (аналог celery) |
| [deploy/postgres](../deploy/postgres/README.md) | 5432 | БД для Node ORM |

## Схема маршрута

```text
javascript-basic  →  typescript-basic
       │                    │
       └──────────┬─────────┘
                  ▼
           nodejs-basic  →  nodejs-intermediate  →  nodejs-advanced
                  │              │                      │
                  │              ├── fastapi / django API (BFF, JWT)
                  │              ├── postgresql-developer
                  │              └── python-celery / rabbitmq (BullMQ)
                  │
                  └── react-basic  →  react-intermediate
                           │              │
                           ├── fastapi :8090, django :8092
                           └── api-design (CORS, OpenAPI client)

javascript-testing  —  после react-basic или nodejs-basic
javascript-algorithms  —  параллельно (собесы frontend)
```

## Ядро (must-have)

| Курс | Уровень | Часы | Описание |
|------|---------|------|----------|
| `javascript-basic` | Junior | ~12–16 | Типы, scope, closures, `this`, prototypes, Promises/async, modules, `fetch`, обработка ошибок. Без фреймворков — «как linux-basic для JS». |
| `typescript-basic` | Junior+ | ~10–14 | Типы, union/intersection, generics, `strict`, tsconfig, Zod. Практически обязателен для остальных курсов. |
| `nodejs-basic` | Middle | ~14–18 | Event loop (сравнение с [python-async](python-async/README.md)), Express/Fastify, middleware, env, HTTP-клиент к FastAPI. Стенд `deploy/nodejs` → прокси на :8090. |
| `nodejs-intermediate` | Middle+ | ~18–24 | Слои как в fastapi: роуты, DI, Prisma/Drizzle + Postgres, JWT, валидация, структура проекта, тесты. |
| `nodejs-advanced` | Senior | ~18–24 | BullMQ (аналог [python-celery](python-celery/README.md)), Redis cache, observability (Prometheus), rate limit, graceful shutdown, Docker/nginx. |

**Сильная связка с экосистемой:** Node-курсы — зеркало [fastapi](fastapi/README.md) на JS; React-курсы — клиент к тем же API.

## Frontend

| Курс | Уровень | Часы | Описание |
|------|---------|------|----------|
| `react-basic` | Middle | ~14–18 | Компоненты, hooks, state, forms, React Router, `fetch` + TanStack Query к `deploy/fastapi`. |
| `react-intermediate` | Middle+ | ~16–20 | Auth flow (JWT refresh), error boundaries, performance, code splitting, MSW для моков API. |
| [`nextjs-basic`](nextjs-basic/README.md) | Middle+ | ~20–24 | App Router, SSR/SSG, Route Handlers, Server Actions, деплой в Docker. Fullstack-ветка рядом с [django](django/README.md). |

**Капстоун:** админка каталога к `deploy/django` (:8092) — дополняет django-уроки про лендинг без React.

## Специализации

| Курс | Часы | Описание |
|------|------|----------|
| `javascript-testing` | ~14–18 | Vitest, Testing Library, MSW, Playwright e2e против fastapi. Аналог [python-testing](python-testing/README.md). |
| `javascript-algorithms` | ~30–40 | Two pointers, sliding window, trees, graphs на JS для frontend-собесов. Аналог [python-algorithms](python-algorithms/README.md). |
| `browser-platform` | ~10–14 | Event loop в браузере, rendering, CORS/cookies, storage, security (XSS/CSRF). Дополняет [api-design](api-design/README.md) с клиентской стороны. |
| `websockets-frontend` | ~6–8 | Клиент к [fastapi/25-websockets-sse](fastapi/25-websockets-sse.md): reconnect, backoff, SSE vs WebSocket. |

## Теория (без стенда)

| Курс | Часы | Описание |
|------|------|----------|
| `frontend-architecture` | ~12–16 | SPA vs SSR, BFF, state management, микрофронты. Рядом с [microservices-patterns](microservices-patterns/README.md). |
| `frontend-interviews` | ~12–16 | System design UI, behavioral + техника. Рядом с [behavioral-interviews](behavioral-interviews/README.md). |

## Рекомендуемый порядок внедрения

| Этап | Курс | Зачем |
|------|------|-------|
| 1 | `javascript-basic` + `typescript-basic` | Фундамент; мало инфраструктуры (Node на хосте). |
| 2 | `nodejs-basic` + стенд `deploy/nodejs` | BFF к FastAPI; сразу видна связь с backend-треком. |
| 3 | `react-basic` | UI к тому же API; сквозной проект «shop» как у Python-ветки. |
| 4 | `nodejs-intermediate`, `react-intermediate` | Углубление после ядра. |
| 5 | `javascript-testing` | После react-basic или nodejs-basic. |
| 6 | `nodejs-advanced`, `nextjs-basic`, `javascript-algorithms` | После работающего ядра и deploy-стендов. |

## Новые стенды (`deploy/`)

| Стенд | Порт | Интеграция |
|-------|------|------------|
| `deploy/nodejs` | ~8096 | BFF → fastapi :8090 |
| `deploy/react` | ~8097 | Vite SPA → fastapi / django |
| `deploy/nextjs` | ~8098 | Опционально, позже |

Переиспользуются: [deploy/postgres](../deploy/postgres/README.md), [deploy/redis](../deploy/redis/README.md), [deploy/rabbitmq](../deploy/rabbitmq/README.md), [deploy/nginx](../deploy/nginx/README.md), [gitlab-*](gitlab-basic/README.md) для CI.

## Требования к окружению (черновик)

| Курс | Что нужно |
|------|-----------|
| `javascript-basic`, `typescript-basic` | Node.js LTS на хосте; опционально `nvm` |
| `nodejs-*` | `deploy/nodejs` + [deploy/fastapi](../deploy/fastapi/README.md); intermediate+ — postgres |
| `react-*` | `deploy/react` + backend API (:8090 или :8092) |
| `javascript-testing` | Vitest/Playwright в examples; integration — fastapi или nodejs стенд |
| `javascript-algorithms` | Node + examples/ (по аналогии с python-algorithms) |
| `browser-platform`, `frontend-architecture`, `frontend-interviews` | Только чтение |

## Связь с Python-маршрутом

```text
containers-basic + postgresql-basic
       │
       ├── fastapi (:8090)  ←── nodejs-basic (BFF), react-basic (клиент)
       ├── django (:8092)   ←── react-intermediate (админка)
       ├── python-async     ←── nodejs-basic (сравнение event loop)
       ├── python-celery    ←── nodejs-advanced (BullMQ)
       ├── api-design       ←── react-basic, browser-platform
       └── python-testing   ←── javascript-testing (параллельная ветка)
```

## Формат курсов

Как у [fastapi](fastapi/README.md):

1. **Теория** — сценарий с работы → концепции → код → типичные ошибки.
2. **Лаба** — стенд `deploy/*` или локальный Node.
3. **Capstone** + `interview-cheatsheet.md` в конце трека.
4. **~50–70 минут** на пару «теория + лаба».

## Группа для PDF

Добавить в `scripts/build-courses-pdf.py` группу `javascript` (после реализации курсов):

```python
"javascript": (
    "javascript-basic",
    "typescript-basic",
    "nodejs-basic",
    "nodejs-intermediate",
    "nodejs-advanced",
    "react-basic",
    "react-intermediate",
    "javascript-testing",
    "javascript-algorithms",
),
```

Теоретические курсы (`browser-platform`, `frontend-architecture`, `frontend-interviews`) — в группу `theory`.
