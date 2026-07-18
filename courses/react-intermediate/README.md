# React — Intermediate

Мега-подробный курс **React** уровня Middle+: JWT auth с refresh, error boundaries, производительность, code splitting, **MSW** для моков API, admin-таблицы и CRUD к Django DRF [`deploy/django`](../../deploy/django/README.md) `:8092`. **40 уроков** + capstone + interview cheatsheet.

> Старт JS-маршрута: [`javascript-path.md`](../javascript-path.md). **Обязательно** — [`react-basic`](../react-basic/README.md) (capstone [38-capstone](../react-basic/38-capstone.md) или эквивалентный SPA). Желательно [`typescript-basic`](../typescript-basic/README.md).

**Предварительно:** Node.js **LTS** (20 или 22), уверенный React basic (hooks, Query, Router, Context), TypeScript (generics, Zod).

**Локально:** Vite + React в [`examples/`](examples/package.json). Backend Django — с главы 07, MSW — с главы 24 (можно раньше для auth-лаб).

```bash
cd courses/react-intermediate/examples
npm install
npm run dev          # http://localhost:5174
# в другом терминале — Django стенд :8092 (см. deploy/django)
```

## Как читать главы

Каждый урок — **полноценная глава учебника**, не шпаргалка. Автор ведёт от **рабочего сценария** (тикет, инцидент, code review) к концепциям, коду и типичным ошибкам — как в [react-basic](../react-basic/README.md) и [javascript-basic](../javascript-basic/README.md).

1. **Теория** — «Сценарий с работы» → объяснение → примеры → «Типичные ошибки» → «Чек-лист». Закрепляйте чек-лист **своими словами** до лабы.
2. **Лаба** — hands-on в [`examples/`](examples/package.json): правки в `src/`, критерии успеха. Лаба **продолжает сюжет** теории.
3. После блока 38 — [`interview-cheatsheet.md`](interview-cheatsheet.md) **без подглядывания** в главы.
4. [39-capstone.md](39-capstone.md) — **8–10 часов**, Admin SPA к Django `:8092`.

**Время:** **~50–70 минут** на пару «теория + лаба». Весь курс — **~18–22 часа**; capstone отдельно.

## Программа (40 уроков)

### Фаза 1. Мост из react-basic (00–03)

| # | Урок |
|---|------|
| 00 | [Окружение: расширение проекта, MSW, зависимости](00-environment.md) |
| 01 | [Ландшафт Middle+: server state, auth, production SPA](01-landscape.md) |
| 02 | [Архитектура: features, слои, границы модулей](02-architecture.md) |
| 03 | [Лаба: скелет Admin SPA](03-lab-scaffold.md) |

### Фаза 2. API-слой и Django (04–07)

| 04 | [Typed API client: interceptors, ApiError](04-api-client.md) |
| 05 | [Пагинация, фильтры, DRF контракт](05-pagination-filters.md) |
| 06 | [TanStack Query: infinite, prefetch, keepPreviousData](06-query-advanced.md) |
| 07 | [Лаба: products с Django :8092](07-lab-django-products.md) |

### Фаза 3. Аутентификация (08–13)

| 08 | [JWT: access, refresh, claims, срок жизни](08-jwt-basics.md) |
| 09 | [Хранение токенов: memory, localStorage, cookies](09-token-storage.md) |
| 10 | [AuthProvider, useAuth, синхронизация с Query](10-auth-context.md) |
| 11 | [Protected routes, roles, redirect после login](11-protected-routes.md) |
| 12 | [Refresh flow: очередь, race, logout cascade](12-refresh-flow.md) |
| 13 | [Лаба: login и guarded раздел](13-lab-auth.md) |

### Фаза 4. Обработка ошибок (14–17)

| 14 | [Error boundaries: что ловят и что нет](14-error-boundaries.md) |
| 15 | [Boundaries + Router + Query error reset](15-boundaries-router.md) |
| 16 | [Global error UX: toasts, retry, offline](16-global-error-ux.md) |
| 17 | [Лаба: fallback UI и route errors](17-lab-errors.md) |

