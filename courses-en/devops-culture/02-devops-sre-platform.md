# 02. DevOps, SRE, Platform: roles and boundaries

## Intro

A “DevOps” job posting, “SRE” in the next chat, “Platform Team” in Confluence — three names, the same people on the call. Without **boundaries** — duplication or gaps.

Covered in depth in [sre/01](../sre/01-what-is-sre.md); here — the **organizational** angle.

---

## Comparison table

| | DevOps (culture) | SRE (practice) | Platform Engineering |
|---|-------------------|----------------|----------------------|
| **Focus** | end-to-end delivery | reliability with SLOs | a product for developers |
| **KPI** | lead time, frequency | error budget, toil | adoption, time-to-first-deploy |
| **Typical artifact** | pipeline template | SLO doc, runbook | IDP, golden path |
| **Attitude to risk** | release more often | measure and trade | standardize |

**One person** can wear all three “hats” — the problem is when **three teams** do the same thing without agreement.

---

## Where SRE sits in the organization

Models from [sre/13](../sre/13-organizing-sre.md):

- **Centralized** — standards, bottleneck risk;
- **Embedded** — deep ownership, inconsistency risk;
- **Hybrid** — platform SRE + liaison in squads.

SRE does **not replace** product DevOps responsibility: the squad still **owns** the service; SRE sets the reliability **frame**.

---

## Platform team

An **internal product** for developers:

```text
Developers (customers)
        ↓
Platform: K8s, CI, observability, secrets
        ↓
Cloud / bare metal
```

Platform success is **self-service**, not “a ticket in Jira.” Related: [finops/11](../finops/11-process-culture.md), [gitops-*](../gitops-basic/README.md).

---

## Conway preview

Team structure **mirrors** architecture ([chapter 05](05-conway-law.md)). If platform is “just another silo,” you get a **monolithic** ticket queue instead of a platform.

---

## Summary

DevOps is a **culture umbrella**; SRE is a **reliability specialization**; Platform is a **product team** for dev. Define the **interfaces** between them in writing.

---

## Checklist

- [ ] Who owns the CI template — platform or each squad?
- [ ] Is there an SLO owner beyond “the on-call admin”?
- [ ] Does platform measure adoption, or only cluster uptime?

**Next:** [03. DORA metrics](03-dora-metrics.md).
