# 11. Changes as the main risk

## Intro: "nothing was falling over until we shipped"

Industry statistics (and Google's experience): **most** production outages are related to **changes** — code, config, infra, ACL, DNS. Hardware fails less often than a **release on Friday at 17:00**. SRE is not "against changes" — changes are **needed** for the product — but behind **speed** stands **discipline**: canary, feature flags, GitOps, review, a freeze when the budget is low.

---

## Types of changes

| Type | Example | Risk |
|-----|--------|------|
| **Application** | a new binary | logic bugs |
| **Config** | feature flag | instant blast |
| **Infrastructure** | node upgrade | platform-wide |
| **Data** | schema migration | irreversible |
| **Traffic** | DNS cutover | 100% users |

Each type has its own **runbook** and **rollback time**.

---

## Change management without bureaucracy

| Principle | Practice |
|---------|----------|
| **Small batches** | small PRs, frequent deploys |
| **Automate** | CI/CD, GitOps ([gitops-*](../gitops-basic/README.md)) |
| **Observable** | deploy markers on dashboards |
| **Reversible** | rollback < 15 min |
| **Gated** | canary, approval on risk |

A **CAB** (Change Advisory Board) in an enterprise is useful for **shared infra**; for a product team — an **automated policy** + an SLO gate.

---

## Canary and progressive delivery

```text
1% traffic → metrics OK → 10% → 50% → 100%
         ↘ fail → rollback
```

| Canary signal | Threshold |
|---------------|-------|
| Error rate | vs baseline + ε |
| Latency p99 | +X% |
| Business metric | conversion drop |

**Flagger**, Argo Rollouts, mesh traffic split — the tools; the **point** is early failure with a small blast radius.

---

## Feature flags

| Pro | Con |
|------|-------|
| kill switch without a redeploy | flag debt, complexity |
| cohort rollout | unclosed flags |

SRE requires: an **owner** for the flag, a **TTL**, an audit of who enabled it in prod.

---

## GitOps and immutable artifacts

```text
CI: build image digest abc123
GitOps: update tag abc123
Argo: sync
```

A **digest**, not `latest` — reproducibility ([gitlab-advanced/11](../gitlab-advanced/11-gitlab-and-argocd.md)).

---

## Database migrations

| Rule | Why |
|---------|-------|
| **Backward compatible** expand | app v1 and v2 coexist |
| **Two-phase** deploy | add column → migrate → remove old |
| **Backup before** | data rollback |
| **Test on a copy** | prod-like volume |

The expand-contract pattern — a must-know for an SRE interview.

---

## Release freeze

When the **error budget < 10%** ([chapter 04](04-error-budgets.md)):

- only hotfixes and security;
- exceptions — VP + written risk acceptance.

A **change freeze** for the holidays is a separate business decision.

---

## Deployment metadata

Every deploy should leave behind:

- the git SHA / image digest in the Pod's **annotations**;
- an event in CI;
- a **Grafana annotation** "deploy service X".

An incident "after 14:10" → the **version** is immediately visible ([chapter 06](06-observability-for-sre.md)).

---

## In mock-exams

| Practice | Course |
|----------|------|
| GitLab pipeline | [gitlab-intermediate](../gitlab-intermediate/README.md) |
| Argo sync | [gitops-basic](../gitops-basic/README.md) |
| Helm values | [kuber-intermediate/07](../kuber-intermediate/07-helm.md) |

---

## Checklist

- [ ] Was a rollback tested in the last quarter?
- [ ] Canary on the critical path?
- [ ] DB migrations — expand-contract?
- [ ] Deploy visible on the SLO dashboard?

**Next:** [12. DR, RTO/RPO](12-disaster-recovery.md).
