# 02. Архитектура: features, слои, границы модулей

## Сценарий с работы

Code review лабы react-basic capstone. Senior: «`ProductCard` импортирует `useCart` из `features/cart`, но `CartDrawer` тянет `fetchItems` из `api/` напрямую в JSX — **границы размыты**. Перед admin SPA на 40+ файлов нужна схема: что в `features/`, что в `api/`, кто может импортировать кого». Ticket **ARCH-12**: зафиксировать feature-based layout для react-intermediate.

Без правил через месяц `src/` превращается в «big ball of mud»: circular imports, дублирование типов, тесты, которые мокают пол-приложения. Этот урок — **соглашение mock-exams admin SPA**, расширение [35-project-structure.md](../react-basic/35-project-structure.md).

## Что вы узнаете

- **Feature folders** vs layer folders — гибрид для admin.
- Целевое дерево `react-intermediate/examples/src/`.
- Правила импортов: кто кого может трогать.
- Colocation hooks/components рядом с domain.
- Barrel `index.ts` — когда да и нет.
- Где жить auth, api client, shared UI.

---

## Проблема «всё в components/»

```text
src/components/
  LoginForm.tsx
  ProductsTable.tsx
  ProductFilters.tsx
  AuthGuard.tsx
  useProducts.ts      # hook среди компонентов
  api.ts              # fetch среди UI
```

Поиск «где login» — grep по 80 файлам. Удаление feature **products** — археология. TypeScript не спасает без **структурных** границ.

---

## Целевая структура admin SPA

```text
src/
├── main.tsx
├── app/
│   ├── App.tsx              # composition root
│   ├── providers.tsx        # Query, Auth, Router wrappers
│   └── routes.tsx           # route config, lazy pages
├── pages/                   # thin route shells
│   ├── LoginPage.tsx
│   ├── ProductsPage.tsx
│   └── NotFoundPage.tsx
├── features/
│   ├── auth/
│   │   ├── components/
│   │   │   └── LoginForm.tsx
│   │   ├── context/
│   │   │   └── AuthContext.tsx
│   │   ├── hooks/
│   │   │   └── useLoginMutation.ts
│   │   └── index.ts         # public: useAuth, AuthProvider
│   └── products/
│       ├── components/
│       │   ├── ProductsTable.tsx
│       │   └── ProductFilters.tsx
│       ├── hooks/
│       │   ├── useProductsQuery.ts
│       │   └── useProductFilters.ts
│       └── index.ts
├── api/
│   ├── client.ts            # fetch wrapper, interceptors
│   ├── errors.ts            # ApiError class
│   └── types/
│       ├── product.ts
│       └── auth.ts
├── components/              # domain-agnostic UI
│   └── ui/
│       ├── Button.tsx
│       ├── Spinner.tsx
│       └── DataTableShell.tsx
├── hooks/                   # generic: useDebouncedValue
├── mocks/                   # MSW (dev/test)
└── lib/                     # pure utils: formatPrice, cn
```

