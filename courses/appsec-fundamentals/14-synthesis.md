# 14. Синтез: threat model и security baseline

## Практическое задание

Выберите сервис:

- [image-platform](../aws-intermediate/projects/image-platform/) (API + worker + S3 + CI), или
- микросервис из вашей работы (API + DB + Redis + GitLab deploy на K8s).

**Время:** 2–3 часа.

---

## Deliverable 1: Threat Model (1 стр.)

**1. Scope** — один сервис, prod namespace.

**2. DFD** — 6–10 блоков (user, ingress, app, db, ci, registry, vault/cloud SM).

**3. Assets** — таблица: имя, класс (PII/secret/config), где хранится.

**4. Top-5 threats (STRIDE)** — по одной строке: угроза → impact → control (существующий / planned).

**5. Trust boundaries** — минимум 3, что пересекает границу (TLS, auth, audit).

---

## Deliverable 2: Security Baseline (чеклист)

Скопируйте и заполните для **prod**:

### Kubernetes

| # | Control | Status | Owner | Evidence |
|---|---------|--------|-------|----------|
| 1 | Namespace dedicated, no default SA rights | | | |
| 2 | NetworkPolicy default deny + explicit allow | | | |
| 3 | Pod Security: restricted (or baseline + exceptions) | | | |
| 4 | Non-root, no privileged, drop caps | | | |
| 5 | Resources requests/limits | | | |
| 6 | Image pin by digest, scan in CI | | | |
| 7 | cosign verify at admission (or planned) | | | |
| 8 | K8s audit for secrets/RBAC | | | |

### CI/CD

| # | Control | Status | Owner | Evidence |
|---|---------|--------|-------|----------|
| 9 | SAST + secret scan on MR | | | |
| 10 | Container scan block HIGH/CRITICAL | | | |
| 11 | OIDC to cloud, no static prod keys | | | |
| 12 | Protected main, 2 approvals for pipeline change | | | |
| 13 | GitOps deploy (no kubectl admin from CI) | | | |

### Cloud / secrets

| # | Control | Status | Owner | Evidence |
|---|---------|--------|-------|----------|
| 14 | Secrets in Vault/SM, not git | | | |
| 15 | Encryption at rest DB + backups | | | |
| 16 | No public object storage | | | |
| 17 | IAM least privilege for CI role | | | |
| 18 | Audit trail enabled | | | |

### Detection

| # | Control | Status | Owner | Evidence |
|---|---------|--------|-------|----------|
| 19 | Security alerts (audit, Falco, or CSPM) | | | |
| 20 | Runbook: leaked credential | | | |
| 21 | Postmortem template for Sev security | | | |

---

## Deliverable 3: Roadmap (квартал)

| Priority | Gap from baseline | Action | Course in mock-exams |
|----------|-------------------|--------|------------------------|
| P0 | | | |
| P1 | | | |
| P2 | | | |

Максимум **5** пунктов P0 — не всё сразу.

---

## Мастер-карта курса

```text
01–03  DevSecOps, TM, OWASP
04–08  Secrets, containers, K8s, CI, supply chain
09–11  Cloud, IaC, detection
12–14  SDLC, compliance, synthesis
```

| Собеседование | Ответ из курса |
|---------------|----------------|
| Как защитить K8s? | RBAC + NP + PSA + admission + audit |
| Как защитить CI? | OIDC, scan, branch protection, GitOps split |
| Supply chain? | SBOM + scan + cosign |
| Shift-left? | gates в MR, не только pentest |

---

## В mock-exams — практика по roadmap

| Gap | Куда идти |
|-----|-----------|
| SAST / Trivy | [gitlab-advanced](../gitlab-advanced/README.md) |
| RBAC / NP | [kuber-intermediate](../kuber-intermediate/README.md) |
| Kyverno / cosign | [kuber-advanced](../kuber-advanced/README.md) фазы 2, 4 |
| tfsec / OIDC | [aws-intermediate/21](../aws-intermediate/21-security-ci.md) |
| Vault | [secrets-basic](../secrets-basic/README.md) |
| Host | [linux-security](../linux-security/README.md) |
| Postmortem | [sre/09](../sre/09-postmortems.md) |

---

## Резюме курса

**AppSec Fundamentals** даёт язык и чеклисты для **DevSecOps на платформе**: от threat model до baseline в prod. Практика — в существующих курсах mock-exams; финал связывает теорию с **одним реальным сервисом**.

---

## Чек-лист финала

- [ ] Threat model согласован с tech lead?
- [ ] ≥ 80% baseline пунктов имеют owner?
- [ ] P0 roadmap ≤ 5 items с датами?

**Курс завершён.** Дальше: [gitlab-advanced](../gitlab-advanced/README.md), [kuber-advanced](../kuber-advanced/README.md), [aws-advanced](../aws-advanced/README.md) (security фаза).
