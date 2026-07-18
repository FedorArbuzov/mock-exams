# 03. Уровень приложения: OWASP и типовые атаки

## Введение

DevOps не пишет бизнес-логику, но **деплоит** её и часто настраивает **Ingress, headers, TLS, логи**. Понимание OWASP Top 10 помогает **не обвинять «разработчиков»**, а задавать правильные **platform defaults** и требования к pipeline.

---

## OWASP Top 10 (2021) — инженерный взгляд

| # | Риск | Что делает платформа |
|---|------|----------------------|
| A01 Broken Access Control | RBAC K8s, IAM least privilege |
| A02 Cryptographic Failures | TLS 1.2+, KMS, secrets not in logs |
| A03 Injection | WAF опционально; не логировать raw input |
| A04 Insecure Design | threat model, rate limits |
| A05 Security Misconfiguration | CIS, Kyverno, hardened images |
| A06 Vulnerable Components | dependency scan, base image update |
| A07 Auth failures | OIDC, short-lived tokens |
| A08 Software/Data Integrity | signed images, Git branch protection |
| A09 Logging failures | central logs, no secrets in Loki |
| A10 SSRF | egress NetworkPolicy, metadata IP block |

Полный список и детали — [owasp.org/Top10](https://owasp.org/Top10/); здесь — **связь с infra**.

---

## Injection и SSRF (кратко)

**SQL/command injection** — в коде (параметризованные запросы). Infra помогает: **не** давать приложению `cluster-admin` «на всякий случай».

**SSRF** — приложение дергает URL от пользователя → доступ к `169.254.169.254` (metadata), внутренним API.

| Контроль | Уровень |
|----------|---------|
| Egress NetworkPolicy | только нужные CIDR |
| IMDSv2 / metadata hop limit | cloud |
| Split internal/external DNS | network |

---

## Broken authentication на границе

| Антипаттерн | Контроль |
|--------------|----------|
| Basic auth без TLS | только HTTPS, HSTS |
| JWT в URL | cookies HttpOnly / header |
| Долгоживущий API key в ConfigMap | Vault + rotation |
| Admin panel на `/admin` без IP allowlist | Ingress + SSO |

Связь: [nginx-intermediate](../nginx-intermediate/README.md) (TLS, rate limit).

---

## Security headers (Ingress / nginx)

Пример для reverse proxy:

```nginx
add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
add_header X-Content-Type-Options "nosniff" always;
add_header X-Frame-Options "DENY" always;
add_header Content-Security-Policy "default-src 'self'" always;
```

Не заменяют исправление XSS в коде, но **снижают impact**.

---

## API и BFF

| Риск | Симптом | Infra-сигнал |
|------|---------|--------------|
| Excessive data exposure | API отдаёт лишние поля | большие responses в metrics |
| Mass assignment | PATCH меняет role | 403 spikes |
| Rate limit bypass | один IP, много keys | 429 нет на Ingress |

**Rate limiting** — [nginx-intermediate/05](../nginx-intermediate/05-rate-limiting.md).

---

## В mock-exams

| Тема | Курс |
|------|------|
| TLS | [linux-intermediate/09](../linux-intermediate/09-tls-openssl.md), nginx |
| PG injection awareness | [postgresql-security](../postgresql-security/README.md) |
| Secrets in logs | [observability-intermediate](../observability-intermediate/README.md) |

---

## Резюме

OWASP — язык общения с разработкой. Platform engineer внедряет **TLS, headers, rate limits, egress policy, scanning** — остальное остаётся в коде и review.

---

## Чек-лист

- [ ] Три пункта OWASP, которые закрывает ваш Ingress?
- [ ] Есть ли SSRF-поверхность (webhook URL от пользователя)?
- [ ] Логируете ли вы Authorization headers?

**Дальше:** [04. Секреты](04-secrets-credentials.md).
