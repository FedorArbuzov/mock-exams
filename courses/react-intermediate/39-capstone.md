# 39. Capstone: Django Catalog Admin SPA (8–10 часов)

## Введение: зачем capstone

До этой главы вы учили **фрагменты** production admin: JWT ([08-jwt-basics.md](08-jwt-basics.md)–[13-lab-auth.md](13-lab-auth.md)), error boundaries ([14-error-boundaries.md](14-error-boundaries.md)–[17-lab-errors.md](17-lab-errors.md)), performance ([18-rerender-model.md](18-rerender-model.md)–[23-lab-performance.md](23-lab-performance.md)), MSW ([24-msw-intro.md](24-msw-intro.md)–[27-lab-msw.md](27-lab-msw.md)), forms и CRUD ([28-forms-rhf.md](28-forms-rhf.md)–[31-lab-crud.md](31-lab-crud.md)).

Capstone собирает **полноценную Admin SPA** mock-exams catalog — клиент к Django DRF [`deploy/django`](../../deploy/django/README.md) на `:8092` (products + categories). Альтернатива backend — MSW для demo без docker.

Аналог в JS-треке — [react-basic/38-capstone](../react-basic/38-capstone.md) (Shop Catalog к FastAPI `:8090`); здесь — **admin** domain с auth и CRUD.

Если застряли — возвращайтесь к урокам из таблицы «Когда смотреть», не копируйте готовый admin из интернета.

**Оценка времени:** 8–10 часов (4–5 сессий по ~2 часа).

---

## Задача

**Django Catalog Admin SPA** — внутренний инструмент управления каталогом: login, guarded routes, таблица товаров с server-side pagination/filters/sort, CRUD product, categories read-only, error boundaries, explicit UI states, TypeScript strict, production build.

Домен совпадает с Django stack: **Product** (`sku`, `title`, `description`, `price`, `is_active`, `category`), **Category** (`name`, `slug`).

---

## Функциональные требования

### Маршруты (React Router)

| Path | Страница | Guard | Описание |
|------|----------|-------|----------|
| `/` | Redirect | — | → `/products` (if auth) or `/login` |
| `/login` | LoginPage | public | Email + password form |
| `/products` | ProductsTablePage | auth | Paginated table |
| `/products/new` | ProductCreatePage | auth | Create form |
| `/products/:id` | ProductDetailPage | auth | Read-only detail |
| `/products/:id/edit` | ProductEditPage | auth | Edit form |
| `/categories` | CategoriesPage | auth | Read-only list (optional cards/table) |
| `*` | NotFoundPage | — | 404 |

Layout route: `AdminLayout` — sidebar/nav, user menu (logout), `<Outlet />`, optional health indicator.

```mermaid
flowchart TB
  subgraph browser [Admin SPA :5174]
    Auth[AuthProvider]
    Router[React Router]
    Query[TanStack Query]
    Pages[pages]
    EB[Error Boundaries]
  end
  Auth --> Router
  Router --> EB
  EB --> Pages
  Pages --> Query
  Query -->|Bearer JWT| API[Django DRF :8092]
  Query -.->|optional| MSW[MSW handlers]
```

---

### API (Django :8092)

Базовый URL: `VITE_API_URL` или `http://localhost:8092`.

| Метод | Endpoint | Использование |
|-------|----------|---------------|
| GET | `/health/` | Footer status (optional) |
| POST | `/api/v1/auth/login/` | Login (или mock MSW) |
| POST | `/api/v1/auth/refresh/` | Refresh access token |
| GET | `/api/v1/products/` | Table list + query params |
| POST | `/api/v1/products/` | Create |
| GET | `/api/v1/products/{id}/` | Detail |
| PATCH | `/api/v1/products/{id}/` | Update |
| DELETE | `/api/v1/products/{id}/` | Delete |
| GET | `/api/v1/categories/` | Filter dropdown + categories page |

**Query params products** ([29-admin-table.md](29-admin-table.md)):

- `page`, `search`, `ordering`, `category`, `is_active`, `min_price`, `max_price`

**Pagination response:**

```json
{
  "count": 142,
  "next": "...",
  "previous": null,
  "results": []
}
```

Запуск backend:

