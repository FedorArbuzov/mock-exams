# Next.js — Basic

Мега-подробный курс **Next.js (App Router)** для fullstack shop mock-exams: Server/Client Components, file-based routing, data fetching, Route Handlers, Server Actions, metadata, Docker. **40 уроков** + capstone + interview cheatsheet.

> Старт JS-маршрута: [`javascript-path.md`](../javascript-path.md). **Предварительно** — [`javascript-basic`](../javascript-basic/README.md), [`typescript-basic`](../typescript-basic/README.md), [`react-basic`](../react-basic/README.md). Дальше — [`react-intermediate`](../react-intermediate/README.md), [`javascript-testing`](../javascript-path.md).

**Предварительно:** Node.js **LTS** (20 или 22), уверенный React (компоненты, hooks, `fetch`), TypeScript (props, async/await). Понимание SPA из react-basic — отправная точка для сравнения с SSR.

**Локально:** Next.js в каталоге [`examples/`](examples/package.json). Backend FastAPI — с главы 15; Django admin — в capstone.

```bash
cd courses/nextjs-basic/examples
npm install
npm run dev          # http://localhost:3000
# в другом терминале — FastAPI :8090 (deploy/fastapi)
```

## Как читать главы

Каждый урок — **полноценная глава учебника**, не шпаргалка. Автор ведёт от **рабочего сценария** (тикет, SEO-баг, «почему в prod пустая страница») к концепциям, коду и типичным ошибкам — как в [`javascript-basic`](../javascript-basic/README.md) и [`react-basic`](../react-basic/README.md).

1. **Теория** — «Сценарий с работы» → объяснение → примеры → «Типичные ошибки» → «Чек-лист». Закрепляйте чек-лист **своими словами** до лабы.
2. **Лаба** — hands-on в [`examples/`](examples/package.json): `npm run dev`, правки в `app/`, критерии успеха. Лаба **продолжает сюжет** теории.
3. После блока 38 — [`interview-cheatsheet.md`](interview-cheatsheet.md) **без подглядывания** в главы.
4. [39-capstone.md](39-capstone.md) — **8–10 часов**, fullstack «Shop Catalog» с SSR и Route Handlers к `:8090`.

**Время:** **~50–70 минут** на пару «теория + лаба». Весь курс — **~20–24 часа**; capstone отдельно.

## Программа (40 уроков)

### Фаза 1. Среда и первое приложение (00–03)

| # | Урок |
|---|------|
| 00 | [Окружение: create-next-app, dev-сервер](00-environment.md) |
| 01 | [Ландшафт: SPA, SSR, SSG, Next.js](01-landscape.md) |
| 02 | [App Router: каталог `app/`, layout, page](02-app-router.md) |
| 03 | [Лаба: первое Next.js-приложение](03-lab-first-app.md) |

### Фаза 2. Маршрутизация (04–08)

| 04 | [File-based routing: сегменты и вложенность](04-routing.md) |
| 05 | [Dynamic routes: `[id]`, catch-all, optional](05-dynamic-routes.md) |
| 06 | [Layouts, templates, loading UI](06-layouts-templates.md) |
| 07 | [Лаба: каталог и страница товара](07-lab-routing.md) |
| 08 | [`Link`, `useRouter`, навигация без reload](08-navigation.md) |

### Фаза 3. Server и Client Components (09–13)

| 09 | [React Server Components: зачем и как](09-server-components.md) |
| 10 | [Client Components: `"use client"`, границы](10-client-components.md) |
| 11 | [Лаба: разделить server/client дерево](11-lab-rsc-boundary.md) |
| 12 | [Composition: передача children и slots](12-composition-patterns.md) |
| 13 | [Suspense, streaming, skeleton UI](13-suspense-streaming.md) |

### Фаза 4. Data fetching на сервере (14–18)

| 14 | [`fetch` в Server Components](14-server-fetch.md) |
| 15 | [Лаба: список товаров с FastAPI :8090](15-lab-server-fetch.md) |
| 16 | [Кэш, `revalidate`, tags, no-store](16-caching-revalidate.md) |
| 17 | [Параллельные запросы, `Promise.all`, waterfall](17-parallel-fetch.md) |
| 18 | [Error boundaries: `error.tsx`, `notFound()`](18-error-not-found.md) |