### Фаза 5. Производительность (18–23)

| 18 | [Re-render: mental model и React DevTools](18-rerender-model.md) |
| 19 | [`memo`, `useMemo`, `useCallback` без фанатизма](19-memo-patterns.md) |
| 20 | [Виртуализация длинных списков](20-virtualization.md) |
| 21 | [Code splitting: `lazy`, `Suspense`, preload](21-code-splitting.md) |
| 22 | [Suspense для данных: `useSuspenseQuery`](22-suspense-data.md) |
| 23 | [Лаба: оптимизация каталога](23-lab-performance.md) |

### Фаза 6. MSW и изоляция API (24–27)

| 24 | [MSW: зачем мокать API в dev и тестах](24-msw-intro.md) |
| 25 | [Handlers, scenarios, задержки и ошибки](25-msw-handlers.md) |
| 26 | [MSW + Query + переключение real/mock](26-msw-query.md) |
| 27 | [Лаба: mock auth и products](27-lab-msw.md) |

### Фаза 7. Формы и admin UI (28–31)

| 28 | [react-hook-form + Zod resolver](28-forms-rhf.md) |
| 29 | [Admin table: sort, filter, bulk actions](29-admin-table.md) |
| 30 | [Optimistic UI и rollback в mutations](30-optimistic-advanced.md) |
| 31 | [Лаба: CRUD product](31-lab-crud.md) |

### Фаза 8. Продвинутые паттерны (32–34)

| 32 | [Prefetch, stale-while-revalidate, background sync](32-prefetch-patterns.md) |
| 33 | [Zustand для UI state (обзор)](33-zustand-ui.md) |
| 34 | [Accessibility в admin: focus, aria, keyboard](34-accessibility.md) |

### Фаза 9. Безопасность и сборка (35–36)

| 35 | [XSS, CSP, секреты на клиенте](35-security-client.md) |
| 36 | [Production build, env, preview nginx](36-production-build.md) |

### Фаза 10. Финал (37–39)

| 37 | [Profiler, why-did-you-render, метрики](37-profiler.md) |
| 38 | [Interview Q&A (топ-40)](38-interview-qa.md) |
| 39 | [Capstone: Django Catalog Admin SPA](39-capstone.md) |

| — | [Interview cheatsheet](interview-cheatsheet.md) |

## Что должно получиться

- Проектируете **feature-based** структуру admin SPA с typed API-слоем.
- Реализуете **JWT auth**: login, refresh, protected routes, logout cascade.
- Ловите **render errors** через error boundaries; не путаете с async/event errors.
- Оптимизируете **perf** осознанно: virtualization, code splitting, без premature memo.
- Мокаете **Django API** через MSW для dev и будущих тестов.
- Строите **admin table** с пагинацией, фильтрами, CRUD через react-hook-form.
- Интегрируетесь с **Django DRF :8092** (products, categories).
- Понимаете **клиентскую безопасность** и production-сборку Vite.

## Связь с курсами

| Курс | Связь |
|------|-------|
| [`react-basic`](../react-basic/README.md) | hooks, Query, Router — предпосылка |
| [`typescript-basic`](../typescript-basic/README.md) | Zod, generics, strict |
| [`django`](../../deploy/django/README.md) | DRF API `:8092`, admin domain |
| [`fastapi`](../../deploy/fastapi/README.md) | сравнение API, CORS |
| [`api-design`](../api-design/README.md) | REST, пагинация, статусы |
| [`javascript-testing`](../javascript-path.md) | MSW, Testing Library, Playwright |
| [`nodejs-intermediate`](../javascript-path.md) | JWT на BFF, refresh endpoint |

## Примеры

| Путь | Назначение |
|------|------------|
| [`examples/package.json`](examples/package.json) | Vite, React 19, MSW, RHF, Zustand |
| [`examples/src/`](examples/src/) | стартовый код для лаб |
| [`examples/solutions/`](examples/solutions/) | эталоны (после своей попытки) |
