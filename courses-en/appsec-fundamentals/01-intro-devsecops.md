# 01. AppSec, DevSecOps and shift-left

## Intro

"Security comes at the end of the sprint, as a separate ticket" leads to **panic before an audit** and expensive rework. **DevSecOps** embeds controls into the **same flow** as code and infrastructure: catching things early is cheaper than an incident in prod.

**AppSec** (Application Security) protects **applications and data** (vulnerabilities, authentication, logic). **Infrastructure / Cloud Security** protects the **platform** (K8s, IAM, network, encryption). In practice a DevOps engineer sits at the intersection of both.

---

## Three pillars

| Pillar | Question | Examples |
|-------|--------|---------|
| **People** | Who owns the risk? | security champion on the team, training |
| **Process** | When do we check? | threat model at design, gate in the MR |
| **Technology** | What do we automate with? | SAST, Trivy, Kyverno, GuardDuty |

Without process, tools produce **noise**; without technology, process doesn't scale.

---

## Shift-left vs shift-everywhere

```text
Design → Code → Build → Deploy → Run
   ↑        ↑       ↑        ↑       ↑
  TM      SAST    scan    policy  runtime
```

| Phase | Control | Cost to fix |
|------|----------|----------------------|
| Design | threat model, data classification | low |
| Code | SAST, secret scan | low–medium |
| Build | dependency + image scan | medium |
| Deploy | IaC scan, admission | medium |
| Run | audit, Falco, alerts | high (already in prod) |

**Shift-left** isn't "only before merge" — it's **earlier along the chain**, plus **continuity in runtime**.

---

## DevSecOps vs the "security department"

| Model | Pro | Con |
|--------|------|-------|
| Central security team | expertise, standards | bottleneck, a "wall" |
| Embedded champion | product context | incomplete coverage |
| **Platform + policy** | self-service guardrails | needs a mature platform |

In mock-exams the platform is **GitLab CI + mockctl + Terraform**: the security team defines **policies and templates**, and teams **execute them in the MR**.

---

## Roles at the intersection

| Role | Focus |
|------|--------|
| AppSec engineer | code, API, SAST/DAST, SDLC |
| Cloud security | IAM, landing zone, CSPM |
| **DevSecOps / Platform** | K8s, CI/CD, IaC, automation |
| SRE | reliability; security is part of SLOs and blast radius |

Related: [devops-culture/02](../devops-culture/02-devops-sre-platform.md), [sre/14-production-readiness](../sre/14-production-readiness.md).

---

## Metrics (not vanity)

| Metric | Why |
|---------|--------|
| **MTTR security finding** | speed of closing criticals |
| **% of MRs that passed the security pipeline** | adoption |
| **Mean time to patch CVE (base image)** | supply chain |
| **Misconfig open > 30 days** | governance |

Not to be confused with "number of vulnerabilities found" without the context of severity and age.

---

## In mock-exams

| Practice | Course |
|----------|------|
| Pipeline security | [gitlab-advanced](../gitlab-advanced/README.md) |
| Container hardening | [containers-basic/14](../containers-basic/14-security.md) |
| K8s admission | [kuber-advanced/11](../kuber-advanced/11-lab-validating-webhook.md) |
| Cloud audit | [aws-advanced/21](../aws-advanced/21-guardduty-config-trail.md) |

---

## Summary

DevSecOps is **culture and automation** across the entire lifecycle. The infrastructure engineer is responsible for a **secure platform**; the product team is responsible for **secure code** within the guardrails.

---

## Checklist

- [ ] Name the three phases where it's cheapest to catch a vulnerability.
- [ ] How does AppSec differ from cloud security in your project?
- [ ] Do you have a security gate in the MR?

**Next:** [02. Threat modeling](02-threat-modeling.md).
