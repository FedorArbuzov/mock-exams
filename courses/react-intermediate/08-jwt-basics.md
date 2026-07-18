# 08. JWT: access, refresh, claims, срок жизни

## Сценарий с работы

Security review admin SPA. Infosec: «Где session?» Backend: «Stateless JWT — access 15 min, refresh 7 days, simplejwt на Django». Frontend dev: «Положим оба в localStorage». Review блокирует до обсуждения **claims**, **exp**, rotation refresh.

Вы из react-basic не делали login — только public API к FastAPI :8090. Admin на :8092 **требует** понимания JWT до [09-token-storage.md](09-token-storage.md) и [12-refresh-flow.md](12-refresh-flow.md). Mock login: `admin@shop.local` / `admin` в MSW.

## Что вы узнаете

- Структура JWT: header, payload, signature.
- **Access** vs **refresh** — роли и lifetime.
- Claims: `sub`, `exp`, `user_id`, custom roles.
- Что SPA делает и **не делает** с JWT.
- Контракт Django simplejwt login/refresh.

---

## Что такое JWT

**JSON Web Token** — строка `header.payload.signature` (Base64URL), подписанная секретом сервера. Клиент **не доверяет** payload без проверки на backend — но может **читать** claims для UX (email, role).

```text
eyJhbGciOiJIUzI1NiIs...   ← header (alg)
.
eyJzdWIiOiIxIiwiZXhwIj...   ← payload (claims)
.
SflKxwRJSMeKKF2QT4fwpM...   ← signature
```

Декод payload в DevTools (без verify — только debug):

```javascript
const payload = JSON.parse(atob(token.split(".")[1].replace(/-/g, "+").replace(/_/g, "/")));
console.log(payload.exp, new Date(payload.exp * 1000));
```

**Никогда** не принимайте решения authorization только по decoded client payload — server validates signature.

---

## Access vs refresh

| | Access token | Refresh token |
|---|--------------|---------------|
| Lifetime | короткий (5–15 min) | длинный (days) |
| Отправка | каждый API request (`Authorization`) | только `/auth/refresh/` |
| Хранение | memory preferred ([09-token-storage.md](09-token-storage.md)) | httpOnly cookie или secure storage |
| Компрометация | окно до exp | критично — logout all sessions |

```text
Login  →  access + refresh
API    →  Bearer access
401    →  refresh → new access
401 refresh  →  logout
```

---

## Типичные claims

| Claim | Смысл |
|-------|--------|
| `sub` | subject (user id) |
| `exp` | unix timestamp expiry |
| `iat` | issued at |
| `user_id` / `email` | custom (simplejwt) |
| `token_type` | `access` / `refresh` |

Django simplejwt access payload (пример):

```json
{
  "token_type": "access",
  "exp": 1718888888,
  "iat": 1718887988,
  "jti": "abc123",
  "user_id": 1
}
```

Role для UI может приходить в **login response body** (`user: { role: "admin" }`), не только в JWT — см. [`handlers.ts`](examples/src/mocks/handlers.ts).

---

## Django simplejwt контракт (mock-exams)

### Login

```http
POST /api/v1/auth/login/
Content-Type: application/json

{ "email": "admin@shop.local", "password": "admin" }
```

```json
{
  "access": "eyJ...",
  "refresh": "eyJ...",
  "user": { "id": 1, "email": "admin@shop.local", "role": "admin" }
}
```

MSW handler повторяет форму — `mock-access-token` для dev.

### Refresh

```http
POST /api/v1/auth/refresh/
Content-Type: application/json

{ "refresh": "eyJ..." }
```

```json
{ "access": "eyJ..." }
```

### Protected request

```http
GET /api/v1/products/
Authorization: Bearer eyJ...
```

DRF `IsAuthenticated` — без header 401.

---

## SPA responsibilities

**Делает:**

- Login form → POST credentials → store tokens per policy.
- Attach `Authorization` на API calls ([04-api-client.md](04-api-client.md)).
- Detect 401 → refresh → retry ([12-refresh-flow.md](12-refresh-flow.md)).
- Logout → clear tokens + Query cache + redirect `/login`.
- Show user email/role from login snapshot.

**Не делает:**

- Verify signature (backend only).
- Enforce permissions (backend DRF permissions).
- «Hide» API endpoints — security through obscurity fails.

Сравнение с session cookies: JWT stateless — server не хранит session table; revoke сложнее (blacklist, short access TTL mitigates).

---

## Expiry и proactive refresh

```typescript
function isExpired(token: string, skewSec = 30): boolean {
  try {
    const payload = JSON.parse(atob(token.split(".")[1].replace(/-/g, "+").replace(/_/g, "/")));
    const now = Math.floor(Date.now() / 1000);
    return payload.exp <= now + skewSec;
  } catch {
    return true;
  }
}
```

Proactive refresh за 30 s до `exp` — меньше visible 401 в UI. Optional pattern в [12-refresh-flow.md](12-refresh-flow.md).

---

## TypeScript types

```typescript
// api/types/auth.ts
export type User = {
  id: number;
  email: string;
  role: string;
};

export type LoginResponse = {
  access: string;
  refresh: string;
  user: User;
};

export type RefreshResponse = {
  access: string;
};
```

---

## Login mutation preview

```typescript
export function useLoginMutation() {
  return useMutation({
    mutationFn: (body: { email: string; password: string }) =>
      api<LoginResponse>("/api/v1/auth/login/", {
        method: "POST",
        body: JSON.stringify(body),
      }),
  });
}
```

Persistence tokens — [09-token-storage.md](09-token-storage.md); Context — [10-auth-context.md](10-auth-context.md).

---

## JWT vs FastAPI OAuth2 (react-basic context)

react-basic :8090 часто без auth. nodejs-intermediate / fastapi JWT похожи:

```text
POST /token  vs  POST /api/v1/auth/login/
Bearer access  —  same header pattern
```

Клиентский код переносим; paths и body fields — из OpenAPI конкретного backend.

---

## Security notes (preview)

- XSS + token in localStorage = steal token ([35-security-client.md](35-security-client.md)).
- Refresh in httpOnly cookie + CSRF — advanced BFF pattern ([nodejs-intermediate](../javascript-path.md)).
- Не логируйте tokens в Sentry/console.

---

## Типичные ошибки

1. **Один token на всё** — refresh на каждый GET ломает модель.

2. **Доверять role из JWT без backend check** — UI only hint.

3. **Игнорировать exp** — бесконечные 401 loops без refresh.

4. **Refresh в Authorization header на products** — wrong token type.

5. **Хранить password** после login — never.

6. **Parse JWT без обработки malformed** — try/catch в helpers.

---

## Чек-лист

- [ ] Access короткий, refresh длинный — разные endpoints
- [ ] Bearer только access на API
- [ ] Знаете mock credentials MSW
- [ ] Понимаете limits client-side JWT decode
- [ ] Готовы выбрать storage [09-token-storage.md](09-token-storage.md)

## Далее

Следующий урок: [09. Хранение токенов: memory, localStorage, cookies](09-token-storage.md).
