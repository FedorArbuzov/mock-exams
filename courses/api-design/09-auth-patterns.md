# 09. Аутентификация и авторизация API

## Введение

«Закроем API JWT» — а как обновлять токены? Где хранить scopes? Чем machine-to-machine отличается от пользователя в мобилке? Auth — **дизайн API**, не только middleware.

---

## Аутентификация vs авторизация

| | Вопрос | HTTP |
|--|--------|------|
| **Authentication** | кто ты? | 401 |
| **Authorization** | что тебе можно? | 403 |

---

## Паттерны

| Паттерн | Когда | Заголовок |
|---------|-------|-----------|
| **API Key** | server-to-server, webhooks verify | `X-API-Key` или query (хуже — логи) |
| **Bearer JWT** | SPA, mobile после login | `Authorization: Bearer eyJ...` |
| **OAuth2 Client Credentials** | M2M в enterprise | token endpoint → bearer |
| **OAuth2 Authorization Code + PKCE** | публичные клиенты (mobile) | не хранить client secret |
| **mTLS** | B2B, high trust | сертификат на gateway |

```text
User login:     Client ──► Auth Server ──► access + refresh token
M2M:            Service ──► token endpoint ──► access token (short TTL)
```

---

## JWT в API design

Access token — **короткий** (5–15 мин). Claims:

```json
{
  "sub": "user_42",
  "tenant_id": "ten_acme",
  "scope": "orders:read orders:write",
  "exp": 1718123456
}
```

| Решение | Рекомендация |
|---------|--------------|
| Хранить права в JWT vs DB | JWT для coarse scopes; fine-grained — DB lookup |
| Refresh token | httpOnly cookie (web) или secure storage (mobile) |
| Logout | blacklist / short TTL + refresh rotation |

Реализация: [fastapi/19–21](../fastapi/19-oauth2-jwt.md), [django JWT главы](../django/README.md).

---

## Scopes и RBAC

```http
GET /orders
Authorization: Bearer ...
# token scope: orders:read → OK
# token scope: billing:read → 403
```

Документируйте scopes в OpenAPI:

```yaml
security:
  - bearerAuth: [orders:read]
```

Иерархия: `admin` ⊃ `orders:write` ⊃ `orders:read` — явно в docs.

---

## Multi-tenant

| Подход | Пример |
|--------|--------|
| Subdomain | `acme.api.example.com` |
| Header | `X-Tenant-Id: ten_acme` |
| Path | `/tenants/acme/orders` |
| Claim в JWT | `tenant_id` |

**Изоляция:** каждый запрос фильтрует данные по tenant; тест на cross-tenant leak обязателен.

---

## Webhooks auth

Исходящий webhook от вас к партнёру:

- HMAC подпись тела (`X-Signature-SHA256`)
- timestamp + replay window
- secret per endpoint

Входящий webhook (Stripe → вы): verify signature по docs провайдера.

---

## API keys — hygiene

- Не в URL (логи nginx, Referer)
- Rotation без downtime (два активных key)
- Prefix в UI: `sk_live_...` только последние 4 символа

Секреты: [secrets-basic](../secrets-basic/README.md), [aws-intermediate/11](../aws-intermediate/11-secrets-kms.md).

---

## В mock-exams

| Тема | Курс |
|------|------|
| OAuth2 + JWT | [fastapi/19–21](../fastapi/19-oauth2-jwt.md) |
| RBAC scopes | [fastapi/20](../fastapi/20-rbac-scopes.md) |
| Vault / CI secrets | [secrets-basic](../secrets-basic/README.md) |
| OWASP API | [10-security-public-api](10-security-public-api.md) |

---

## Резюме

Выберите **один primary** flow для каждого типа клиента. Scopes в OpenAPI, tenant в каждом запросе, 401/403 последовательно.

---

## Чек-лист

- [ ] M2M vs user flows разведены?
- [ ] Scopes документированы?
- [ ] Webhook signatures описаны?

**Дальше:** [10. Безопасность публичного API](10-security-public-api.md).
