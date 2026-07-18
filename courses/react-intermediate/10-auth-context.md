# 10. AuthProvider, useAuth, синхронизация с Query

## Сценарий с работы

Login form работает, tokens в `tokenStore` ([09-token-storage.md](09-token-storage.md)), но Header не знает user — prop drilling `user` через `AppLayout`. Review: «Сделайте AuthProvider по образцу Theme из react-basic [29-context.md](../react-basic/29-context.md), но **не** кладите catalog в Context».

Auth state — **client snapshot** (user, isAuthenticated); products остаются в Query. Этот урок — glue между login mutation, tokenStore и UI.

## Что вы узнаете

- `AuthProvider` + `useAuth` hook.
- State: `user`, `status`: idle | loading | authenticated | anonymous.
- Login/logout actions.
- `QueryClient` clear on logout.
- Bootstrap: silent refresh on app load.

---

## Auth state model

```typescript
// features/auth/context/authTypes.ts
import type { User } from "@/api/types/auth";

export type AuthStatus = "idle" | "loading" | "authenticated" | "anonymous";

export type AuthContextValue = {
  status: AuthStatus;
  user: User | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  isAuthenticated: boolean;
};
```

| status | UI |
|--------|-----|
| idle | initial |
| loading | bootstrap / login in flight |
| authenticated | user set |
| anonymous | logged out |

---

## AuthProvider implementation

```tsx
// features/auth/context/AuthContext.tsx
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/api/client";
import type { LoginResponse, User } from "@/api/types/auth";
import { tokenStore } from "../tokenStore";
import type { AuthContextValue, AuthStatus } from "./authTypes";

const AuthContext = createContext<AuthContextValue | null>(null);

async function loginRequest(email: string, password: string) {
  return api<LoginResponse>("/api/v1/auth/login/", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient();
  const [user, setUser] = useState<User | null>(null);
  const [status, setStatus] = useState<AuthStatus>("idle");

  const loginMutation = useMutation({
    mutationFn: ({ email, password }: { email: string; password: string }) =>
      loginRequest(email, password),
  });

  const login = useCallback(
    async (email: string, password: string) => {
      setStatus("loading");
      try {
        const data = await loginMutation.mutateAsync({ email, password });
        tokenStore.setTokens(data.access, data.refresh);
        setUser(data.user);
        setStatus("authenticated");
      } catch {
        setStatus("anonymous");
        throw new Error("Invalid credentials");
      }
    },
    [loginMutation],
  );

  const logout = useCallback(() => {
    tokenStore.clear();
    setUser(null);
    setStatus("anonymous");
    queryClient.clear();
  }, [queryClient]);

  // Bootstrap: try refresh if refresh token in store
  useEffect(() => {
    let cancelled = false;

    async function bootstrap() {
      const refresh = tokenStore.getRefresh();
      if (!refresh) {
        setStatus("anonymous");
        return;
      }
      setStatus("loading");
      try {
        const { access } = await api<{ access: string }>("/api/v1/auth/refresh/", {
          method: "POST",
          body: JSON.stringify({ refresh }),
        });
        if (cancelled) return;
        tokenStore.setAccess(access);
        // Ideal: GET /api/v1/auth/me/ — пока user unknown без второго endpoint
        setStatus("authenticated");
        // user остаётся null до re-login или /me — см. lab 13
      } catch {
        if (!cancelled) {
          tokenStore.clear();
          setStatus("anonymous");
        }
      }
    }

    bootstrap();
    return () => {
      cancelled = true;
    };
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      status,
      user,
      login,
      logout,
      isAuthenticated: status === "authenticated",
    }),
    [status, user, login, logout],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
```

MSW: добавьте handler `POST /api/v1/auth/refresh/` в [`handlers.ts`](examples/src/mocks/handlers.ts) для bootstrap.

---

## Providers order

```tsx
// app/providers.tsx
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

Query **outside** Auth — login mutation uses QueryClient; Auth uses `useQueryClient`.

---

## LoginForm consumer

```tsx
// features/auth/components/LoginForm.tsx
import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export function LoginForm() {
  const { login, status } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [error, setError] = useState<string | null>(null);

  const from = (location.state as { from?: string })?.from ?? "/products";

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    const fd = new FormData(e.currentTarget);
    const email = String(fd.get("email"));
    const password = String(fd.get("password"));
    try {
      await login(email, password);
      navigate(from, { replace: true });
    } catch {
      setError("Неверный email или пароль");
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      <input name="email" type="email" defaultValue="admin@shop.local" required />
      <input name="password" type="password" defaultValue="admin" required />
      {error && <p role="alert">{error}</p>}
      <button type="submit" disabled={status === "loading"}>
        {status === "loading" ? "Вход…" : "Войти"}
      </button>
    </form>
  );
}
```

Mock credentials documented in [00-environment.md](00-environment.md).

---

## Header with auth

```tsx
function HeaderAuth() {
  const { user, logout, isAuthenticated } = useAuth();
  if (!isAuthenticated) return <Link to="/login">Login</Link>;
  return (
    <>
      <span>{user?.email ?? "Admin"}</span>
      <button type="button" onClick={logout}>
        Выйти
      </button>
    </>
  );
}
```

---

## Query sync: enabled flag

```typescript
export function useProductsQuery(params: URLSearchParams) {
  const { isAuthenticated } = useAuth();
  const qs = params.toString();

  return useQuery({
    queryKey: ["products", qs],
    queryFn: ({ signal }) =>
      api<Paginated<Product>>(`/api/v1/products/?${qs}`, { signal }),
    enabled: isAuthenticated,
  });
}
```

Без auth — query idle, не 401 spam.

---

## Logout cascade

```text
logout()
  ├── tokenStore.clear()
  ├── setUser(null)
  ├── queryClient.clear()   ← no stale products for next user
  └── navigate /login
```

Partial `removeQueries({ queryKey: ['products'] })` — если clear too aggressive for public data.

---

## Public barrel

```typescript
// features/auth/index.ts
export { AuthProvider, useAuth } from "./context/AuthContext";
export type { AuthContextValue } from "./context/authTypes";
```

---

## Context performance

Auth value меняется редко — `useMemo` value ok. Split context (state vs dispatch) — если perf issue ([29-context.md](../react-basic/29-context.md)); для admin SPA обычно достаточно одного.

---

## Типичные ошибки

1. **User in Context + duplicate Query user** — один source для snapshot.

2. **login без throw** — form не показывает error.

3. **Bootstrap infinite loading** — забыли set anonymous on fail.

4. **Query fetch до bootstrap complete** — use `status !== 'loading'` in enabled.

5. **AuthProvider outside QueryClient** — `useQueryClient` crash.

6. **Storing password in state** — only FormData transient.

---

## Чек-лист

- [ ] AuthProvider wraps app inside QueryClientProvider
- [ ] `useAuth` throws outside provider
- [ ] login → tokens + user + status
- [ ] logout → clear tokens + Query
- [ ] Products query `enabled: isAuthenticated`
- [ ] MSW refresh handler for bootstrap

## Далее

Следующий урок: [11. Protected routes, roles, redirect после login](11-protected-routes.md).
