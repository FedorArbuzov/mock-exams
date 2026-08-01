# 09. API authentication and authorization

## Intro

"Let's lock the API down with JWT" — but how do you refresh tokens? Where do you store scopes? How does machine-to-machine differ from a user in a mobile app? Auth is **API design**, not just middleware.

---

## Authentication vs authorization

| | Question | HTTP |
|--|--------|------|
| **Authentication** | who are you? | 401 |
| **Authorization** | what are you allowed to do? | 403 |

---

## Patterns

| Pattern | When | Header |
|---------|-------|-----------|
| **API Key** | server-to-server, webhook verification | `X-API-Key` or query (worse — logs) |
| **Bearer JWT** | SPA, mobile after login | `Authorization: Bearer eyJ...` |
| **OAuth2 Client Credentials** | M2M in enterprise | token endpoint → bearer |
| **OAuth2 Authorization Code + PKCE** | public clients (mobile) | don't store a client secret |
| **mTLS** | B2B, high trust | a certificate at the gateway |

```text
User login:     Client ──► Auth Server ──► access + refresh token
M2M:            Service ──► token endpoint ──► access token (short TTL)
```

---

## JWT in API design

An access token is **short** (5–15 min). Claims:

```json
{
  "sub": "user_42",
  "tenant_id": "ten_acme",
  "scope": "orders:read orders:write",
  "exp": 1718123456
}
```

| Decision | Recommendation |
|---------|--------------|
| Storing permissions in the JWT vs the DB | JWT for coarse scopes; fine-grained — a DB lookup |
| Refresh token | httpOnly cookie (web) or secure storage (mobile) |
| Logout | blacklist / short TTL + refresh rotation |

Implementation: [fastapi/19–21](../fastapi/19-oauth2-jwt.md), [Django JWT chapters](../django/README.md).

---

## Scopes and RBAC

```http
GET /orders
Authorization: Bearer ...
# token scope: orders:read → OK
# token scope: billing:read → 403
```

Document scopes in OpenAPI:

```yaml
security:
  - bearerAuth: [orders:read]
```

Hierarchy: `admin` ⊃ `orders:write` ⊃ `orders:read` — spell it out in the docs.

---

## Multi-tenant

| Approach | Example |
|--------|--------|
| Subdomain | `acme.api.example.com` |
| Header | `X-Tenant-Id: ten_acme` |
| Path | `/tenants/acme/orders` |
| Claim in the JWT | `tenant_id` |

**Isolation:** every request filters data by tenant; a cross-tenant leak test is mandatory.

---

## Webhook auth

An outbound webhook from you to a partner:

- an HMAC signature of the body (`X-Signature-SHA256`)
- a timestamp + replay window
- a secret per endpoint

An inbound webhook (Stripe → you): verify the signature per the provider's docs.

---

## API keys — hygiene

- Not in the URL (nginx logs, Referer)
- Rotation without downtime (two active keys)
- A prefix in the UI: `sk_live_...` with only the last 4 characters shown

Secrets: [secrets-basic](../secrets-basic/README.md), [aws-intermediate/11](../aws-intermediate/11-secrets-kms.md).

---

## In mock-exams

| Topic | Course |
|------|------|
| OAuth2 + JWT | [fastapi/19–21](../fastapi/19-oauth2-jwt.md) |
| RBAC scopes | [fastapi/20](../fastapi/20-rbac-scopes.md) |
| Vault / CI secrets | [secrets-basic](../secrets-basic/README.md) |
| OWASP API | [10-security-public-api](10-security-public-api.md) |

---

## Summary

Pick **one primary** flow for each type of client. Scopes in OpenAPI, a tenant on every request, 401/403 applied consistently.

---

## Checklist

- [ ] Are M2M vs user flows separated?
- [ ] Are scopes documented?
- [ ] Are webhook signatures described?

**Next:** [10. Public API security](10-security-public-api.md).
