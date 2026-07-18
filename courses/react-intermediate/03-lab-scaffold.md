# 03. Лаба: скелет Admin SPA

## Сценарий с работы

Ticket **SHOP-302**: «Создать репозиторий admin-frontend: routing, providers, пустые страницы login/products, feature folders по ARCH-12». Backend ещё не готов — UI должен **собираться и открываться** на :5174. Это первая hands-on лаба react-intermediate: вы превращаете стартовый [`examples/`](examples/package.json) в **каркас** по [02-architecture.md](02-architecture.md).

**Время:** ~50–65 минут.

## Что вы узнаете

- Создание folder structure admin SPA.
- `AppProviders`, `AppRoutes`, thin pages.
- Placeholder UI и навигация.
- Подготовка к API и auth урокам 04–13.

---

## Задача

Собрать **скелет** Admin SPA в `courses/react-intermediate/examples`:

1. Feature folders `auth/` и `products/` (пока без логики).
2. `app/providers.tsx`, `app/routes.tsx`, `app/queryClient.ts`.
3. Страницы `LoginPage`, `ProductsPage`, `NotFoundPage`.
4. Layout с header и nav (login / products).
5. `npm run typecheck` и `npm run dev` без ошибок.

Backend **не** обязателен. MSW — опционально.

---

## Подготовка

```bash
cd courses/react-intermediate/examples
npm install
npm run dev   # http://localhost:5174
```

Убедитесь, что пройдены [00-environment.md](00-environment.md) и [02-architecture.md](02-architecture.md).

Целевое дерево после лабы:

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
      components/.gitkeep или placeholder
    products/
      index.ts
      components/ProductsPlaceholder.tsx
  components/ui/
    AppLayout.tsx
    Button.tsx
  main.tsx
```

---

## Шаги

### Шаг 1. queryClient

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

Как в react-basic [20-tanstack-query.md](../react-basic/20-tanstack-query.md).

### Шаг 2. AppLayout

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

### Шаг 3. Thin pages

```tsx
// pages/LoginPage.tsx
export default function LoginPage() {
  return (
    <section>
      <h1>Login</h1>
      <p>Форма авторизации — в лабе [13-lab-auth.md](13-lab-auth.md).</p>
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
  return <p>Таблица каталога — после [07-lab-django-products.md](07-lab-django-products.md).</p>;
}
```

```tsx
// pages/NotFoundPage.tsx
import { Link } from "react-router-dom";

export default function NotFoundPage() {
  return (
    <section>
      <h1>404</h1>
      <Link to="/products">К products</Link>
    </section>
  );
}
```

### Шаг 4. routes.tsx

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

### Шаг 5. providers.tsx

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

`AuthProvider` добавите в [10-auth-context.md](10-auth-context.md).

### Шаг 6. App.tsx и main.tsx

```tsx
// app/App.tsx
import { AppRoutes } from "./routes";

export function App() {
  return <AppRoutes />;
}
```

```tsx
// main.tsx — упростите render
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

Уберите дублирующий `BrowserRouter` из старого `main.tsx`.

### Шаг 7. Feature barrels

```typescript
// features/auth/index.ts
// Public API — заполните в уроке 10
export {};

// features/products/index.ts
export { ProductsPlaceholder } from "./components/ProductsPlaceholder";
```

### Шаг 8. Минимальные стили

В [`index.css`](examples/src/index.css) добавьте layout:

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

### Шаг 9. Проверка

```bash
npm run typecheck
npm run dev
```

- `/` → redirect `/products`
- `/login`, `/products` — контент
- `/unknown` → 404
- Header nav работает

---

## Критерии успеха

- [ ] Структура `app/`, `pages/`, `features/auth`, `features/products`, `components/ui/` создана
- [ ] `main.tsx` использует `AppProviders`; один `BrowserRouter`
- [ ] Routes: `/login`, `/products`, `*`, index → `/products`
- [ ] `AppLayout` с nav и `Outlet`
- [ ] `npm run typecheck` — 0 errors
- [ ] Dev-сервер на **5174** без runtime errors в Console
- [ ] Нет fetch/auth логики — только scaffold (это следующие уроки)

---

## Типичные ошибки

1. **Два BrowserRouter** — в `main.tsx` и `providers.tsx`.

2. **Default export pages** — `lazy()` требует default; named — ok без lazy.

3. **Забыли `<Outlet />`** — layout без children routes.

4. **Alias `@/`** — путь должен резолвиться в tsconfig + vite.

5. **Сразу AuthGuard** — protected routes в [11-protected-routes.md](11-protected-routes.md).

---

## Чек-лист

- [ ] Скелет совпадает с [02-architecture.md](02-architecture.md)
- [ ] Понимаете, куда добавится `api/client.ts` ([04-api-client.md](04-api-client.md))
- [ ] Proxy `/api` → :8092 готов к Django ([00-environment.md](00-environment.md))

## Далее

Следующий урок: [04. Typed API client: interceptors, ApiError](04-api-client.md).
