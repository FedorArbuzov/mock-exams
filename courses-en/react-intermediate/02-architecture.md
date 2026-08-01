# 02. Architecture: features, layers, module boundaries

## Real-world scenario

Code review of the react-basic capstone lab. Senior: "`ProductCard` imports `useCart` from `features/cart`, but `CartDrawer` pulls `fetchItems` from `api/` directly in JSX — **the boundaries are blurred**. Before an admin SPA of 40+ files we need a scheme: what goes in `features/`, what in `api/`, and who is allowed to import whom." Ticket **ARCH-12**: lock in a feature-based layout for react-intermediate.

Without rules, a month later `src/` turns into a "big ball of mud": circular imports, duplicated types, tests that mock half the app. This lesson is the **mock-exams admin SPA convention**, an extension of [35-project-structure.md](../react-basic/35-project-structure.md).

## What you'll learn

- **Feature folders** vs layer folders — a hybrid for admin.
- The target tree `react-intermediate/examples/src/`.
- Import rules: who can touch whom.
- Colocating hooks/components next to the domain.
- Barrel `index.ts` — when yes and when no.
- Where auth, the api client, and shared UI should live.

---

## The "everything in components/" problem

```text
src/components/
  LoginForm.tsx
  ProductsTable.tsx
  ProductFilters.tsx
  AuthGuard.tsx
  useProducts.ts      # a hook among the components
  api.ts              # fetch among the UI
```

Finding "where login is" — a grep across 80 files. Deleting the **products** feature — archaeology. TypeScript won't save you without **structural** boundaries.

---

## The target structure of the admin SPA

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

**pages/** — glue: layout + feature components. **features/** — business verticals. **api/** — HTTP, no JSX.

---

## Import rules (dependency rule)

```text
pages  →  features, components, api/types
features/*  →  api, components, hooks, lib
           ✗  other features directly (minimize)
components/ui  →  lib only
api  →  lib only (no React)
```

| From → To | features | api | components/ui |
|-----------|----------|-----|---------------|
| pages | ✓ | types only | ✓ |
| features/auth | ✓ (carefully) | ✓ | ✓ |
| features/products | ✓ (carefully) | ✓ | ✓ |
| api | ✗ | internal | ✗ |

**Cross-feature:** `products` doesn't import `LoginForm`. Need the user — `useAuth()` from `@/features/auth` via the **public** barrel.

**Violation:** `api/client.ts` imports `useAuth` for refresh — acceptable only if the client is **not a React hook** but uses callback injection ([12-refresh-flow.md](12-refresh-flow.md)).

---

## Colocation vs shared

**Colocation** — code next to its only consumer:

```text
features/products/components/ProductRowActions.tsx
```

**Shared** — a second feature uses the same UI:

```text
components/ui/Button.tsx
```

Rule: **Rule of three** — don't move things into `components/` until the third repetition. `DataTableShell` can stay in `products/` until `categories/` appears.

---

## A feature's public API via index.ts

```typescript
// features/auth/index.ts
export { AuthProvider, useAuth } from "./context/AuthContext";
export type { User, AuthState } from "./context/AuthContext";
```

Consumer:

```typescript
import { useAuth } from "@/features/auth";
```

**Don't** export internals:

```typescript
// ✗ import { AuthContext } from "@/features/auth/context/AuthContext";
```

A barrel simplifies refactoring inside a feature. The downside — tree-shaking with a huge barrel; for the mock-exams admin SPA that's fine.

---

## The api/ layer: client and types

[`04-api-client.md`](04-api-client.md) — `api<T>()`, `ApiError`, interceptors. Types live **nearby**, not in every component:

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

## app/providers.tsx — the composition root

Move the providers out of `main.tsx` for readability:

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

Order: **Query outside Auth** or the other way around — depends on whether you need Query inside login. Usually Query is on the outside; Auth is inside the Router ([10-auth-context.md](10-auth-context.md)).

---

## routes.tsx and lazy pages

```tsx
// app/routes.tsx
import { lazy, Suspense } from "react";
import { Routes, Route } from "react-router-dom";
import { ProtectedRoute } from "@/features/auth/components/ProtectedRoute";

const LoginPage = lazy(() => import("@/pages/LoginPage"));
const ProductsPage = lazy(() => import("@/pages/ProductsPage"));

export function AppRoutes() {
  return (
    <Suspense fallback={<p>Loading…</p>}>
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

Code splitting in detail — [21-code-splitting.md](21-code-splitting.md).

---

## MSW and architecture

`src/mocks/` is **not a feature**. Handlers import the same types from `api/types/` so that the mock matches the client:

```typescript
// mocks/handlers.ts
import type { Paginated, Product } from "@/api/types/product";
```

Duplicating the Product type in mocks is a classic drift mistake.

---

## Comparison with the react-basic capstone

| react-basic | react-intermediate |
|-------------|-------------------|
| `features/catalog`, `cart` | `auth`, `products` |
| `api/items.ts` | `api/client.ts` + types |
| public routes | protected + login |
| single backend :8090 | Django :8092 |

Migrate the mindset, don't copy-paste folders.

---

## Common mistakes

1. **Hooks in `components/` without a domain** — `useProducts` should be in `features/products/hooks/`.

2. **Fetch in JSX** — `useEffect` + fetch in the table instead of a hook + Query ([06-query-advanced.md](06-query-advanced.md)).

3. **Circular import auth ↔ api** — refresh via an injected `getAccessToken()`, not by importing AuthContext into the client.

4. **God `App.tsx`** — routes and providers belong in `app/`.

5. **Barrel re-exporting everything** — a feature's public API should be minimal.

6. **Shared/feature confusion** — `ProductFilters` doesn't belong in `components/ui`.

---

## Checklist

- [ ] You can draw the `src/` tree of the admin SPA
- [ ] You know the dependency rule between layers
- [ ] You understand colocation vs shared
- [ ] You know where types, client, and mocks live
- [ ] You're ready to assemble the skeleton in [03-lab-scaffold.md](03-lab-scaffold.md)

## Next

Next lesson: [03. Lab: Admin SPA skeleton](03-lab-scaffold.md).
