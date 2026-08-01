# 08. Incident management

## Intro: "everyone's in the chat, nobody's in charge"

14:02 — checkout returns 503. In Slack, developers, DevOps, support, and the CEO are all posting. Someone **restarts** Redis, another **rolls back** the release, a third **changes** the Ingress limit. After 20 minutes the service **comes back**, but nobody knows **what helped**, and **how many** users were affected. At 18:00 it repeats — the same hypotheses from scratch.

**Incident management** is not "fix it faster at any cost" but a **managed recovery** with roles, communication, and a record of decisions. SRE here is the **process and discipline**, not necessarily the deepest debugger.

---

## Incident vs problem vs ticket

| Term | Definition |
|--------|-------------|
| **Incident** | an unplanned drop in service quality for users |
| **Problem** | the root cause of a **class** of failures (can outlive the incident's closure) |
| **Ticket** | a unit of record in ITSM; an incident can spawn many tickets |

An incident is **closed** when the **SLO/service is restored**, not when "the culprit was found".

---

## Severity (an example scale)

The scale should be **internal**, agreed with support and the business:

| Level | Criterion (example) | Response |
|---------|-------------------|-------|
| **P0** | checkout/auth unavailable at scale; data loss | immediate page, IC, comms |
| **P1** | degradation of a core path, a workaround exists | page, IC |
| **P2** | important, but not core; a subset of users | working hours / extended on-call |
| **P3** | internal, cosmetic, workaround | ticket |

**Don't confuse** this with a bug-tracker priority. P0 is about the **user right now**.

Connection to the error budget: P0 often means a **fast burn** ([chapter 04](04-error-budgets.md)).

---

## Roles during an incident

```text
                    ┌─────────────────┐
                    │ Incident Cmd (IC)│
                    │ coordination     │
                    └────────┬────────┘
         ┌───────────────────┼───────────────────┐
         ▼                   ▼                   ▼
  ┌─────────────┐     ┌─────────────┐     ┌─────────────┐
  │ Tech lead   │     │ Comms       │     │ Scribe      │
  │ hypotheses, │     │ status page │     │ timeline,   │
  │ fixes       │     │ support     │     │ decisions   │
  └─────────────┘     └─────────────┘     └─────────────┘
         │
         ▼
  Subject matter experts (DB, network, vendor)
```

| Role | Does | Doesn't do |
|------|--------|-----------|
| **IC** | priorities, "stop/continue", synchronization | not required to do the deepest debug |
| **Tech lead** | hypotheses, kubectl, code, rollback | doesn't write to the status page |
| **Comms** | templates for support/PR, update frequency | doesn't touch prod |
| **Scribe** | time, action, result | doesn't argue about the tech instead of recording |

The **IC** is not "the most senior by grade" but a trained **facilitator**. In a small team one person combines roles — **deliberately**, not chaotically.

---

## Incident lifecycle

```text
Detect → Triage → Mitigate → Resolve → Document → Improve
```

| Phase | Goal | Typical mistakes |
|------|------|-----------------|
| **Detect** | learn before users do | no symptom alerts |
| **Triage** | severity, IC, channel | 5 parallel "fixes" |
| **Mitigate** | restore the **service** | getting stuck in root cause |
| **Resolve** | stable, monitoring | closing without checking the SLI |
| **Document** | postmortem | "we're tired, we'll skip it" |
| **Improve** | action items | actions without an owner |

**Mitigate vs fix:** first a **rollback**, **feature flag off**, **traffic shift** — then analyze **why**.

---

## Channel and ritual

Recommended minimum:

1. A channel `#inc-YYYYMMDD-shortname` (or a PagerDuty incident).
2. Zoom/Meet with **one** pinned link.
3. A **scribe doc** (Google Doc) — a live timeline.
4. An update **every N minutes** (P0: 15–30 min) from comms.

**Update template for leadership:**

```text
[14:35] P0 Checkout errors
Impact: ~15% failed payments EU
Status: mitigating — rollback deploy 4.2.1 in progress
Next update: 15:00
IC: @alice  Tech: @bob
```

---

## Timeline (what to write)

| Time | Event |
|-------|---------|
| T0 | first alert / support complaint |
| T1 | IC assigned, severity |
| T2 | hypothesis A — verification |
| T3 | action (rollback) — result |
| T4 | SLI restored |
| T5 | incident resolved |

The postmortem is built from the **scribe doc**, not from memory ([chapter 09](09-postmortems.md)).

---

## Escalation

| Level | When |
|---------|-------|
| L1 on-call | the first 15 min |
| L2 service owner | no progress |
| L3 platform / vendor | infra, cloud, CDN |
| Executive | prolonged P0, reputational risk |

**Escalation** is not a sign of weakness but a **contract** ([chapter 07](07-alerting-on-call.md)).

---

## Connection to releases

For an incident after a deploy:

1. **Record the version** (image tag, git SHA).
2. **Rollback** — if faster than a forward fix.
3. **Freeze** releases when the budget is low.

GitOps ([gitops-intermediate](../gitops-intermediate/05-rollback-history.md)) simplifies the **revert**; without GitOps — a documented rollback runbook.

---

## War room anti-patterns

| Anti-pattern | Cure |
|-------------|---------|
| "Everyone talks" | IC moderates, "one voice" |
| Hero debugging | distribute hypotheses |
| Hidden changes | all prod actions in the scribe |
| Premature "resolved" | criterion: SLI green for N min |
| Blame in the chat | remind of the blameless policy |

---

## Process metrics (not vanity)

| Metric | Why |
|---------|-------|
| **MTTD** | mean time to detect |
| **MTTR** | mean time to restore service |
| **MTTF** | time to find root cause (after mitigate) |
| Incidents / month by severity | trend |
| % incidents with a postmortem | discipline |

**MTTR** for SRE is measured up to **service recovery**, not up to "we found the bug in the code".

---

## Game Day and drills

A **Game Day** is a planned incident (turn off an AZ, kill a dependency) with a **real** IC/comms process. The goal is to train **people and the runbook**, not to "catch" the on-call.

Difference from chaos engineering: chaos targets the **system**; a Game Day targets the **organization**.

---

## In mock-exams

| Practice | Where |
|----------|-----|
| Alert → investigation | [observability-basic](../observability-basic/README.md) |
| GitOps rollback | [gitops-intermediate/06](../gitops-intermediate/06-lab-rollback.md) |
| Runbooks | [observability-advanced](../observability-advanced/README.md) |

Tabletop without prod: work through a "checkout 503" scenario on paper — roles, 10 lines of timeline.

---

## Interview notes

- The difference between mitigate and a root cause fix.
- Why an IC if there's a strong senior?
- What to write in the first comms update?
- How to close an incident — the criteria?

---

## Summary

An incident is a **project measured in hours**: roles, a channel, a timeline, restoring the **user experience**, then learning. Without an IC and a scribe you pay with **repeated** 40-minute chaos.

---

## Checklist

- [ ] Is there a severity matrix?
- [ ] Who can be an IC?
- [ ] A comms template and update frequency?
- [ ] Is the "resolved" criterion tied to an SLI?
- [ ] Your last P0 — was there a scribe doc?

**Next:** [09. Blameless postmortems](09-postmortems.md).
