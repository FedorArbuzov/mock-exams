# 14. Synthesis: threat model and security baseline

## Practice

Pick a service:

- [image-platform](../aws-intermediate/projects/image-platform/) (API + worker + S3 + CI), or
- a microservice from your work (API + DB + Redis + GitLab deploy on K8s).

**Time:** 2–3 hours.

---

## Deliverable 1: Threat Model (1 page)

**1. Scope** — a single service, prod namespace.

**2. DFD** — 6–10 blocks (user, ingress, app, db, ci, registry, vault/cloud SM).

**3. Assets** — a table: name, class (PII/secret/config), where it's stored.

**4. Top-5 threats (STRIDE)** — one line each: threat → impact → control (existing / planned).

**5. Trust boundaries** — at least 3, what crosses the boundary (TLS, auth, audit).

---

## Deliverable 2: Security Baseline (checklist)

Copy and fill in for **prod**:

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

## Deliverable 3: Roadmap (quarter)

| Priority | Gap from baseline | Action | Course in mock-exams |
|----------|-------------------|--------|------------------------|
| P0 | | | |
| P1 | | | |
| P2 | | | |

At most **5** P0 items — not everything at once.

---

## Course master map

```text
01–03  DevSecOps, TM, OWASP
04–08  Secrets, containers, K8s, CI, supply chain
09–11  Cloud, IaC, detection
12–14  SDLC, compliance, synthesis
```

| Interview question | Answer from the course |
|---------------|----------------|
| How do you secure K8s? | RBAC + NP + PSA + admission + audit |
| How do you secure CI? | OIDC, scan, branch protection, GitOps split |
| Supply chain? | SBOM + scan + cosign |
| Shift-left? | gates in the MR, not just a pentest |

---

## In mock-exams — practice by roadmap

| Gap | Where to go |
|-----|-----------|
| SAST / Trivy | [gitlab-advanced](../gitlab-advanced/README.md) |
| RBAC / NP | [kuber-intermediate](../kuber-intermediate/README.md) |
| Kyverno / cosign | [kuber-advanced](../kuber-advanced/README.md) phases 2, 4 |
| tfsec / OIDC | [aws-intermediate/21](../aws-intermediate/21-security-ci.md) |
| Vault | [secrets-basic](../secrets-basic/README.md) |
| Host | [linux-security](../linux-security/README.md) |
| Postmortem | [sre/09](../sre/09-postmortems.md) |

---

## Course summary

**AppSec Fundamentals** gives you the language and checklists for **DevSecOps on a platform**: from threat model to a baseline in prod. The practice lives in the existing mock-exams courses; the final ties the theory to **one real service**.

---

## Final checklist

- [ ] Is the threat model agreed with the tech lead?
- [ ] Do ≥ 80% of baseline items have an owner?
- [ ] Is the P0 roadmap ≤ 5 items with dates?

**Course complete.** Next: [gitlab-advanced](../gitlab-advanced/README.md), [kuber-advanced](../kuber-advanced/README.md), [aws-advanced](../aws-advanced/README.md) (security phase).
