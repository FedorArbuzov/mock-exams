# 13. How to embed SRE in a company

> **The organization is broader than SRE:** DORA, Team Topologies, Conway — [`devops-culture`](../devops-culture/README.md).

## Intro: "we hired two SREs — they firefight tickets"

The company announced "we're doing SRE", hired engineers with Kubernetes, but there are **no SLOs**, postmortems are "optional", on-call is the **same** devs without compensation. A year later — burnout, turnover, and the statement "SRE doesn't work". The problem is not the **role's name** but the **model**: where the function sits, what **authority** it has, how success is **measured**.

---

## Organizational models

| Model | Description | Pro | Con |
|--------|----------|------|-------|
| **Centralized SRE** | one team for many services | standards, expertise | bottleneck, "someone else's" services |
| **Embedded** | SRE inside a product squad | ownership | inconsistent practices |
| **Hybrid** | platform SRE + embedded liaison | balance | matrix complexity |
| **Consulting** | SRE reviews, doesn't go on-call | advice at scale | no 24/7 depth |

Google: **production engineering** is mixed; a startup has **no** separate team but **does** have 2 SLOs.

---

## Size and ratio

Guidelines (not dogma):

- **~1 SRE per 5–10** critical services or **1:10** dev for mature systems;
- fewer if the **platform** has heavily automated toil.

**Scope** matters more: "SRE owns the observability **platform** + **advises** on product SLOs".

---

## SRE authority

| Needed | Why |
|-------|-------|
| Release veto at **0 budget** | otherwise SLOs are meaningless |
| Priority for the reliability backlog | otherwise toil is ∞ |
| Prod access (audited) | investigation |
| Participation in architecture review | shift-left |

Without authority, SRE = **NOC++**.

---

## Hiring and grades

| Skill | Junior SRE | Senior SRE |
|-------|------------|------------|
| K8s/network | basics | deep |
| Coding | scripts | production automation |
| SLO/incidents | participation | running the process |
| Comms | scribe | IC |

**Not just** "knows Prometheus" — **systems thinking** and **communication**.

---

## On-call model by organization

| Model | When |
|--------|-------|
| Dev team on-call | you build it you run it |
| SRE primary | immature app, heavy ops |
| Follow-the-sun | global product |

Compensation, a shift limit — **HR policy**, not "voluntary".

---

## SRE function maturity metrics

| Level | Signs |
|---------|----------|
| 0 | no SLO, hero culture |
| 1 | SLO on 1–2 services, postmortems sometimes |
| 2 | budget policy, burn alerts, quarterly drill |
| 3 | self-service platform, low toil, Game Days |

**Don't chase** level 3 in the first year.

---

## Relationships with Platform and Security

```text
Platform ──► paved road, IDP
SRE      ──► SLO, incidents, capacity, review
Security ──► policy, audit, compliance
```

Conflict: Security blocks a deploy; SRE helps **automate compliance** ([secrets-*](../secrets-basic/README.md), policy in CI).

---

## Rollout from scratch (12 months)

| Quarter | Focus |
|---------|-------|
| Q1 | 1 CUJ, SLO doc, incident channel |
| Q2 | burn alerts, postmortem template |
| Q3 | error budget policy, kill the top toil |
| Q4 | DR tabletop, PRR for launch |

---

## Checklist

- [ ] Which model (central/embedded)?
- [ ] Is there a veto/freeze on budget?
- [ ] On-call compensation?
- [ ] Who owns the SLO doc?

**Next:** [14. Production readiness](14-production-readiness.md).
