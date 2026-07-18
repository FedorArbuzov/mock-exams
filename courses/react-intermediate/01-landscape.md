# 01. Ландшафт Middle+: server state, auth, production SPA

## Сценарий с работы

Kick-off react-intermediate. Product owner: «Нужна **админка каталога** — те же products, что в Django, но UX как у Notion: фильтры, bulk edit, без перезагрузки страницы». Backend-лид: «DRF уже отдаёт paginated JSON на :8092, JWT через simplejwt». Вы из react-basic привыкли к **публичному** shop SPA на FastAPI :8090 — read-only catalog, корзина в Context, без login.

Middle+ SPA — другой класс задач: **authenticated** routes, **token refresh**, error boundaries в prod, code splitting, admin tables на тысячи строк. На grooming junior предлагает «положить JWT в localStorage и всё» — security review блокирует. Этот урок — карта территории перед [02-architecture.md](02-architecture.md) и auth-блоком 08–13.

## Что вы узнаете

- Чем **admin SPA** отличается от shop SPA react-basic.
- Три слоя state: **server**, **URL**, **UI/client**.
- Зачем **JWT** на клиенте и что не решает frontend.
- Production concerns: errors, perf, security, mocks.
- Связь Django :8092, FastAPI :8090, MSW.

---

## Эволюция: react-basic → react-intermediate

```text
react-basic (shop)
  ├── публичный каталог
  ├── fetch / TanStack Query → FastAPI :8090
  ├── Router, Context (cart, theme)
  └── capstone: CRUD items без auth

react-intermediate (admin)
  ├── login + protected routes
  ├── Query → Django DRF :8092 (+ MSW)
  ├── typed API client + interceptors
  ├── error boundaries, perf, code splitting
  └── capstone: full Catalog Admin SPA
```

| Аспект | react-basic | react-intermediate |
|--------|-------------|-------------------|
| Auth | нет | JWT access + refresh |
| API | FastAPI items | Django products, categories |
| Формы | controlled inputs | react-hook-form + Zod |
| Ошибки render | белый экран | error boundaries |
| Dev без API | нужен :8090 | MSW + опционально :8092 |
| Роли | — | admin / staff (DRF permissions) |

---

## Server state vs client state vs URL state

Из [20-tanstack-query.md](../react-basic/20-tanstack-query.md): **server state** живёт на backend, клиент **кэширует** через Query. В admin SPA server state — products, categories, orders; **источник истины — Django**.

**Client state** — то, чего нет в API: sidebar open, modal, draft формы до submit. Инструменты: `useState`, Context ([29-context.md](../react-basic/29-context.md)), позже Zustand ([33-zustand-ui.md](33-zustand-ui.md)).

**URL state** — shareable UI: страница, фильтр, sort ([26-url-state.md](../react-basic/26-url-state.md)). В admin таблице `?page=2&category=peripherals&ordering=-price` должно открывать тот же вид у коллеги.

```text
┌─────────────────────────────────────────┐
│  Browser URL (?page, ?q, ?category)     │
├─────────────────────────────────────────┤
│  React UI (tables, forms, layout)       │
├─────────────────────────────────────────┤
│  TanStack Query cache (products, user)  │
├─────────────────────────────────────────┤
│  Auth layer (access token in memory)    │
├─────────────────────────────────────────┤
│  HTTP → /api → Django :8092 or MSW      │
└─────────────────────────────────────────┘
```

**Антипаттерн:** дублировать весь список products в Zustand «навсегда» — Query уже синхronizирует с API.

---

## JWT в архитектуре SPA

Django DRF выдаёт **access** (короткий, ~5–15 min) и **refresh** (длиннее). Access кладётся в `Authorization: Bearer …` на каждый запрос. SPA **не** хранит пароль после login — только tokens + user snapshot.

```text
Login form  →  POST /api/v1/auth/login/
           ←  { access, refresh, user }

GET /products/  →  Header: Authorization: Bearer <access>
               ←  200 + JSON

Access expired  →  POST /api/v1/auth/refresh/  { refresh }
               ←  { access }

Refresh invalid  →  401  →  logout, redirect /login
```

Детали хранения — [09-token-storage.md](09-token-storage.md); refresh queue — [12-refresh-flow.md](12-refresh-flow.md). Mock: `admin@shop.local` / `admin` в [`handlers.ts`](examples/src/mocks/handlers.ts).

**Клиент не «защищает» API** — только UX. Permissions проверяет Django. XSS + token в localStorage = риск ([35-security-client.md](35-security-client.md)).

---

## Django DRF vs FastAPI: что меняется на фронте

Оба — REST JSON. Отличия контракта, с которыми столкнётесь:

| | FastAPI :8090 (react-basic) | Django DRF :8092 |
|---|----------------------------|------------------|
| Список | часто массив `Item[]` | **paginated** `{ count, next, previous, results }` |
| Trailing slash | опционально | часто **обязателен** `/products/` |
| Auth | в basic — без JWT | JWT simplejwt |
| Ошибки | `{ detail }` | `{ detail }` или field errors |
| Admin domain | items | products, categories |

