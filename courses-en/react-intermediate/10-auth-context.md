# 10. AuthProvider, useAuth, syncing with Query

## Real-world scenario

The login form works, tokens are in `tokenStore` ([09-token-storage.md](09-token-storage.md)), but the Header doesn't know the user — prop drilling `user` through `AppLayout`. Review: "Make an AuthProvider modeled on the Theme one from react-basic [29-context.md](../react-basic/29-context.md), but **don't** put the catalog in Context."

Auth state is a **client snapshot** (user, isAuthenticated); products stay in Query. This lesson is the glue between the login mutation, tokenStore, and the UI.

## What you'll learn

- `AuthProvider` + the `useAuth` hook.
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
        // Ideal: GET /api/v1/auth/me/ — for now the user is unknown without a second endpoint
        setStatus("authenticated");
        // user stays null until re-login or /me — see lab 13
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

MSW: add a `POST /api/v1/auth/refresh/` handler to [`handlers.ts`](examples/src/mocks/handlers.ts) for the bootstrap.

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

Query **outside** Auth — the login mutation uses QueryClient; Auth uses `useQueryClient`.

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
      setError("Invalid email or password");
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      <input name="email" type="email" defaultValue="admin@shop.local" required />
      <input name="password" type="password" defaultValue="admin" required />
      {error && <p role="alert">{error}</p>}
      <button type="submit" disabled={status === "loading"}>
        {status === "loading" ? "Signing in…" : "Sign in"}
      </button>
    </form>
  );
}
```

The mock credentials are documented in [00-environment.md](00-environment.md).

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
        Log out
      </button>
    </>
  );
}
```

---

## Query sync: the enabled flag

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

Without auth — the query is idle, no 401 spam.

---

## Logout cascade

```text
logout()
  ├── tokenStore.clear()
  ├── setUser(null)
  ├── queryClient.clear()   ← no stale products for next user
  └── navigate /login
```

A partial `removeQueries({ queryKey: ['products'] })` — if clear is too aggressive for public data.

---

## Public barrel

```typescript
// features/auth/index.ts
export { AuthProvider, useAuth } from "./context/AuthContext";
export type { AuthContextValue } from "./context/authTypes";
```

---

## Context performance

The auth value changes rarely — `useMemo` on the value is fine. Split context (state vs dispatch) — if there's a perf issue ([29-context.md](../react-basic/29-context.md)); for an admin SPA one is usually enough.

---

## Common mistakes

1. **User in Context + a duplicate Query user** — a single source for the snapshot.

2. **login without throw** — the form doesn't show the error.

3. **Bootstrap infinite loading** — forgot to set anonymous on failure.

4. **Query fetch before bootstrap completes** — use `status !== 'loading'` in enabled.

5. **AuthProvider outside QueryClient** — `useQueryClient` crash.

6. **Storing the password in state** — only transient FormData.

---

## Checklist

- [ ] AuthProvider wraps the app inside QueryClientProvider
- [ ] `useAuth` throws outside the provider
- [ ] login → tokens + user + status
- [ ] logout → clear tokens + Query
- [ ] Products query `enabled: isAuthenticated`
- [ ] MSW refresh handler for the bootstrap

## Next

Next lesson: [11. Protected routes, roles, redirect after login](11-protected-routes.md).
