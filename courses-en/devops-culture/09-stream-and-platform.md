# 09. Stream-aligned and platform teams

## Intro

The most common failure: **platform** builds business features while **streams** wait for “a deploy from the DevOps folks.” Or the reverse — 12 streams stand up **their own** EKS “however they can.” This chapter is the **operating model** of the two pillars.

---

## Stream-aligned: minimal charter

A one-page document:

| Section | Content |
|--------|------------|
| Mission | user outcome |
| Services owned | repos, namespaces |
| SLO | link to [sre/03](../sre/03-sli-slo-sla.md) |
| On-call | rotation inside the squad |
| Dependencies | API/events on other streams |

**Owns** the runbook; doesn't “throw over the wall.”

---

## Platform: minimal charter

| Section | Content |
|--------|------------|
| Mission | speed up streams, reduce cognitive load |
| Products | CI templates, clusters, secrets, docs |
| SLO | IDP availability, lead time for template adoption |
| **Does not** | product features, custom one-offs without backlog |

Example platform backlog in mock-exams:

1. `mockctl up` one-liner + docs
2. GitLab template → build → push → deploy mockctl
3. kube-prometheus baseline
4. Vault auth for CI

---

## Cognitive load

Team Topologies introduces **three kinds of load**:

| Kind | Example | Who removes it |
|-----|--------|-------------|
| **Intrinsic** | checkout domain | stream |
| **Extraneous** | “how to set up TLS in ingress” | platform (golden path) |
| **Germane** | learning a new tool | enabling, then stream |

Platform **removes extraneous** — it doesn't “do their business logic for them.”

---

## Team API

**Team API** (a team's contract for others):

```markdown
## Platform team API
- Slack: #platform
- Docs: /platform/runbooks
- Request: GitLab issue template «platform-request»
- SLA: P2 — 2 business days, P1 — on-call
- Provides: EKS namespace, CI template v3, OTel collector endpoint
- Does NOT: write application code
```

A public API reduces **collaboration** to the necessary minimum.

---

## Team size

Guideline from **Team Topologies / Amazon two-pizza**:

- stream: **4–8** engineers on one clear flow;
- platform: **6–12** for many streams (with sub-groups by domain);
- stream too large → split by sub-domain.

---

## Summary

Stream **carries** value; platform **removes** friction. Both are measured by different metrics — don't mix them into one KPI.

---

## Checklist

- [ ] Does the stream have a written list of owned services?
- [ ] Does platform have a “we don't do”?
- [ ] Did platform remove one extraneous pain point last quarter?

**Next:** [10. CI/CD as a cultural contract](10-cicd-culture.md).