```bash
cd deploy/django
docker compose up -d --build
curl http://localhost:8092/api/v1/products/
curl http://localhost:8092/api/v1/categories/
```

MSW mode: `VITE_USE_MSW=true` — расширьте [`examples/src/mocks/handlers.ts`](examples/src/mocks/handlers.ts) для full CRUD + refresh.

---

### Authentication

| Требование | Детали |
|------------|--------|
| Login form | email + password; RHF + Zod optional |
| Token storage | memory + refresh pattern ([09-token-storage.md](09-token-storage.md)) |
| Protected routes | redirect `/login` with `returnUrl` |
| Logout | clear tokens, `queryClient.clear()`, navigate login |
| 401 interceptor | refresh queue → retry or logout ([12-refresh-flow.md](12-refresh-flow.md)) |
| MSW credentials | `admin@shop.local` / `admin` (как в handlers) |

---

### ProductsTablePage

- URL state: `page`, `q`, `category`, `ordering`, `is_active` ([29-admin-table.md](29-admin-table.md))
- TanStack Query `productKeys.list(params)`
- `placeholderData: keepPreviousData`
- Columns: SKU, title, category, price, active, actions (view/edit/delete)
- Sort headers: price, title, created_at
- Filters: search (debounced), category select, active select
- Pagination from `count`
- UI: loading skeleton, error + retry, empty state
- Row hover prefetch detail ([32-prefetch-patterns.md](32-prefetch-patterns.md)) — optional +points

---

### Product CRUD

**Create / Edit** — [28-forms-rhf.md](28-forms-rhf.md):

| Поле | Zod | DRF field |
|------|-----|-----------|
| sku | string 2–64, regex | sku |
| title | string 2–200 | title |
| description | optional string | description |
| price | positive number | price |
| category | number id | category |
| is_active | boolean | is_active |

- Server 400 → `setError` per field
- Success → invalidate lists, toast, navigate detail or list

**Delete** — confirm dialog; optional optimistic remove ([30-optimistic-advanced.md](30-optimistic-advanced.md))

**Detail** — read-only dl/card; links edit/delete

---

### CategoriesPage (minimum)

- `GET /api/v1/categories/` — list name, slug
- No CRUD required (DRF read-only on stand); extension: link to Django admin `:8092/admin/`

---

### Error boundaries

| Level | Fallback |
|-------|----------|
| Root | «Что-то пошло не так» + reload |
| Route (`/products/*`) | localized error + link dashboard |
| Query errors | **не** boundary — inline ErrorPanel |

Reset boundary on navigation: `key={location.pathname}` ([15-boundaries-router.md](15-boundaries-router.md)).

---

### MSW option

| Env | Behavior |
|-----|----------|
| `VITE_USE_MSW=false` | Real Django :8092 |
| `VITE_USE_MSW=true` | Worker intercepts; full offline CRUD |

Handlers must mirror trailing slashes DRF style. Document in README both modes.

---

## Нефункциональные требования

| Требование | Зачем |
|------------|-------|
| TypeScript strict, без `any` на новом коде | maintainability |
| `api/client.ts` + `ApiError` | [04-api-client.md](04-api-client.md) |
| Query keys factory | [06-query-advanced.md](06-query-advanced.md) |
| Feature structure `features/products`, `features/auth` | [02-architecture.md](02-architecture.md) |
| a11y: labels, table semantics, dialog focus | [34-accessibility.md](34-accessibility.md) |
| No secrets in `VITE_*` | [35-security-client.md](35-security-client.md) |
| `npm run build` без ошибок | [36-production-build.md](36-production-build.md) |
| README с setup, env, screenshots | для reviewer |
| Error boundaries ≥ 2 levels | capstone acceptance |

---

## Целевая структура

