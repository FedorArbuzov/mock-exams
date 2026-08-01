# 14. Production readiness and launch

## Intro: "we launch Monday — didn't finish the checklist"

A new service goes to **a million users** after an MVP in staging. There are no Pod **limits**, no **runbook**, no **on-call rotation**, and metrics — "we'll add them later". Launch day — P0, executives on the line. A **Production Readiness Review (PRR)** is a gate that **doesn't slow you down** for bureaucracy's sake but **moves** known failures **ahead of** the user.

---

## PRR / Launch checklist

Adapt it to the service; an example **minimum**:

### Architecture & dependencies

- [ ] CUJ diagram and dependencies
- [ ] Failure modes documented ([chapter 02](02-reliability-and-risk.md))
- [ ] Timeouts, retries, circuit breakers on external APIs
- [ ] Blast radius limited (no shared fate with beta)

### Observability

- [ ] SLI/SLO doc approved ([chapter 03](03-sli-slo-sla.md))
- [ ] Dashboards + burn alerts ([chapter 07](07-alerting-on-call.md))
- [ ] Logs structured, trace propagation (if distributed)
- [ ] Deploy annotations

### Operations

- [ ] Runbook: deploy, rollback, scale, common failures
- [ ] On-call rotation named
- [ ] Escalation path
- [ ] Capacity estimate + load test report ([chapter 10](10-capacity-performance.md))

### Security & compliance

- [ ] Secrets not in Git ([secrets-basic](../secrets-basic/README.md))
- [ ] RBAC least privilege
- [ ] Dependency scan in CI ([gitlab-advanced](../gitlab-advanced/README.md))

### Data

- [ ] Backup + restore tested
- [ ] Migration plan expand-contract ([chapter 11](11-change-and-release.md))
- [ ] RPO/RPO tier assigned ([chapter 12](12-disaster-recovery.md))

### Release

- [ ] Canary/blue-green path
- [ ] Feature flags for risky parts
- [ ] Freeze window agreed with PM

---

## Who participates in the PRR

| Role | Contribution |
|------|-------|
| Service owner (dev EM) | accountable |
| SRE | SLO, ops, capacity |
| Security | threat model |
| PM | launch risk acceptance |
| Legal/support | SLA, comms template |

**Outcome:** Go / No-Go / Go with conditions (written).

---

## Gradual launch

| Stage | Audience |
|------|-----------|
| Internal dogfood | employees |
| Beta % users | flag cohort |
| Single region | geo limit |
| GA | all |

Each stage has **promote criteria** based on the SLI.

---

## "No-Go" without offense

SRE **blocks** not "because they're mean" but by **policy** (budget, missing alerts). The alternative: a **launch with limited** traffic + a date for a repeat PRR.

---

## Legacy services

PRR **retroactively** for old systems: **tier-1** first, **tier-3** — a simplified checklist. A **technical debt register** — a visible backlog.

---

## In mock-exams

Run the checklist for the [`deploy/observability`](../../deploy/observability/README.md) demo-app as a training service — what's already there, what's missing for "prod".

---

## Checklist

- [ ] Is there a PRR template in the org?
- [ ] Your last launch — was there a review?
- [ ] Has a No-Go ever fired constructively?

**Next:** [15. The economics of reliability](15-economics-of-reliability.md).
