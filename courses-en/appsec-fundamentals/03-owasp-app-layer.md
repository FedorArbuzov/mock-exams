# 03. Application layer: OWASP and common attacks

## Intro

DevOps doesn't write business logic, but it **deploys** it and often configures **Ingress, headers, TLS, logs**. Understanding the OWASP Top 10 helps you **not blame "the developers"** and instead set the right **platform defaults** and pipeline requirements.

---

## OWASP Top 10 (2021) — an engineering view

| # | Risk | What the platform does |
|---|------|----------------------|
| A01 Broken Access Control | K8s RBAC, IAM least privilege |
| A02 Cryptographic Failures | TLS 1.2+, KMS, secrets not in logs |
| A03 Injection | WAF optionally; don't log raw input |
| A04 Insecure Design | threat model, rate limits |
| A05 Security Misconfiguration | CIS, Kyverno, hardened images |
| A06 Vulnerable Components | dependency scan, base image update |
| A07 Auth failures | OIDC, short-lived tokens |
| A08 Software/Data Integrity | signed images, Git branch protection |
| A09 Logging failures | central logs, no secrets in Loki |
| A10 SSRF | egress NetworkPolicy, metadata IP block |

The full list and details are at [owasp.org/Top10](https://owasp.org/Top10/); here we focus on the **connection to infra**.

---

## Injection and SSRF (briefly)

**SQL/command injection** is in the code (parameterized queries). Infra helps: **don't** give the application `cluster-admin` "just in case".

**SSRF** — the application fetches a URL from the user → access to `169.254.169.254` (metadata), internal APIs.

| Control | Level |
|----------|---------|
| Egress NetworkPolicy | only the required CIDRs |
| IMDSv2 / metadata hop limit | cloud |
| Split internal/external DNS | network |

---

## Broken authentication at the boundary

| Antipattern | Control |
|--------------|----------|
| Basic auth without TLS | HTTPS only, HSTS |
| JWT in the URL | HttpOnly cookies / header |
| Long-lived API key in a ConfigMap | Vault + rotation |
| Admin panel at `/admin` without an IP allowlist | Ingress + SSO |

Related: [nginx-intermediate](../nginx-intermediate/README.md) (TLS, rate limit).

---

## Security headers (Ingress / nginx)

Example for a reverse proxy:

```nginx
add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
add_header X-Content-Type-Options "nosniff" always;
add_header X-Frame-Options "DENY" always;
add_header Content-Security-Policy "default-src 'self'" always;
```

They don't replace fixing XSS in code, but they **reduce the impact**.

---

## API and BFF

| Risk | Symptom | Infra signal |
|------|---------|--------------|
| Excessive data exposure | API returns extra fields | large responses in metrics |
| Mass assignment | PATCH changes role | 403 spikes |
| Rate limit bypass | one IP, many keys | no 429 on Ingress |

**Rate limiting** — [nginx-intermediate/05](../nginx-intermediate/05-rate-limiting.md).

---

## In mock-exams

| Topic | Course |
|------|------|
| TLS | [linux-intermediate/09](../linux-intermediate/09-tls-openssl.md), nginx |
| PG injection awareness | [postgresql-security](../postgresql-security/README.md) |
| Secrets in logs | [observability-intermediate](../observability-intermediate/README.md) |

---

## Summary

OWASP is the language for talking to development. The platform engineer implements **TLS, headers, rate limits, egress policy, scanning** — the rest stays in the code and review.

---

## Checklist

- [ ] Three OWASP items your Ingress covers?
- [ ] Is there an SSRF surface (a webhook URL from the user)?
- [ ] Do you log Authorization headers?

**Next:** [04. Secrets](04-secrets-credentials.md).