### Фаза 5. Route Handlers и BFF (19–23)

| 19 | [Route Handlers: REST в `app/api`](19-route-handlers.md) |
| 20 | [Лаба: прокси к FastAPI через Next](20-lab-route-handlers.md) |
| 21 | [Server Actions: формы без отдельного API](21-server-actions.md) |
| 22 | [Лаба: форма обратной связи](22-lab-server-actions.md) |
| 23 | [Middleware: rewrite, redirect, headers](23-middleware.md) |

### Фаза 6. Клиентские данные и гибрид (24–28)

| 24 | [TanStack Query в Next.js (client islands)](24-tanstack-query.md) |
| 25 | [Лаба: корзина и mutations на клиенте](25-lab-client-state.md) |
| 26 | [Cookies, headers, `cookies()` / `headers()`](26-cookies-headers.md) |
| 27 | [Auth-паттерны: JWT, session (обзор)](27-auth-patterns.md) |
| 28 | [Environment variables и конфиг](28-env-config.md) |

### Фаза 7. Стили, assets, SEO (29–33)

| 29 | [CSS Modules, Tailwind, global styles](29-styling.md) |
| 30 | [`next/image`, `next/font`, static files](30-images-fonts.md) |
| 31 | [Metadata API: title, OG, sitemap](31-metadata-seo.md) |
| 32 | [Лаба: SEO для страницы товара](32-lab-metadata.md) |
| 33 | [Internationalization (обзор App Router)](33-i18n-overview.md) |

### Фаза 8. Production и Docker (34–37)

| 34 | [Production build, standalone output](34-production-build.md) |
| 35 | [Docker: multi-stage, `deploy/nextjs`](35-docker-deploy.md) |
| 36 | [Static export vs SSR: когда что](36-static-export.md) |
| 37 | [Лаба: собрать образ и проверить health](37-lab-docker.md) |

### Фаза 9. Отладка и финал (38–39)

| 38 | [Interview Q&A (топ-35)](38-interview-qa.md) |
| 39 | [Capstone: Shop Catalog fullstack](39-capstone.md) |

| — | [Interview cheatsheet](interview-cheatsheet.md) |

## Что должно получиться

- Создаёте **Next.js App Router** проект и объясняете отличие от Vite SPA.
- Строите **file-based routing** с layouts, dynamic segments, loading/error UI.
- Разделяете **Server vs Client Components** без «всё client» или «hooks в server file».
- Загружаете данные на **сервере** с FastAPI `:8090`, настраиваете **revalidate**.
- Пишете **Route Handlers** как BFF и **Server Actions** для форм.
- Используете **middleware** для redirect и заголовков.
- Комбинируете **SSR + client islands** (корзина, theme) с TanStack Query.
- Настраиваете **metadata**, `next/image`, production **Docker**-образ.
- Отлаживаете типичные prod-баги и отвечаете на вопросы собеседования.

## Связь с курсами

| Курс | Связь |
|------|-------|
| [`react-basic`](../react-basic/README.md) | компоненты, hooks — Client Components |
| [`react-intermediate`](../react-intermediate/README.md) | auth, MSW, performance |
| [`fastapi`](../../deploy/fastapi/README.md) | shop API `:8090` |
| [`django`](../../deploy/django/README.md) | admin, capstone интеграция |
| [`api-design`](../api-design/README.md) | REST, BFF, кэш |
| [`frontend-architecture`](../javascript-path.md) | SPA vs SSR, BFF |
| [`containers-basic`](../containers-basic/README.md) | Docker для главы 35 |

## Примеры

| Путь | Назначение |
|------|------------|
| [`examples/package.json`](examples/package.json) | Next.js 15, App Router, Query |
| [`examples/app/`](examples/app/) | стартовый код для лаб |
| [`examples/solutions/`](examples/solutions/) | эталоны (после своей попытки) |