**pages/** — glue: layout + feature components. **features/** — бизнес-вертикали. **api/** — HTTP, без JSX.

---

## Правила импортов (dependency rule)

```text
pages  →  features, components, api/types
features/*  →  api, components, hooks, lib
           ✗  другие features напрямую (минимизировать)
components/ui  →  lib only
api  →  lib only (no React)
```

| From → To | features | api | components/ui |
|-----------|----------|-----|---------------|
| pages | ✓ | types only | ✓ |
| features/auth | ✓ (осторожно) | ✓ | ✓ |
| features/products | ✓ (осторожно) | ✓ | ✓ |
| api | ✗ | internal | ✗ |

**Cross-feature:** `products` не импортирует `LoginForm`. Нужен user — `useAuth()` из `@/features/auth` через **public** barrel.

**Нарушение:** `api/client.ts` импортирует `useAuth` для refresh — допустимо только если client **не React hook**, а callback injection ([12-refresh-flow.md](12-refresh-flow.md)).

---

## Colocation vs shared

**Colocation** — код рядом с единственным потребителем:

```text
features/products/components/ProductRowActions.tsx
```

**Shared** — второй feature использует тот же UI:

```text
components/ui/Button.tsx
```

Правило: **Rule of three** — не выносите в `components/` до третьего повторения. `DataTableShell` может остаться в `products/` до появления `categories/`.

---

## Public API feature через index.ts

```typescript
// features/auth/index.ts
export { AuthProvider, useAuth } from "./context/AuthContext";
export type { User, AuthState } from "./context/AuthContext";
```

Потребитель:

```typescript
import { useAuth } from "@/features/auth";
```

**Не** экспортируйте внутренности:

```typescript
// ✗ import { AuthContext } from "@/features/auth/context/AuthContext";
```

Barrel упрощает refactor внутри feature. Минус — tree-shaking при огромных barrel; для admin SPA mock-exams — ok.

---

## Слой api/: client и types

[`04-api-client.md`](04-api-client.md) — `api<T>()`, `ApiError`, interceptors. Types **рядом**, не в каждом компоненте:

```typescript
// api/types/product.ts
export type Product = {
  id: number;
  sku: string;
  title: string;
  price: string;
  is_active: boolean;
  category: { slug: string; name: string };
};

export type Paginated<T> = {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
};
```

DRF pagination — [05-pagination-filters.md](05-pagination-filters.md).

---

## app/providers.tsx — composition root

Вынесите провайдеры из `main.tsx` для читаемости:

```tsx
// app/providers.tsx
import { QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter } from "react-router-dom";
import { queryClient } from "./queryClient";
import { AuthProvider } from "@/features/auth";

export function AppProviders({ children }: { children: React.ReactNode }) {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <BrowserRouter>{children}</BrowserRouter>
      </AuthProvider>
    </QueryClientProvider>
  );
}
```

Порядок: **Query снаружи Auth** или наоборот — зависит от того, нужен ли Query внутри login. Обычно Query снаружи; Auth внутри Router ([10-auth-context.md](10-auth-context.md)).

---

## routes.tsx и lazy pages

```tsx
// app/routes.tsx
import { lazy, Suspense } from "react";
import { Routes, Route } from "react-router-dom";
import { ProtectedRoute } from "@/features/auth/components/ProtectedRoute";

const LoginPage = lazy(() => import("@/pages/LoginPage"));
const ProductsPage = lazy(() => import("@/pages/ProductsPage"));

export function AppRoutes() {
  return (
    <Suspense fallback={<p>Загрузка…</p>}>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route
          path="/products"
          element={
            <ProtectedRoute>
              <ProductsPage />
            </ProtectedRoute>
          }
        />
      </Routes>
    </Suspense>
  );
}
```

Code splitting детально — [21-code-splitting.md](21-code-splitting.md).

---

## MSW и архитектура

`src/mocks/` — **не feature**. Handlers импортируют те же types из `api/types/`, чтобы mock совпадал с client:

```typescript
// mocks/handlers.ts
import type { Paginated, Product } from "@/api/types/product";
```

Дублировать тип Product в mocks — типичная ошибка drift.

---

## Сравнение с react-basic capstone

| react-basic | react-intermediate |
|-------------|-------------------|
| `features/catalog`, `cart` | `auth`, `products` |
| `api/items.ts` | `api/client.ts` + types |
| публичные routes | protected + login |
| один backend :8090 | Django :8092 |

Миграция mindset, не copy-paste папок.

---

## Типичные ошибки

1. **Hooks в `components/` без domain** — `useProducts` должен быть в `features/products/hooks/`.

2. **Fetch в JSX** — `useEffect` + fetch в таблице вместо hook + Query ([06-query-advanced.md](06-query-advanced.md)).

3. **Circular import auth ↔ api** — refresh через injected `getAccessToken()`, не import AuthContext в client.

4. **God `App.tsx`** — routes и providers в `app/`.

5. **Barrel re-export всего** — public API feature должен быть минимальным.

6. **Shared/feature confusion** — `ProductFilters` не в `components/ui`.

---

## Чек-лист

- [ ] Можете нарисовать дерево `src/` admin SPA
- [ ] Знаете dependency rule между слоями
- [ ] Понимаете colocation vs shared
- [ ] Знаете, где types, client, mocks
- [ ] Готовы собрать скелет в [03-lab-scaffold.md](03-lab-scaffold.md)

## Далее

Следующий урок: [03. Лаба: скелет Admin SPA](03-lab-scaffold.md).
