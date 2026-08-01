# 22. Security checklist for a REST API

## Intro: "the OWASP API Top 10 isn't a box-ticking checklist"

A pentest found: **BOLA** (accessing other users' `items` by id), **no rate limit** on login, **CORS `*`**, secrets in git, verbose 500s with a traceback. FastAPI isn't "secure out of the box" — it's **transparent** for auditing. This chapter is a practical baseline before production and a bridge to [`appsec-fundamentals`](../appsec-fundamentals/README.md), [`nginx-intermediate`](../nginx-intermediate/03-security-headers.md).

## What you'll learn

- The **OWASP API Security Top 10** in the FastAPI context.
- **CORS**, security headers, HTTPS termination.
- Managing **secrets** and configuration.
- A minimal checklist before release.

---

## OWASP API Top 10 (condensed)

| # | Risk | Control in the FastAPI stack |
|---|------|---------------------------|
| API1 | Broken Object Level Authorization | `owner_id` check, don't trust the id from the body |
| API2 | Broken Authentication | JWT exp, bcrypt, lockout / rate limit |
| API3 | Broken Object Property Level | `response_model`, exclude sensitive fields |
| API4 | Unrestricted Resource Consumption | `limit` cap, rate limit ([28-redis-cache](28-redis-cache.md)) |
| API5 | Broken Function Level Authorization | RBAC `require_role` ([20-rbac-scopes](20-rbac-scopes.md)) |
| API6 | Unrestricted Access to Sensitive Flows | CAPTCHA on register, MFA for admin |
| API7 | SSRF | URL validation in webhooks |
| API8 | Security Misconfiguration | `debug=False`, hide `/docs` in prod |
| API9 | Improper Inventory Management | API versions, deprecate |
| API10 | Unsafe Consumption of APIs | timeout + validate external responses |

More — the [`appsec-fundamentals`](../appsec-fundamentals/README.md) course.

---

## CORS

```python
from fastapi.middleware.cors import CORSMiddleware

app.add_middleware(
    CORSMiddleware,
    allow_origins=["https://app.example.com"],  # not "*" with credentials
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE"],
    allow_headers=["Authorization", "Content-Type"],
)
```

| Mistake | Risk |
|--------|------|
| `allow_origins=["*"]` + `credentials=True` | the browser blocks it; if bypassed — a leak |
| CORS as "authorization" | CORS is for the browser only; curl bypasses it |
| Duplicating CORS in nginx and the app | conflicting headers |

In production, CORS is often on **nginx** ([`nginx-basic`](../nginx-basic/README.md)); the application is a second layer for dev.

---

## Security headers

```python
from starlette.middleware.base import BaseHTTPMiddleware

class SecurityHeadersMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request, call_next):
        response = await call_next(request)
        response.headers["X-Content-Type-Options"] = "nosniff"
        response.headers["X-Frame-Options"] = "DENY"
        response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
        return response
```

**HSTS** (`Strict-Transport-Security`) — on the HTTPS edge (nginx), not on the lab's HTTP :8090.

Compare with [nginx security headers](../nginx-intermediate/03-security-headers.md): in a K8s Ingress it's the same ideas.

---

## Secrets and configuration

| Secret | Where to store |
|--------|-------------|
| `JWT_SECRET` | env / Vault / K8s Secret |
| `DATABASE_URL` | env, not in the image |
| API keys for external services | secrets manager |

```python
# pydantic-settings — fail fast
class Settings(BaseSettings):
    JWT_SECRET: str  # required field
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")
```

| Anti-pattern | Action |
|-------------|----------|
| `.env` in git | `.gitignore`, git-secrets scan |
| `course-dev-secret` in prod | rotation, different envs |
| Logs with Authorization | redact in middleware |

The `deploy/fastapi` stand uses a **dev** secret — for learning only.

---

## Errors and information leakage

```python
@app.exception_handler(Exception)
async def generic_handler(request, exc):
    logger.exception("unhandled")
    return JSONResponse(status_code=500, content={"detail": "Internal server error"})
```

- **422** — validation details are OK for the client.
- **500** — no stack trace to the outside.
- `/docs`, `/redoc` — disable or put behind Basic Auth in prod.

---

## Transport and network

| Layer | Control |
|------|----------|
| Edge | TLS 1.2+, nginx cert ([34-nginx-tls](34-nginx-tls.md)) |
| Service mesh / K8s | NetworkPolicy |
| DB | private network only, don't publish 5432 |

The lab on **8090 HTTP** is fine; in prod the API sits behind TLS.

---

## Pre-release checklist

```markdown
- [ ] BOLA: every id-resource checks owner or role
- [ ] JWT: short TTL, strong secret, alg fixed
- [ ] Passwords: bcrypt, no default credentials
- [ ] Rate limit on /auth/token and heavy GETs
- [ ] CORS: whitelist origins
- [ ] Headers: nosniff, frame deny, HSTS on the edge
- [ ] Secrets not in git / the image
- [ ] 500 without a traceback to the client
- [ ] Dependencies: pip audit / dependabot
- [ ] Logs without PII and tokens
```

---

## On the stand (self-check)

```bash
curl -sI http://localhost:8090/health
curl -s http://localhost:8090/openapi.json | head -c 100
# Make sure: no extra debug fields in error responses
```

---

## Common mistakes

| Mistake | Consequence | Fix |
|--------|-------------|---------|
| Checking permissions only in the UI | BOLA | server-side always |
| Trusting `user_id` from the JSON body | owner spoofing | from the JWT only |
| Disabled CORS "for testing" in prod | CSRF-like scenarios | env-specific config |
| One JWT secret for all environments | dev compromise → prod | different secrets |

---

## Summary

API security means **authorization on every object**, short JWTs, secrets from env, a CORS whitelist, headers on the edge, rate limiting, and monitoring. FastAPI gives you the hooks (dependencies, middleware); you set the policy. Next — [23-middleware-cors](23-middleware-cors.md).

## Checklist

- Why doesn't CORS replace auth?
- What is BOLA, using `/items/{id}` as an example?
- Where do you set HSTS — in uvicorn or nginx?

Next: [23-middleware-cors](23-middleware-cors.md).
