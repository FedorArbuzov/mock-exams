# 02. Threat modeling: STRIDE and trust boundaries

## Intro

Before buying a WAF, ask: **who and what are we protecting against?** A threat model is a structured answer: assets, trust boundaries, threats, countermeasures. For DevOps this isn't "just for AppSec": you need the model for a **K8s namespace, CI runner, S3 bucket**.

---

## Assets and trust boundaries

| Asset | Examples |
|-------|---------|
| Data | PII, policies, payments, logs with emails |
| Secrets | API keys, kubeconfig, Terraform state |
| Services | API, worker, admin UI |
| Infrastructure | cluster, registry, Vault |

A **trust boundary** is a line where the level of trust changes:

```text
[ Internet ] ----boundary---- [ Ingress / WAF ]
                                    |
[ Ingress ] ----boundary---- [ App namespace ]
                                    |
[ App ] ----boundary---- [ Data: RDS / Vault ]
```

Every boundary is a candidate for **authentication, encryption, audit**.

---

## STRIDE (briefly)

| Threat | Meaning | Example in infra |
|--------|--------|----------------|
| **S**poofing | impersonating an identity | forged JWT, stolen SA token |
| **T**ampering | modifying data | MITM without TLS, tampered image |
| **R**epudiation | denying an action | no audit log |
| **I**nformation disclosure | leak | S3 public, `kubectl logs` with passwords |
| **D**enial of service | unavailability | flood Ingress, etcd full |
| **E**levation of privilege | more rights | cluster-admin SA in the default NS |

For the **pipeline**: Spoofing (forged commit), Tampering (poisoned dependency), Elevation (runner with prod credentials).

---

## Data flow diagram (DFD)

The minimum for a single service:

```text
User → TLS → Ingress → Service → Pod → RDS
              ↓
           GitLab CI → Registry → deploy
```

Mark:

- the protocol and where **TLS terminates**;
- where **secrets** appear (env, Vault, K8s Secret);
- **who** can call each component.

---

## Lightweight process (1–2 hours)

1. **Scope** — a single service or namespace.
2. **Diagram** — 5–10 blocks, not the whole company.
3. **STRIDE per boundary** — top 5 risks.
4. **Controls** — what's already there, what to add.
5. **Backlog** — issues with an owner and severity.

Don't wait for the perfect diagram in Visio — **Markdown + ASCII** is enough.

---

## Common mistakes

| Mistake | Consequence |
|--------|-------------|
| TM only on paper | not updated after migrating to K8s |
| "We have a firewall" | insider / compromised CI not modeled |
| One huge TM for the whole holding | nothing gets implemented |
| No prioritization | 200 "threats" with no actions |

---

## In mock-exams

| Practice | Course |
|----------|------|
| Threat model of a host | [linux-security/01](../linux-security/01-threat-model.md) |
| Production readiness | [sre/14](../sre/14-production-readiness.md) |
| Security zones | [networking-deep/14](../networking-deep/14-security-zones.md) |

---

## Summary

A threat model connects **architecture** to **concrete controls**. STRIDE is a cheat sheet, not a ritual; the DFD is a way to not forget CI and secrets.

---

## Checklist

- [ ] Draw 3 trust boundaries for your API.
- [ ] One Spoofing threat and one Elevation threat for CI?
- [ ] Where do you have a repudiation risk (no audit)?

**Next:** [03. OWASP and the application layer](03-owasp-app-layer.md).