```text
examples/capstone/              # или evolve examples/src/
├── README.md
├── .env.example
├── package.json
├── vite.config.ts
├── tsconfig.json
├── index.html
└── src/
    ├── main.tsx
    ├── app/
    │   ├── App.tsx
    │   ├── providers.tsx
    │   ├── routes.tsx
    │   └── AdminLayout.tsx
    ├── pages/
    │   ├── LoginPage.tsx
    │   ├── ProductsTablePage.tsx
    │   ├── ProductCreatePage.tsx
    │   ├── ProductDetailPage.tsx
    │   ├── ProductEditPage.tsx
    │   ├── CategoriesPage.tsx
    │   └── NotFoundPage.tsx
    ├── features/
    │   ├── auth/
    │   │   ├── AuthProvider.tsx
    │   │   ├── useAuth.ts
    │   │   └── ProtectedRoute.tsx
    │   └── products/
    │       ├── components/
    │       │   ├── ProductForm.tsx
    │       │   ├── ProductRow.tsx
    │       │   ├── ProductFilterBar.tsx
    │       │   └── DeleteProductDialog.tsx
    │       ├── schemas/productFormSchema.ts
    │       └── hooks/useProductTableParams.ts
    ├── components/
    │   ├── errors/RouteErrorBoundary.tsx
    │   ├── errors/RootErrorBoundary.tsx
    │   ├── feedback/ErrorPanel.tsx
    │   ├── feedback/Toast.tsx
    │   └── ui/...
    ├── api/
    │   ├── client.ts
    │   ├── auth.ts
    │   └── products.ts
    ├── stores/
    │   └── uiStore.ts              # optional sidebar
    ├── mocks/
    │   ├── browser.ts
    │   └── handlers.ts
    ├── types/
    │   └── catalog.ts
    └── styles/
        └── index.css
```

---

## Пошаговый план (рекомендуемый)

### Сессия 1 (~2 ч): auth + layout + guarded routes

1. Scaffold или evolve `examples/`.
2. `AuthProvider`, login page, token in memory.
3. `ProtectedRoute`, `AdminLayout` shell.
4. API client + login/refresh stubs (MSW or Django).
5. **Критерий:** login → `/products` empty shell; logout → login.

**Уроки:** [10-auth-context.md](10-auth-context.md), [11-protected-routes.md](11-protected-routes.md), [13-lab-auth.md](13-lab-auth.md).

### Сессия 2 (~2 ч): products table + URL state

1. `fetchProducts`, paginated types.
2. `ProductsTablePage` filters/sort/pagination.
3. Query + `keepPreviousData`.
4. Categories query for filter dropdown.
5. **Критерий:** table shows seed products from `:8092` or MSW; URL shareable.

**Уроки:** [05-pagination-filters.md](05-pagination-filters.md), [29-admin-table.md](29-admin-table.md), [07-lab-django-products.md](07-lab-django-products.md).

### Сессия 3 (~2 ч): CRUD forms

1. Zod schema + `ProductForm`.
2. Create, detail, edit pages + mutations.
3. Delete confirm.
4. Server validation mapping.
5. **Критерий:** full create → edit → delete cycle.

**Уроки:** [28-forms-rhf.md](28-forms-rhf.md), [31-lab-crud.md](31-lab-crud.md).

### Сессия 4 (~2 ч): errors + boundaries + polish

1. Root + route error boundaries.
2. Global toast; Query error panels.
3. a11y pass on form/table.
4. Categories page minimum.
5. **Критерий:** throw in test component → boundary fallback, rest app navigable.

**Уроки:** [14-error-boundaries.md](14-error-boundaries.md)–[17-lab-errors.md](17-lab-errors.md), [34-accessibility.md](34-accessibility.md).

### Сессия 5 (~1–2 ч): MSW completeness + production + README

1. Full MSW handlers CRUD + refresh failure scenario.
2. `npm run build`, fix TS.
3. README: docker, env, MSW toggle, screenshots.
4. Self-check acceptance below.
5. Profiler smoke — no obvious render storm ([37-profiler.md](37-profiler.md)).

**Уроки:** [26-msw-query.md](26-msw-query.md), [36-production-build.md](36-production-build.md).

---

## Подсказки по реализации

### Query keys factory

```tsx
export const productKeys = {
  all: ["products"] as const,
  lists: () => [...productKeys.all, "list"] as const,
  list: (params: ProductTableParams) =>
    [...productKeys.lists(), params] as const,
  details: () => [...productKeys.all, "detail"] as const,
  detail: (id: number) => [...productKeys.details(), id] as const,
};
```

### Auth header interceptor sketch

