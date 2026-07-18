# 13. Лаба: login и guarded раздел

## Сценарий с работы

Ticket **SHOP-320**: «Закрыть admin products за login. Credentials: Django superuser или MSW mock. Acceptance: incognito → redirect login; успешный login → products; logout → login; F5 на products с valid refresh — остаёмся; expired access — silent refresh». Это capstone **auth block** 08–12 перед error boundaries.

**Время:** ~65–80 минут.

## Что вы узнаете

- End-to-end auth vertical slice.
- LoginForm + ProtectedRoute + tokenStore + refresh queue.
- MSW handlers login/refresh.
- Manual QA checklist auth flows.

---

## Задача

Добавить **полный auth flow** в `react-intermediate/examples`:

1. `tokenStore`, `setupApiAuth`, `refreshQueue`.
2. `AuthProvider`, `useAuth`, `LoginForm`.
3. `ProtectedRoute`, `GuestRoute`.
4. API client с 401 → refresh → retry (GET).
5. `/products` только для authenticated users.
6. MSW: login + refresh handlers.
7. Header: email + logout.

Предполагается готовая products page из [07-lab-django-products.md](07-lab-django-products.md).

---

## Подготовка

```bash
cd courses/react-intermediate/examples
npm install
```

`.env.local`:

```env
VITE_ENABLE_MSW=true
```

Или Django :8092 с JWT endpoints — см. [`deploy/django`](../../deploy/django/README.md).

Mock credentials: **`admin@shop.local`** / **`admin`**.

---

## Шаги

### Шаг 1. tokenStore + setupApiAuth

Реализуйте из [09-token-storage.md](09-token-storage.md):

- `features/auth/tokenStore.ts`
- `app/setupApiAuth.ts` → `setAccessTokenGetter`
- Вызов `setupApiAuth()` в `main.tsx` до render

### Шаг 2. refreshQueue

Из [12-refresh-flow.md](12-refresh-flow.md):

- `features/auth/refreshQueue.ts`
- raw `fetch` на `/api/v1/auth/refresh/` (без interceptor loop)

### Шаг 3. Extend api/client.ts

- Import `tokenStore`, `refreshAccessToken`
- 401 handler с retry для GET
- `setOnAuthFailure` export

### Шаг 4. AuthProvider

Из [10-auth-context.md](10-auth-context.md):

- login mutation
- logout + `queryClient.clear()`
- bootstrap refresh on mount
- register `setOnAuthFailure` → logout + navigate

Обновите `app/providers.tsx`:

```tsx
<QueryClientProvider client={queryClient}>
  <AuthProvider>
    <BrowserRouter>{children}</BrowserRouter>
  </AuthProvider>
</QueryClientProvider>
```

### Шаг 5. LoginForm + LoginPage

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

LoginForm — [10-auth-context.md](10-auth-context.md) с redirect `state.from`.

### Шаг 6. ProtectedRoute + GuestRoute

Из [11-protected-routes.md](11-protected-routes.md):

- loading gate
- `Navigate` с `state.from`
- optional `roles={['admin']}`

### Шаг 7. Update routes

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

### Шаг 8. useProductsQuery enabled

```typescript
enabled: isAuthenticated,
```

### Шаг 9. MSW handlers

Дополните [`handlers.ts`](examples/src/mocks/handlers.ts):

```typescript
http.post("/api/v1/auth/refresh/", async ({ request }) => {
  const body = (await request.json()) as { refresh: string };
  if (body.refresh === "mock-refresh-token") {
    return HttpResponse.json({ access: "mock-access-token-v2" });
  }
  return HttpResponse.json({ detail: "Invalid token" }, { status: 401 });
}),
```

Optional: products GET returns 401 if no `Authorization` — проверка interceptor.

### Шаг 10. AppLayout header auth

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
        Выйти
      </button>
    </>
  );
}
```

### Шаг 11. Manual QA matrix

| # | Steps | Expected |
|---|-------|----------|
| 1 | Incognito → `/products` | Redirect `/login`, `from=/products` |
| 2 | Login wrong password | Error message, stay on login |
| 3 | Login admin@shop.local / admin | Redirect `/products`, table loads |
| 4 | Copy URL, new tab | Login required (no refresh) or session if sessionStorage |
| 5 | Logout | `/login`, back → no products |
| 6 | Login → DevTools → delete access from memory* | Next fetch refreshes or logout |
| 7 | `npm run typecheck` | 0 errors |

\* simulate by calling `tokenStore` debug clear access only — advanced.

---

## Критерии успеха

- [ ] `AuthProvider` in providers tree inside QueryClient
- [ ] `/products` wrapped in `ProtectedRoute` with loading gate
- [ ] `/login` wrapped in `GuestRoute`
- [ ] Login success stores tokens + user; redirects to `from`
- [ ] Logout clears tokenStore + Query cache
- [ ] API client attaches Bearer access; 401 triggers refresh (GET)
- [ ] Failed refresh → logout cascade
- [ ] MSW login + refresh work with `VITE_ENABLE_MSW=true`
- [ ] Products query not firing before authenticated
- [ ] Header shows user email and logout button
- [ ] `features/auth/index.ts` exports public API

---

## Типичные ошибки

1. **Products visible before auth check** — missing loading in ProtectedRoute.

2. **Refresh loop** — refresh endpoint goes through same 401 interceptor.

3. **Login success but 401 on products** — forgot `setAccessTokenGetter` or wrong token.

4. **GuestRoute missing** — logged-in user stuck on login page without redirect.

5. **MSW bypass on auth** — handler path mismatch `/auth/login/` trailing slash.

6. **queryClient not cleared on logout** — previous user catalog flash.

---

## Связь с дальнейшим курсом

| Урок | Связь |
|------|-------|
| [14-error-boundaries.md](14-error-boundaries.md) | render errors vs auth errors |
| [27-lab-msw.md](27-lab-msw.md) | расширенные MSW scenarios |
| [31-lab-crud.md](31-lab-crud.md) | authenticated mutations |
| [39-capstone.md](39-capstone.md) | full Admin SPA |

---

## Чек-лист

- [ ] Auth block 08–12 integrated hands-on
- [ ] QA matrix пройден
- [ ] Понимаете diff MSW vs Django JWT
- [ ] Готовы к error boundaries [14-error-boundaries.md](14-error-boundaries.md)

## Далее

Следующий урок: [14. Error boundaries: что ловят и что нет](14-error-boundaries.md).
