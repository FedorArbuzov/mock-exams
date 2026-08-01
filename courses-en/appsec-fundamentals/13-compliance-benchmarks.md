# 13. Compliance and benchmarks for engineers

## Intro

**Compliance** (PCI DSS, 152-FZ, industry-specific insurance requirements) defines **what to prove to an auditor**. An engineer needs **benchmarks** — concrete hardening checklists, not just PDF policies.

---

## Benchmarks (practice)

| Benchmark | Area |
|-----------|---------|
| **CIS Kubernetes** | API, kubelet, RBAC |
| **CIS Docker** | daemon, images |
| **CIS AWS Foundations** | IAM, logging, networking |
| **CIS PostgreSQL** | auth, logging |

Tools: **kube-bench**, **Docker bench**, **Prowler** (AWS) — report + remediation hints.

---

## What auditors usually require

| Topic | Artifact |
|------|----------|
| Access control | IAM matrix, RBAC export |
| Encryption | KMS keys, TLS configs |
| Logging | retention policy, sample logs |
| Change management | MR history, approvals |
| Vulnerability mgmt | scan reports, SLA |
| Backup / DR | RTO/RPO doc, test record |
| Incident response | runbooks, postmortems |

Related: [sre/12](../sre/12-disaster-recovery.md), [postgresql-security/12](../postgresql-security/12-compliance.md).

---

## 152-FZ and personal data (Russia, overview)

| Requirement | Infra answer |
|------------|-------------|
| Localization of personal data | Russia region / YC zone |
| Access accounting | audit logs |
| Protection in transit | TLS |
| Backups | encrypted backup |

**Lawyers** interpret the law; the engineer **implements** the controls per their matrix.

---

## Insurance (job context)

| Risk | Control |
|------|----------|
| Leak of policy data | encryption, DLP (optional), access logs |
| Unavailability | HA, DR drills |
| Tampering with a calculation | integrity monitoring, signed releases |
| Third-party | vendor security questionnaire |

Tie the threat model from [chapter 02](02-threat-modeling.md) to **concrete assets** (policy, payment, medical data).

---

## Segregation of duties

| Role | Must not |
|------|-----------|
| Developer | apply to prod alone |
| DevOps | approve their own MR to a prod policy |
| Security | be the sole holder of root (anti-pattern) |

**Four eyes** on prod Terraform apply and break-glass access.

---

## Documentation minimum

For a namespace / service, keep in Git:

- `SECURITY.md` — contacts, reporting
- `threat-model.md` — update on major changes
- `baseline.yaml` — Kyverno policies list
- `exceptions.md` — time-boxed waivers

---

## In mock-exams

| Topic | Course |
|------|------|
| PG compliance | [postgresql-security](../postgresql-security/README.md) |
| Linux audit | [linux-security/12–13](../linux-security/12-audit-review.md) |
| AWS governance | [aws-advanced/01–05](../aws-advanced/README.md) |

---

## Summary

Compliance for an engineer is **benchmarks + evidence of controls + an audit trail**. Automate CIS checks in CI/CD and produce quarterly reports.

---

## Checklist

- [ ] Have you run kube-bench / an equivalent on the cluster?
- [ ] Is there a "role → prod access" matrix?
- [ ] Does log retention match the policy?

**Next:** [14. Synthesis](14-synthesis.md).