Пагинация и фильтры — [05-pagination-filters.md](05-pagination-filters.md). Typed client — [04-api-client.md](04-api-client.md).

---

## Production SPA: что добавляется после «работает локально»

1. **Error boundaries** — падение одного виджета не убивает всё приложение ([14-error-boundaries.md](14-error-boundaries.md)).
2. **Code splitting** — admin routes грузятся lazy ([21-code-splitting.md](21-code-splitting.md)).
3. **Perf** — virtualization длинных таблиц ([20-virtualization.md](20-virtualization.md)); memo без фанатизма ([19-memo-patterns.md](19-memo-patterns.md)).
4. **Global error UX** — toasts, retry, offline ([16-global-error-ux.md](16-global-error-ux.md)).
5. **MSW** — dev и тесты без flaky network ([24-msw-intro.md](24-msw-intro.md)).
6. **Build + env** — `VITE_*`, nginx preview ([36-production-build.md](36-production-build.md)).

react-basic закладывал Query и Router; intermediate — **операционная зрелость** SPA.

---

## Feature-based admin: превью

Структура из [35-project-structure.md](../react-basic/35-project-structure.md) масштабируется:

```text
src/
  app/           # providers, routes
  features/
    auth/        # login, useAuth
    products/    # table, filters, hooks
  api/           # client, types
  components/ui/ # Button, Spinner — shared
```

Полная схема — [02-architecture.md](02-architecture.md). Лаба скелета — [03-lab-scaffold.md](03-lab-scaffold.md).

---

## MSW в жизненном цикле разработки

```text
День 1–3:   VITE_ENABLE_MSW=true  →  UI без Django
День 4+:    Django :8092 up       →  интеграция
CI:         MSW в Vitest          →  javascript-testing
```

Handlers повторяют **форму** DRF-ответов — меньше сюрпризов при переключении на real API ([07-lab-django-products.md](07-lab-django-products.md)).

---

## Mental model для code review

Вопросы, которые должен уметь ответить Middle+:

- Где живут products после fetch — Query cache или useState?
- Что произойдёт при 401 на protected route?
- Почему `queryKey` включает page и filters?
- Ловит ли error boundary ошибку в `useQuery`?
- Где хранится access token и почему?

Ответы разложены по урокам 04–17.

---

## Типичный день разработчика admin SPA

```text
09:00  git pull, npm run dev (:5174), VITE_ENABLE_MSW=true — UI без Django
10:00  Ticket: фильтр по category → URL + queryKey ([05-pagination-filters.md](05-pagination-filters.md))
12:00  Backend pod :8092 up → переключение на real API ([07-lab-django-products.md](07-lab-django-products.md))
14:00  Code review auth PR → tokenStore, ProtectedRoute ([09-token-storage.md](09-token-storage.md)–[11-protected-routes.md](11-protected-routes.md))
16:00  QA: refresh после 15 min idle → refresh queue ([12-refresh-flow.md](12-refresh-flow.md))
```

Так выглядит **сквозной** поток курса: сначала data layer, затем auth, затем resilience (boundaries, perf). Не обязательно идти строго по спринтам — но порядок уроков 00–13 отражает зависимости.

---

## Связь с курсами

| Ресурс | Связь |
|--------|-------|
| [react-basic/README](../react-basic/README.md) | hooks, Query, Router |
| [api-design](../api-design/README.md) | REST, статусы, pagination |
| [`deploy/django`](../../deploy/django/README.md) | backend admin domain |
| [`deploy/fastapi`](../../deploy/fastapi/README.md) | сравнение клиента |
| [javascript-path.md](../javascript-path.md) | место react-intermediate в ветке |

---

## Типичные ошибки

1. **«Auth на фронте = безопасность»** — только UX; backend обязан проверять JWT и permissions.

2. **Копировать react-basic examples в intermediate** — другой порт, proxy, домен API.

3. **Весь state в Context** — cart/theme ok; catalog — Query.

4. **Игнорировать trailing slash DRF** — 301/404 на `/products` vs `/products/`.

5. **Путать MSW с backend** — mock не заменяет интеграционные тесты против :8092.

6. **Сразу memo всё дерево** — без профилирования ([18-rerender-model.md](18-rerender-model.md)).

---

## Чек-лист

- [ ] Можете объяснить отличие shop SPA от admin SPA
- [ ] Разделяете server / URL / client state
- [ ] Понимаете роль access и refresh JWT (обзорно)
- [ ] Знаете, почему DRF paginated, а не голый массив
- [ ] Видите место MSW, boundaries, code splitting в программе курса
- [ ] Готовы к [02-architecture.md](02-architecture.md)

## Далее

Следующий урок: [02. Архитектура: features, слои, границы модулей](02-architecture.md).