```tsx
async function api<T>(path: string, init: RequestInit = {}): Promise<T> {
  const headers = new Headers(init.headers);
  headers.set("Content-Type", "application/json");
  const token = getAccessToken();
  if (token) headers.set("Authorization", `Bearer ${token}`);

  let res = await fetch(`${baseUrl}${path}`, { ...init, headers });

  if (res.status === 401 && !path.includes("/auth/")) {
    const refreshed = await tryRefreshToken();
    if (refreshed) {
      headers.set("Authorization", `Bearer ${getAccessToken()}`);
      res = await fetch(`${baseUrl}${path}`, { ...init, headers });
    }
  }
  // throw ApiError, parse JSON...
}
```

### Route boundary

```tsx
<Route
  path="/products"
  element={
    <RouteErrorBoundary>
      <ProductsTablePage />
    </RouteErrorBoundary>
  }
/>
```

### Open redirect safe return

```tsx
const from = location.state?.from?.pathname ?? "/products";
const safe = from.startsWith("/") && !from.startsWith("//") ? from : "/products";
navigate(safe);
```

---

## Расширения (опционально)

| Уровень | Задача | Часы |
|---------|--------|------|
| A | Optimistic toggle + delete | +1 |
| B | `ReactQueryDevtools` + Zustand sidebar persist | +0.5 |
| C | Code-split edit route + prefetch | +1 |
| D | nginx docker static + API proxy | +1.5 |
| E | Vitest + MSW: login + create product | +2 |
| F | Role-based UI (staff vs admin) | +2 |
| G | Bulk deactivate selected rows | +1.5 |

---

## Критерии приёмки (самопроверка)

- [ ] Login/logout работает; protected routes redirect
- [ ] Refresh flow при expired access (MSW scenario или manual token tweak)
- [ ] `/products` — pagination, search, category filter, sort в URL
- [ ] Create product → appears in list; duplicate SKU — field error
- [ ] Edit updates detail; delete removes from list
- [ ] Loading / error / empty на table и detail
- [ ] Error boundary ловит render error на route level
- [ ] Keyboard: login → table → edit без mouse (smoke)
- [ ] `VITE_USE_MSW=true` — full flow без docker
- [ ] `VITE_USE_MSW=false` — flow против `:8092`
- [ ] `npm run build` успешен
- [ ] README с командами frontend + backend + env table
- [ ] Нет monolith 800-line file — feature structure
- [ ] Пройден [interview-cheatsheet.md](interview-cheatsheet.md) без подглядывания

---

## Типичные ошибки

1. **Providers below Routes** — auth/query reset. Providers **выше** Router tree.

2. **Trailing slash mismatch** — Django 301 on POST. Always `/api/v1/products/`.

3. **Client-side filter on paginated data** — only filters current page.

4. **Tokens in localStorage без понимания XSS risk** — document choice; no secrets in VITE.

5. **Error boundary для fetch errors** — user sees generic crash; use ErrorPanel.

6. **Forgot invalidate after mutation** — stale table.

7. **MSW handlers не обновляют mock array** — create succeeds once, then 404.

8. **Hardcode localhost in production build** — use env.

9. **No confirm on delete** — accidental data loss.

10. **Skip a11y on «internal tool»** — audit findings anyway.

---

## Когда смотреть уроки

| Проблема | Урок |
|---------|------|
| 401 loop / refresh | 12 |
| CORS / API client | 04, 07 |
| Table URL state | 29 |
| Form + server errors | 28 |
| Optimistic UI | 30 |
| MSW CRUD | 25, 27, 31 |
| Boundary + router | 15, 17 |
| Build/deploy | 36 |
| Perf regression | 37, 19 |
| Security review | 35 |

---

## После capstone

1. Ещё раз [interview-cheatsheet.md](interview-cheatsheet.md) и [38-interview-qa.md](38-interview-qa.md).
2. Отметьте в [javascript-path.md](../javascript-path.md): **javascript-testing** или **nextjs-basic**.
3. Portfolio: README + скриншоты table/form + demo GIF login flow.
4. Optional: deploy static behind [deploy/nginx](../../deploy/nginx/README.md) proxy to `:8092`.

Поздравляем — **react-intermediate** завершён.

---

[← 38-interview-qa](38-interview-qa.md) · [interview-cheatsheet](interview-cheatsheet.md) · [README](README.md)
