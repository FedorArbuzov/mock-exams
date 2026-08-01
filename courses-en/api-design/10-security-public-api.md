# 10. Public API security

## Intro

The OWASP API Security Top 10 isn't a once-a-year audit checklist, but a set of **design requirements**: what not to return, what to validate, how to limit the blast radius.

---

## OWASP API Top 10 (condensed)

| # | Risk | Control in design |
|---|------|-------------------|
| API1 | Broken Object Level Authorization | id in the URL + an ownership check |
| API2 | Broken Authentication | a short JWT, no creds in the URL |
| API3 | Broken Property Level Authorization | response_model, field-level RBAC |
| API4 | Unrestricted Resource Consumption | rate limit, max limit, payload size |
| API5 | Broken Function Level Authorization | admin routes kept separate, scopes |
| API6 | Unrestricted Access to Sensitive Flows | captcha, step-up auth on transfers |
| API7 | SSRF | whitelist URLs in webhook callbacks |
| API8 | Security Misconfiguration | default-deny CORS, no debug in prod |
| API9 | Improper Inventory Management | deprecated v1, shadow APIs |
| API10 | Unsafe Consumption of APIs | validate upstream responses |

Deeper: [appsec-fundamentals](../appsec-fundamentals/README.md).

---

## Input validation

| Boundary | What |
|---------|-----|
| JSON schema / Pydantic | types, min/max, enum |
| Business rules | 409, not 500 |
| File upload | max size, MIME sniff, async virus scan |

**Mass assignment:** no `**request.json` into the ORM — only a whitelist of fields ([fastapi/04](../fastapi/04-pydantic-v2.md)).

---

## CORS

```text
Browser SPA  →  needs an explicit Access-Control-Allow-Origin
Server M2M   →  CORS doesn't apply; auth via key/JWT
```

`Access-Control-Allow-Origin: *` + credentials — **not allowed**.

---

## TLS and transport

- HTTPS only; HSTS at the gateway ([nginx-intermediate](../nginx-intermediate/README.md))
- Certificate pinning — rare, only for high-security mobile

---

## Sensitive data in responses

| Don't return | Instead |
|-------------|--------|
| password_hash | — |
| full PAN | last4 |
| internal ids of other tenants | 404 |
| stack traces | Problem + request_id |

---

## Audit log

For admin and financial APIs:

```json
{ "actor": "user_1", "action": "order.cancel", "target": "ord_42", "ip": "...", "at": "..." }
```

Separate from the nginx access log; an immutable store.

---

## Threat modeling (API)

```text
[Internet] → [WAF/CDN] → [API GW] → [Service] → [DB]
                ↑              ↑
           rate limit      authZ per route
```

The minimum for a public API: **authN**, **authZ**, **rate limit**, **validation**, **TLS**, **no sensitive leak**.

FastAPI checklist: [fastapi/22](../fastapi/22-security-checklist.md).

---

## In mock-exams

| Topic | Course |
|------|------|
| Security checklist | [fastapi/22](../fastapi/22-security-checklist.md) |
| CORS middleware | [fastapi/23](../fastapi/23-middleware-cors.md) |
| nginx TLS | [fastapi/34](../fastapi/34-nginx-tls.md) |
| AppSec theory | [appsec-fundamentals](../appsec-fundamentals/README.md) |
| SAST in CI | [gitlab-advanced](../gitlab-advanced/README.md) |

---

## Summary

API security starts with the **resource model and permissions on every id**. It's rounded out by limits, validation, and version inventory.

---

## Checklist

- [ ] BOLA: a "someone else's id → 404" test?
- [ ] Rate limit on auth and expensive endpoints?
- [ ] response_model on all routes?

**Next:** [11. Asynchronous APIs: webhooks, polling, long-running](11-async-webhooks.md).
