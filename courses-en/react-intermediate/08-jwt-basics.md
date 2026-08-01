# 08. JWT: access, refresh, claims, lifetime

## Real-world scenario

Security review of the admin SPA. Infosec: "Where's the session?" Backend: "Stateless JWT — access 15 min, refresh 7 days, simplejwt on Django." Frontend dev: "Let's put both in localStorage." The review blocks until there's a discussion of **claims**, **exp**, and refresh rotation.

Coming from react-basic you never built login — only a public API to FastAPI :8090. The admin on :8092 **requires** understanding JWT before [09-token-storage.md](09-token-storage.md) and [12-refresh-flow.md](12-refresh-flow.md). Mock login: `admin@shop.local` / `admin` in MSW.

## What you'll learn

- JWT structure: header, payload, signature.
- **Access** vs **refresh** — roles and lifetime.
- Claims: `sub`, `exp`, `user_id`, custom roles.
- What an SPA does and **doesn't do** with a JWT.
- The Django simplejwt login/refresh contract.

---

## What a JWT is

A **JSON Web Token** — a string `header.payload.signature` (Base64URL), signed with the server's secret. The client does **not trust** the payload without verification on the backend — but it can **read** claims for UX (email, role).

```text
eyJhbGciOiJIUzI1NiIs...   ← header (alg)
.
eyJzdWIiOiIxIiwiZXhwIj...   ← payload (claims)
.
SflKxwRJSMeKKF2QT4fwpM...   ← signature
```

Decoding the payload in DevTools (without verifying — debug only):

```javascript
const payload = JSON.parse(atob(token.split(".")[1].replace(/-/g, "+").replace(/_/g, "/")));
console.log(payload.exp, new Date(payload.exp * 1000));
```

**Never** make authorization decisions based on the decoded client payload alone — the server validates the signature.

---

## Access vs refresh

| | Access token | Refresh token |
|---|--------------|---------------|
| Lifetime | short (5–15 min) | long (days) |
| Sent | on every API request (`Authorization`) | only to `/auth/refresh/` |
| Storage | memory preferred ([09-token-storage.md](09-token-storage.md)) | httpOnly cookie or secure storage |
| Compromise | window until exp | critical — log out all sessions |

```text
Login  →  access + refresh
API    →  Bearer access
401    →  refresh → new access
401 refresh  →  logout
```

---

## Typical claims

| Claim | Meaning |
|-------|--------|
| `sub` | subject (user id) |
| `exp` | unix timestamp expiry |
| `iat` | issued at |
| `user_id` / `email` | custom (simplejwt) |
| `token_type` | `access` / `refresh` |

Django simplejwt access payload (example):

```json
{
  "token_type": "access",
  "exp": 1718888888,
  "iat": 1718887988,
  "jti": "abc123",
  "user_id": 1
}
```

The role for the UI can come in the **login response body** (`user: { role: "admin" }`), not only in the JWT — see [`handlers.ts`](examples/src/mocks/handlers.ts).

---

## The Django simplejwt contract (mock-exams)

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

The MSW handler repeats the shape — `mock-access-token` for dev.

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

DRF `IsAuthenticated` — 401 without the header.

---

## SPA responsibilities

**Does:**

- Login form → POST credentials → store tokens per policy.
- Attach `Authorization` on API calls ([04-api-client.md](04-api-client.md)).
- Detect 401 → refresh → retry ([12-refresh-flow.md](12-refresh-flow.md)).
- Logout → clear tokens + Query cache + redirect to `/login`.
- Show the user's email/role from the login snapshot.

**Doesn't do:**

- Verify the signature (backend only).
- Enforce permissions (backend DRF permissions).
- "Hide" API endpoints — security through obscurity fails.

Comparison with session cookies: JWT is stateless — the server doesn't keep a session table; revocation is harder (blacklist, short access TTL mitigates).

---

## Expiry and proactive refresh

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

A proactive refresh 30 s before `exp` — fewer visible 401s in the UI. An optional pattern in [12-refresh-flow.md](12-refresh-flow.md).

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

Persisting tokens — [09-token-storage.md](09-token-storage.md); Context — [10-auth-context.md](10-auth-context.md).

---

## JWT vs FastAPI OAuth2 (react-basic context)

react-basic :8090 is often without auth. nodejs-intermediate / fastapi JWT are similar:

```text
POST /token  vs  POST /api/v1/auth/login/
Bearer access  —  same header pattern
```

The client code is portable; the paths and body fields come from the OpenAPI of the specific backend.

---

## Security notes (preview)

- XSS + token in localStorage = a stolen token ([35-security-client.md](35-security-client.md)).
- Refresh in an httpOnly cookie + CSRF — an advanced BFF pattern ([nodejs-intermediate](../javascript-path.md)).
- Don't log tokens to Sentry/console.

---

## Common mistakes

1. **One token for everything** — refreshing on every GET breaks the model.

2. **Trusting the role from the JWT without a backend check** — a UI hint only.

3. **Ignoring exp** — endless 401 loops without a refresh.

4. **Refresh in the Authorization header for products** — the wrong token type.

5. **Storing the password** after login — never.

6. **Parsing the JWT without handling a malformed one** — try/catch in the helpers.

---

## Checklist

- [ ] Access is short, refresh is long — different endpoints
- [ ] Bearer only the access token on the API
- [ ] You know the MSW mock credentials
- [ ] You understand the limits of client-side JWT decoding
- [ ] You're ready to choose storage [09-token-storage.md](09-token-storage.md)

## Next

Next lesson: [09. Token storage: memory, localStorage, cookies](09-token-storage.md).
