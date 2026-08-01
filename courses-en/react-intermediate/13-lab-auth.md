# 13. Lab: login and a guarded section

## A scenario from the field

Ticket **SHOP-320**: "Lock admin products behind login. Credentials: Django superuser or MSW mock. Acceptance: incognito → redirect to login; successful login → products; logout → login; F5 on products with a valid refresh — we stay; expired access — silent refresh." This is the capstone for the **auth block** 08–12 before error boundaries.

**Time:** ~65–80 minutes.

## What you'll learn

- End-to-end auth vertical slice.
- LoginForm + ProtectedRoute + tokenStore + refresh queue.
- MSW login/refresh handlers.
- Manual QA checklist for auth flows.

---

## The task

Add a **complete auth flow** to `react-intermediate/examples`:

1. `tokenStore`, `setupApiAuth`, `refreshQueue`.
2. `AuthProvider`, `useAuth`, `LoginForm`.
3. `ProtectedRoute`, `GuestRoute`.
4. API client with 401 → refresh → retry (GET).
5. `/products` for authenticated users only.
6. MSW: login + refresh handlers.
7. Header: email + logout.

Assumes the products page from [07-lab-django-products.md](07-lab-django-products.md) is already in place.

---

## Setup

```bash
cd courses/react-intermediate/examples
npm install
```

`.env.local`:

```env
VITE_ENABLE_MSW=true
```

Or Django on :8092 with JWT endpoints — see [`deploy/django`](../../deploy/django/README.md).

Mock credentials: **`admin@shop.local`** / **`admin`**.

---

## Steps

### Step 1. tokenStore + setupApiAuth

Implement from [09-token-storage.md](09-token-storage.md):

- `features/auth/tokenStore.ts`
- `app/setupApiAuth.ts` → `setAccessTokenGetter`
- Call `setupApiAuth()` in `main.tsx` before render

### Step 2. refreshQueue

From [12-refresh-flow.md](12-refresh-flow.md):

- `features/auth/refreshQueue.ts`
- raw `fetch` to `/api/v1/auth/refresh/` (without the interceptor loop)

### Step 3. Extend api/client.ts

- Import `tokenStore`, `refreshAccessToken`
- 401 handler with retry for GET
- `setOnAuthFailure` export

### Step 4. AuthProvider

From [10-auth-context.md](10-auth-context.md):

- login mutation
- logout + `queryClient.clear()`
- bootstrap refresh on mount
- register `setOnAuthFailure` → logout + navigate

Update `app/providers.tsx`:

```tsx
<QueryClientProvider client={queryClient}>
  <AuthProvider>
    <BrowserRouter>{children}</BrowserRouter>
  </AuthProvider>
</QueryClientProvider>
```

### Step 5. LoginForm + LoginPage

```tsx
// pages/LoginPage.tsx
import { LoginForm } from "@/features/auth/components/LoginForm";

export default function LoginPage() {
  return (
    <section>
      <h1>Admin Login</h1>
      <LoginForm />
    </section>
  );
}
```

LoginForm — as in [10-auth-context.md](10-auth-context.md), with redirect to `state.from`.

### Step 6. ProtectedRoute + GuestRoute

From [11-protected-routes.md](11-protected-routes.md):

- loading gate
- `Navigate` with `state.from`
- optional `roles={['admin']}`

### Step 7. Update routes

```tsx
<Route path="login" element={<GuestRoute><LoginPage /></GuestRoute>} />
<Route
  path="products"
  element={
    <ProtectedRoute>
      <ProductsPage />
    </ProtectedRoute>
  }
/>
```

### Step 8. useProductsQuery enabled

```typescript
enabled: isAuthenticated,
```

### Step 9. MSW handlers

Extend [`handlers.ts`](examples/src/mocks/handlers.ts):

```typescript
http.post("/api/v1/auth/refresh/", async ({ request }) => {
  const body = (await request.json()) as { refresh: string };
  if (body.refresh === "mock-refresh-token") {
    return HttpResponse.json({ access: "mock-access-token-v2" });
  }
  return HttpResponse.json({ detail: "Invalid token" }, { status: 401 });
}),
```

Optional: make products GET return 401 without an `Authorization` header — a check on the interceptor.

### Step 10. AppLayout header auth

```tsx
import { useAuth } from "@/features/auth";
import { Link, useNavigate } from "react-router-dom";

function HeaderAuth() {
  const { isAuthenticated, user, logout } = useAuth();
  const navigate = useNavigate();

  if (!isAuthenticated) {
    return <Link to="/login">Login</Link>;
  }

  return (
    <>
      <span>{user?.email ?? "Admin"}</span>
      {" · "}
      <button
        type="button"
        onClick={() => {
          logout();
          navigate("/login", { replace: true });
        }}
      >
        Log out
      </button>
    </>
  );
}
```

### Step 11. Manual QA matrix

| # | Steps | Expected |
|---|-------|----------|
| 1 | Incognito → `/products` | Redirect to `/login`, `from=/products` |
| 2 | Login with wrong password | Error message, stay on login |
| 3 | Login admin@shop.local / admin | Redirect to `/products`, table loads |
| 4 | Copy URL, new tab | Login required (no refresh) or session persists if sessionStorage |
| 5 | Logout | `/login`, back → no products |
| 6 | Login → DevTools → delete access from memory* | Next fetch refreshes or logs out |
| 7 | `npm run typecheck` | 0 errors |

\* simulate by calling a `tokenStore` debug method that clears just the access token — advanced.

---

## Success criteria

- [ ] `AuthProvider` in the providers tree inside QueryClient
- [ ] `/products` wrapped in `ProtectedRoute` with a loading gate
- [ ] `/login` wrapped in `GuestRoute`
- [ ] Login success stores tokens + user; redirects to `from`
- [ ] Logout clears tokenStore + Query cache
- [ ] API client attaches Bearer access; 401 triggers refresh (GET)
- [ ] Failed refresh → logout cascade
- [ ] MSW login + refresh work with `VITE_ENABLE_MSW=true`
- [ ] Products query doesn't fire before authenticated
- [ ] Header shows user email and a logout button
- [ ] `features/auth/index.ts` exports the public API

---

## Common mistakes

1. **Products visible before the auth check** — missing loading state in ProtectedRoute.

2. **Refresh loop** — the refresh endpoint goes through the same 401 interceptor.

3. **Login succeeds but products return 401** — forgot `setAccessTokenGetter` or wrong token.

4. **Missing GuestRoute** — a logged-in user gets stuck on the login page without a redirect.

5. **MSW bypassed on auth** — handler path mismatch, e.g. `/auth/login/` trailing slash.

6. **queryClient not cleared on logout** — previous user's catalog flashes briefly.

---

## Connection to the rest of the course

| Lesson | Connection |
|------|-------|
| [14-error-boundaries.md](14-error-boundaries.md) | render errors vs auth errors |
| [27-lab-msw.md](27-lab-msw.md) | extended MSW scenarios |
| [31-lab-crud.md](31-lab-crud.md) | authenticated mutations |
| [39-capstone.md](39-capstone.md) | full Admin SPA |

---

## Checklist

- [ ] Auth block 08–12 integrated hands-on
- [ ] QA matrix passed
- [ ] You understand the diff between MSW and Django JWT
- [ ] Ready for error boundaries [14-error-boundaries.md](14-error-boundaries.md)

## Next

Next lesson: [14. Error boundaries: what they catch and what they don't](14-error-boundaries.md).
