# 11. Protected routes, roles, redirect after login

## Real-world scenario

QA ticket: "I opened `/products` in incognito — I see the table for a second, then a 401." "I logged in as admin, logged out — the back button shows products." "Staff without the admin role sees the Delete button — the backend returns 403, bad UX."

The AuthProvider ([10-auth-context.md](10-auth-context.md)) knows `isAuthenticated`, but the **Router** doesn't block routes. We need a `ProtectedRoute`, a redirect to `/login` with a return URL, and an optional role guard — the pattern from the react-basic Router [23-react-router.md](../react-basic/23-react-router.md), extended for admin.

## What you'll learn

- The `ProtectedRoute` wrapper component.
- Redirect to `/login` + `location.state.from`.
- Bootstrap loading gate — don't flash protected content.
- Role-based UI (not a security boundary).
- A guest-only route for the login page.

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
    return <p aria-busy="true">Checking the session…</p>;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }

  if (roles && user && !roles.includes(user.role)) {
    return (
      <div role="alert">
        <p>Insufficient permissions.</p>
      </div>
    );
  }

  return children;
}
```

The **loading gate** is critical — without it an anonymous user sees a flash of children before the redirect.

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

  if (status === "loading") return <p>Checking…</p>;
  if (isAuthenticated) return <Navigate to={from} replace />;
  return children;
}
```

A logged-in user on `/login` → redirect to products.

---

## Redirect after login

The LoginForm from [10-auth-context.md](10-auth-context.md):

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

## Role-based UI (a client hint)

```tsx
function ProductRowActions({ product }: { product: Product }) {
  const { user } = useAuth();
  const canDelete = user?.role === "admin";

  return (
    <td>
      {canDelete && (
        <button type="button" onClick={() => deleteProduct(product.id)}>
          Delete
        </button>
      )}
    </td>
  );
}
```

The backend **must** return 403 if staff deletes — hiding in the UI is convenience only ([08-jwt-basics.md](08-jwt-basics.md)).

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

An anonymous user on `/` → layout → index → `/products` → ProtectedRoute → `/login`. Alternative: an index route inside ProtectedRoute or a public landing.

---

## Lazy routes + ProtectedRoute

```tsx
const ProductsPage = lazy(() => import("@/pages/ProductsPage"));

<Route
  path="products"
  element={
    <ProtectedRoute>
      <Suspense fallback={<p>Loading…</p>}>
        <ProductsPage />
      </Suspense>
    </ProtectedRoute>
  }
/>
```

Suspense **inside** or **outside** ProtectedRoute — both are fine; the auth loading gate is separate from the chunk load ([21-code-splitting.md](21-code-splitting.md)).

---

## Logout and history

After logout:

```tsx
const logout = () => {
  authLogout();
  navigate("/login", { replace: true });
};
```

`replace: true` — the back button won't return to a protected page with a stale Query cache (already cleared in [10-auth-context.md](10-auth-context.md)).

---

## 401 from the API vs a route guard

| Situation | Route guard | API |
|-----------|-------------|-----|
| No token | redirect login | 401 |
| Expired access | still "authenticated" until refresh fails | 401 → refresh |
| Wrong role UI | hide button | 403 |

A route guard doesn't replace the refresh flow ([12-refresh-flow.md](12-refresh-flow.md)).

---

## MSW auth testing

With `VITE_ENABLE_MSW=true`:

- Wrong password → 401 login form error.
- Protected `/products` without login → redirect.
- Login `admin@shop.local` → access to products.

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

## Common mistakes

1. **No loading gate** — a flash of protected UI.

2. **Navigate without state.from** — after login always home, deep link lost.

3. **Role check only on the client** — security theater.

4. **ProtectedRoute below Routes without a layout** — broken Outlet.

5. **Double redirect loop** — GuestRoute + ProtectedRoute misconfigured on the same path.

6. **isAuthenticated true but user null after refresh** — bootstrap incomplete; show a generic label or fetch /me.

---

## Checklist

- [ ] ProtectedRoute: loading, anonymous, roles
- [ ] GuestRoute on `/login`
- [ ] Login redirect to `state.from`
- [ ] Logout replaces history
- [ ] Role UI hides forbidden actions
- [ ] You understand the diff between a route guard and an API 403

## Next

Next lesson: [12. Refresh flow: queue, race, logout cascade](12-refresh-flow.md).
