# 03. Lab: Admin SPA skeleton

## Real-world scenario

Ticket **SHOP-302**: "Create the admin-frontend repository: routing, providers, empty login/products pages, feature folders per ARCH-12." The backend isn't ready yet — the UI must **build and open** on :5174. This is the first hands-on lab of react-intermediate: you turn the starter [`examples/`](examples/package.json) into a **skeleton** following [02-architecture.md](02-architecture.md).

**Time:** ~50–65 minutes.

## What you'll learn

- Creating the folder structure of the admin SPA.
- `AppProviders`, `AppRoutes`, thin pages.
- Placeholder UI and navigation.
- Preparing for the API and auth lessons 04–13.

---

## Task

Assemble the **skeleton** of the Admin SPA in `courses/react-intermediate/examples`:

1. Feature folders `auth/` and `products/` (no logic yet).
2. `app/providers.tsx`, `app/routes.tsx`, `app/queryClient.ts`.
3. Pages `LoginPage`, `ProductsPage`, `NotFoundPage`.
4. A layout with a header and nav (login / products).
5. `npm run typecheck` and `npm run dev` with no errors.

The backend is **not** required. MSW — optional.

---

## Setup

```bash
cd courses/react-intermediate/examples
npm install
npm run dev   # http://localhost:5174
```

Make sure you've completed [00-environment.md](00-environment.md) and [02-architecture.md](02-architecture.md).

The target tree after the lab:

```text
src/
  app/
    App.tsx
    providers.tsx
    routes.tsx
    queryClient.ts
  pages/
    LoginPage.tsx
    ProductsPage.tsx
    NotFoundPage.tsx
  features/
    auth/
      index.ts
      components/.gitkeep or placeholder
    products/
      index.ts
      components/ProductsPlaceholder.tsx
  components/ui/
    AppLayout.tsx
    Button.tsx
  main.tsx
```

---

## Steps

### Step 1. queryClient

```typescript
// app/queryClient.ts
import { QueryClient } from "@tanstack/react-query";

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      retry: 1,
    },
  },
});
```

As in react-basic [20-tanstack-query.md](../react-basic/20-tanstack-query.md).

### Step 2. AppLayout

```tsx
// components/ui/AppLayout.tsx
import { Link, Outlet } from "react-router-dom";

export function AppLayout() {
  return (
    <div className="app-shell">
      <header>
        <strong>Shop Admin</strong>
        <nav>
          <Link to="/login">Login</Link>
          {" · "}
          <Link to="/products">Products</Link>
        </nav>
      </header>
      <main>
        <Outlet />
      </main>
    </div>
  );
}
```

`Outlet` — nested routes ([24-nested-routes.md](../react-basic/24-nested-routes.md)).

### Step 3. Thin pages

```tsx
// pages/LoginPage.tsx
export default function LoginPage() {
  return (
    <section>
      <h1>Login</h1>
      <p>The login form — in the lab [13-lab-auth.md](13-lab-auth.md).</p>
    </section>
  );
}
```

```tsx
// pages/ProductsPage.tsx
import { ProductsPlaceholder } from "@/features/products/components/ProductsPlaceholder";

export default function ProductsPage() {
  return (
    <section>
      <h1>Products</h1>
      <ProductsPlaceholder />
    </section>
  );
}
```

```tsx
// features/products/components/ProductsPlaceholder.tsx
export function ProductsPlaceholder() {
  return <p>The catalog table — after [07-lab-django-products.md](07-lab-django-products.md).</p>;
}
```

```tsx
// pages/NotFoundPage.tsx
import { Link } from "react-router-dom";

export default function NotFoundPage() {
  return (
    <section>
      <h1>404</h1>
      <Link to="/products">To products</Link>
    </section>
  );
}
```

### Step 4. routes.tsx

```tsx
// app/routes.tsx
import { Route, Routes, Navigate } from "react-router-dom";
import { AppLayout } from "@/components/ui/AppLayout";
import LoginPage from "@/pages/LoginPage";
import ProductsPage from "@/pages/ProductsPage";
import NotFoundPage from "@/pages/NotFoundPage";

export function AppRoutes() {
  return (
    <Routes>
      <Route element={<AppLayout />}>
        <Route index element={<Navigate to="/products" replace />} />
        <Route path="login" element={<LoginPage />} />
        <Route path="products" element={<ProductsPage />} />
        <Route path="*" element={<NotFoundPage />} />
      </Route>
    </Routes>
  );
}
```

### Step 5. providers.tsx

```tsx
// app/providers.tsx
import { QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter } from "react-router-dom";
import { queryClient } from "./queryClient";

export function AppProviders({ children }: { children: React.ReactNode }) {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>{children}</BrowserRouter>
    </QueryClientProvider>
  );
}
```

You'll add `AuthProvider` in [10-auth-context.md](10-auth-context.md).

### Step 6. App.tsx and main.tsx

```tsx
// app/App.tsx
import { AppRoutes } from "./routes";

export function App() {
  return <AppRoutes />;
}
```

```tsx
// main.tsx — simplify the render
import { AppProviders } from "./app/providers";
import { App } from "./app/App";

enableMocking().then(() => {
  createRoot(document.getElementById("root")!).render(
    <StrictMode>
      <AppProviders>
        <App />
      </AppProviders>
    </StrictMode>,
  );
});
```

Remove the duplicate `BrowserRouter` from the old `main.tsx`.

### Step 7. Feature barrels

```typescript
// features/auth/index.ts
// Public API — fill in during lesson 10
export {};

// features/products/index.ts
export { ProductsPlaceholder } from "./components/ProductsPlaceholder";
```

### Step 8. Minimal styles

In [`index.css`](examples/src/index.css) add the layout:

```css
.app-shell header {
  display: flex;
  justify-content: space-between;
  padding: 1rem;
  border-bottom: 1px solid #ddd;
}
.app-shell main {
  padding: 1rem;
}
```

### Step 9. Verification

```bash
npm run typecheck
npm run dev
```

- `/` → redirect to `/products`
- `/login`, `/products` — content
- `/unknown` → 404
- Header nav works

---

## Success criteria

- [ ] The structure `app/`, `pages/`, `features/auth`, `features/products`, `components/ui/` is created
- [ ] `main.tsx` uses `AppProviders`; a single `BrowserRouter`
- [ ] Routes: `/login`, `/products`, `*`, index → `/products`
- [ ] `AppLayout` with nav and `Outlet`
- [ ] `npm run typecheck` — 0 errors
- [ ] Dev server on **5174** with no runtime errors in the Console
- [ ] No fetch/auth logic — only scaffold (those are the next lessons)

---

## Common mistakes

1. **Two BrowserRouters** — in `main.tsx` and `providers.tsx`.

2. **Default export pages** — `lazy()` requires a default; named — fine without lazy.

3. **Forgot `<Outlet />`** — a layout with no children routes.

4. **Alias `@/`** — the path must resolve in tsconfig + vite.

5. **AuthGuard right away** — protected routes are in [11-protected-routes.md](11-protected-routes.md).

---

## Checklist

- [ ] The skeleton matches [02-architecture.md](02-architecture.md)
- [ ] You understand where `api/client.ts` will be added ([04-api-client.md](04-api-client.md))
- [ ] The proxy `/api` → :8092 is ready for Django ([00-environment.md](00-environment.md))

## Next

Next lesson: [04. Typed API client: interceptors, ApiError](04-api-client.md).
