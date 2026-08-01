# 12. Secure SDLC: gates, exceptions, risk

## Intro

**Secure SDLC** isn't "yet another approval" — it's **repeatable gates** with clear criteria: what blocks a merge, how to file an exception, who accepts the risk.

---

## Gates by stage

| Stage | Gate | Owner |
|--------|------|-------|
| Design | threat model checklist | tech lead |
| Dev | SAST, unit tests | developer |
| MR | secret scan, dep scan | CI |
| Build | container scan HIGH+ | CI |
| Deploy | IaC scan, signed image | platform |
| Prod | PSA restricted, NP | platform |

```text
Fail gate → fix OR documented exception (time-boxed)
```

---

## Severity and SLA

| Severity | Example | SLA fix |
|----------|--------|---------|
| Critical | RCE, public bucket | 24–72h |
| High | privileged pod template | 2 weeks |
| Medium | missing resource limits | sprint |
| Low | info disclosure in dev | backlog |

Align with the business's **risk appetite** (insurance is stricter).

---

## Risk acceptance (exception)

The minimum in the ticket:

- CVE or finding ID
- **Business justification**
- **Compensating controls** (WAF, network isolation)
- **Expiry date** (max 90 days)
- **Approver** (security + product)

Forbidden: `allow_failure: true` forever in `.gitlab-ci.yml`.

---

## Security champions

| Role | Time | Tasks |
|------|-------|--------|
| Champion in the squad | ~10% | review TM, triage SAST |
| Central platform | full-time | policies, tooling |

Related: [devops-culture/09](../devops-culture/09-stream-and-platform.md).

---

## Training

| Audience | Topic |
|-----------|------|
| Devs | OWASP, secure coding |
| DevOps | K8s misconfig, IAM |
| All | phishing, secret hygiene |

A once-a-year "course" without practice doesn't work — you need **labs** in mock-exams.

---

## Metrics for improvement

| Metric | Anti-pattern |
|---------|--------------|
| Time to remediate critical | hiding in "won't fix" |
| % repos with SAST | manual-only review |
| Repeat findings | the same SG rule every quarter |

---

## Working with compliance

An audit will ask for **evidence** of a gate (pipeline screenshot, policy export). Keep:

- Kyverno ClusterPolicy in Git
- `.gitlab-ci.yml` security stages
- Exception register

---

## In mock-exams

| Topic | Course |
|------|------|
| CI culture | [devops-culture/10](../devops-culture/10-cicd-culture.md) |
| GitLab security | [gitlab-advanced](../gitlab-advanced/README.md) |
| Production readiness | [sre/14](../sre/14-production-readiness.md) |

---

## Summary

SDLC security is **automated gates + transparent exceptions + owners**. The platform provides **templates**; the product doesn't bypass them without a record.

---

## Checklist

- [ ] Are SLAs by severity defined?
- [ ] Is there an exception register with an expiry?
- [ ] Is a security stage required on main?

**Next:** [13. Compliance](13-compliance-benchmarks.md).
