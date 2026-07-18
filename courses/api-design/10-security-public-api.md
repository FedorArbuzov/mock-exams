# 10. Безопасность публичного API

## Введение

OWASP API Security Top 10 — не чеклист на аудит раз в год, а **требования к дизайну**: что не отдавать, что валидировать, как ограничивать blast radius.

---

## OWASP API Top 10 (сжато)

| # | Риск | Контроль в дизайне |
|---|------|-------------------|
| API1 | Broken Object Level Authorization | id в URL + проверка ownership |
| API2 | Broken Authentication | короткий JWT, no creds in URL |
| API3 | Broken Property Level Authorization | response_model, field-level RBAC |
| API4 | Unrestricted Resource Consumption | rate limit, max limit, payload size |
| API5 | Broken Function Level Authorization | admin routes отдельно, scopes |
| API6 | Unrestricted Access to Sensitive Flows | captcha, step-up auth на transfer |
| API7 | SSRF | whitelist URL в webhook callbacks |
| API8 | Security Misconfiguration | default deny CORS, no debug in prod |
| API9 | Improper Inventory Management | deprecated v1, shadow APIs |
| API10 | Unsafe Consumption of APIs | validate upstream responses |

Глубже: [appsec-fundamentals](../appsec-fundamentals/README.md).

---

## Input validation

| Граница | Что |
|---------|-----|
| JSON schema / Pydantic | типы, min/max, enum |
| Business rules | 409, не 500 |
| File upload | max size, MIME sniff, virus scan async |

**Mass assignment:** не `**request.json` в ORM — только whitelist полей ([fastapi/04](../fastapi/04-pydantic-v2.md)).

---

## CORS

```text
Browser SPA  →  нужен явный Access-Control-Allow-Origin
Server M2M   →  CORS не применяется; auth по ключу/JWT
```

`Access-Control-Allow-Origin: *` + credentials — **нельзя**.

---

## TLS и transport

- HTTPS only; HSTS на gateway ([nginx-intermediate](../nginx-intermediate/README.md))
- Certificate pinning — редко, только high-security mobile

---

## Sensitive data в ответах

| Не отдавать | Вместо |
|-------------|--------|
| password_hash | — |
| full PAN | last4 |
| internal ids других tenants | 404 |
| stack traces | Problem + request_id |

---

## Audit log

Для admin и financial API:

```json
{ "actor": "user_1", "action": "order.cancel", "target": "ord_42", "ip": "...", "at": "..." }
```

Отдельно от access log nginx; immutable store.

---

## Threat modeling (API)

```text
[Internet] → [WAF/CDN] → [API GW] → [Service] → [DB]
                ↑              ↑
           rate limit      authZ per route
```

Минимум для публичного API: **authN**, **authZ**, **rate limit**, **validation**, **TLS**, **no sensitive leak**.

Чеклист FastAPI: [fastapi/22](../fastapi/22-security-checklist.md).

---

## В mock-exams

| Тема | Курс |
|------|------|
| Security checklist | [fastapi/22](../fastapi/22-security-checklist.md) |
| CORS middleware | [fastapi/23](../fastapi/23-middleware-cors.md) |
| nginx TLS | [fastapi/34](../fastapi/34-nginx-tls.md) |
| AppSec теория | [appsec-fundamentals](../appsec-fundamentals/README.md) |
| SAST в CI | [gitlab-advanced](../gitlab-advanced/README.md) |

---

## Резюме

Безопасность API начинается с **модели ресурсов и прав на каждый id**. Дополняется лимитами, валидацией и инвентаризацией версий.

---

## Чек-лист

- [ ] BOLA: тест «чужой id → 404»?
- [ ] Rate limit на auth и expensive endpoints?
- [ ] response_model на всех routes?

**Дальше:** [11. Асинхронные API: webhooks, polling, long-running](11-async-webhooks.md).
