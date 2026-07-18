# 11. Protected routes, roles, redirect после login

## Сценарий с работы

QA ticket: «Открыл `/products` в incognito — вижу таблицу секунду, потом 401». «Зашёл как admin, вышел — back button показывает products». «Staff без role admin видит кнопку Delete — backend 403, UX плохой».

AuthProvider ([10-auth-context.md](10-auth-context.md)) знает `isAuthenticated`, но **Router** не блокирует routes. Нужны `ProtectedRoute`, redirect на `/login` с return URL, optional role guard — паттерн из react-basic Router [23-react-router.md](../react-basic/23-react-router.md), расширенный для admin.

## Что вы узнаете

- `ProtectedRoute` wrapper component.
- Redirect `/login` + `location.state.from`.
- Bootstrap loading gate — не flash protected content.
- Role-based UI (не security boundary).
- Guest-only route для login page.

---

## ProtectedRoute

```tsx
// features/auth/components/ProtectedRoute.tsx
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

type Props = {
  children: React.ReactNode;
  roles?: string[];
};

export function ProtectedRoute({ children, roles }: Props) {
  const { status, isAuthenticated, user } = useAuth();
  const location = useLocation();

  if (status === "idle" || status === "loading") {
    return <p aria-busy="true">Проверка сессии…</p>;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }

  if (roles && user && !roles.includes(user.role)) {
    return (
      <div role="alert">
        <p>Недостаточно прав.</p>
      </div>
    );
  }

  return children;
}
```

**Loading gate** критичен — без него anonymous user видит flash children до redirect.

---

## Routes config

```tsx
// app/routes.tsx
import { ProtectedRoute } from "@/features/auth/components/ProtectedRoute";
import LoginPage from "@/pages/LoginPage";
import ProductsPage from "@/pages/ProductsPage";

<Route path="login" element={<GuestRoute><LoginPage /></GuestRoute>} />
<Route
  path="products"
  element={
    <ProtectedRoute roles={["admin", "staff"]}>
      <ProductsPage />
    </ProtectedRoute>
  }
/>
```

---

## GuestRoute (inverse)

```tsx
// features/auth/components/GuestRoute.tsx
export function GuestRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, status } = useAuth();
  const location = useLocation();
  const from = (location.state as { from?: string })?.from ?? "/products";

  if (status === "loading") return <p>Проверка…</p>;
  if (isAuthenticated) return <Navigate to={from} replace />;
  return children;
}
```

Logged-in user на `/login` → redirect на products.

---

## Redirect after login

LoginForm из [10-auth-context.md](10-auth-context.md):

```tsx
const from = (location.state as { from?: string })?.from ?? "/products";
await login(email, password);
navigate(from, { replace: true });
```

Flow:

```text
User opens /products (incognito)
  → ProtectedRoute → Navigate /login state.from=/products
User logs in
  → navigate /products
```

---

## Role-based UI (client hint)

```tsx
function ProductRowActions({ product }: { product: Product }) {
  const { user } = useAuth();
  const canDelete = user?.role === "admin";

  return (
    <td>
      {canDelete && (
        <button type="button" onClick={() => deleteProduct(product.id)}>
          Удалить
        </button>
      )}
    </td>
  );
}
```

Backend **must** return 403 if staff deletes — UI hide — convenience only ([08-jwt-basics.md](08-jwt-basics.md)).

| role | products read | products delete |
|------|---------------|-----------------|
| admin | ✓ | ✓ |
| staff | ✓ | ✗ |
| anonymous | redirect | redirect |

---

## Index redirect

```tsx
<Route index element={<Navigate to="/products" replace />} />
```

Anonymous user on `/` → layout → index → `/products` → ProtectedRoute → `/login`. Alternative: index route inside ProtectedRoute or public landing.

---

## Lazy routes + ProtectedRoute

```tsx
const ProductsPage = lazy(() => import("@/pages/ProductsPage"));

<Route
  path="products"
  element={
    <ProtectedRoute>
      <Suspense fallback={<p>Загрузка…</p>}>
        <ProductsPage />
      </Suspense>
    </ProtectedRoute>
  }
/>
```

Suspense **inside** or **outside** ProtectedRoute — оба ok; loading gate auth отдельно от chunk load ([21-code-splitting.md](21-code-splitting.md)).

---

## Logout and history

После logout:

```tsx
const logout = () => {
  authLogout();
  navigate("/login", { replace: true });
};
```

`replace: true` — back button не вернёт на protected page с stale Query cache (already cleared in [10-auth-context.md](10-auth-context.md)).

---

## 401 from API vs route guard

| Situation | Route guard | API |
|-----------|-------------|-----|
| No token | redirect login | 401 |
| Expired access | still "authenticated" until refresh fail | 401 → refresh |
| Wrong role UI | hide button | 403 |

Route guard не заменяет refresh flow ([12-refresh-flow.md](12-refresh-flow.md)).

---

## MSW auth testing

With `VITE_ENABLE_MSW=true`:

- Wrong password → 401 login form error.
- Protected `/products` without login → redirect.
- Login `admin@shop.local` → access products.

---

## Nested admin routes (preview)

```tsx
<Route
  path="admin"
  element={
    <ProtectedRoute roles={["admin"]}>
      <AdminLayout />
    </ProtectedRoute>
  }
>
  <Route path="products" element={<ProductsPage />} />
  <Route path="categories" element={<CategoriesPage />} />
</Route>
```

Nested layout — [24-nested-routes.md](../react-basic/24-nested-routes.md).

---

## Типичные ошибки

1. **No loading gate** — flash protected UI.

2. **Navigate without state.from** — после login всегда home, теряем deep link.

3. **Role check only on client** — security theater.

4. **ProtectedRoute below Routes without layout** — broken Outlet.

5. **Double redirect loop** — GuestRoute + ProtectedRoute misconfigured on same path.

6. **isAuthenticated true but user null after refresh** — bootstrap incomplete; show generic label or fetch /me.

---

## Чек-лист

- [ ] ProtectedRoute: loading, anonymous, roles
- [ ] GuestRoute на `/login`
- [ ] Login redirect на `state.from`
- [ ] Logout replace history
- [ ] Role UI скрывает forbidden actions
- [ ] Понимаете diff route guard vs API 403

## Далее

Следующий урок: [12. Refresh flow: очередь, race, logout cascade](12-refresh-flow.md).
