# 09. Blameless postmortems

## Intro: "who pressed the button"

The incident is closed at 17:00. The next day in the chat: "**who** shipped without review". The developer goes quiet; the team lead defends; SRE writes a long PDF that **nobody reads**. A month later — the **same** outage — a DB migration without a backup test.

A **blameless postmortem** is not "everyone did great" but a **focus on the system**: what **conditions** allowed the error to reach the user, and how to **change** the process/architecture/tools so the class recurs with a lower probability.

---

## Postmortem goals

| Goal | Not a goal |
|------|---------|
| Understand the **timeline** and contributing factors | find the guilty party |
| **Action items** with an owner and a deadline | 40 pages for the sake of a report |
| Share the lesson with the company | hide the truth from the customer |
| Improve the **next** incident | punishment |

---

## When to write

| Rule (example) | |
|------------------|---|
| All **P0/P1** | mandatory |
| P2 with unusual damage | yes |
| A recurrence within 30 days | mandatory + escalation |
| A "trifle" with no user impact | optional short note |

**Deadline:** a draft within **48–72 h**, while the facts are fresh; review at the weekly reliability meeting.

---

## Document structure

```markdown
# Postmortem: Checkout failures 2026-05-18

## Metadata
- Severity: P0
- Duration: 14:02–14:47 UTC (45 min)
- Authors: @scribe, @IC
- Status: Draft | Final

## Summary (2–3 sentences)
What happened for the user.

## Impact
- % failed checkouts, regions, approximate revenue at risk
- Error budget consumed: ~12% monthly

## Timeline (UTC)
| Time | Event |
|------|-------|
| 14:02 | Alert: checkout error rate > 5% |
| 14:05 | IC assigned, channel opened |
| ... | |

## Root cause (technical)
Briefly: connection pool exhaustion after deploy X.

## Contributing factors
- No canary on dependency Y
- Load test didn't cover peak
- Runbook was outdated

## What went well
- Rollback in 12 min
- Comms every 15 min

## What went wrong
- MTTD 8 min (the alert was late)
- Two parallel rollbacks

## Action items
| ID | Action | Owner | Priority | Due |
|----|--------|-------|----------|-----|
| 1 | Add pool metric + alert | @team-db | P1 | 2026-06-01 |
| 2 | Canary on deploy path | @team-pay | P1 | 2026-06-15 |

## Lessons learned
One paragraph for a broad audience.
```

---

## Root cause vs contributing factors

| | Root cause | Contributing factor |
|---|------------|---------------------|
| Essence | the **immediate** technical mechanism | a condition that **amplified** it |
| Example | pool max=10 at RPS×2 | no HPA, no migration review |

One incident has **several** contributing factors; "a single cause" is often an **oversimplification**.

**Five whys** — useful, if you don't turn it into an interrogation:

1. Why a 503? — pool exhausted
2. Why exhausted? — the new code holds connections longer
3. Why didn't we notice? — no active-connections metric
4. Why no metric? — not in the PRR checklist
5. Why not in the PRR? — …

---

## Blameless language

| Blaming | Blameless |
|---------|-----------|
| "Ivan shipped it" | "Deploy 4.2.1 passed the pipeline without a canary gate" |
| "They didn't read the doc" | "The runbook wasn't linked from the alert" |
| "Human error" | "The system allowed an irreversible action without a dry-run" |

**Human error** is not a term for closing an investigation.

---

## Action items: quality

A good action:

- **Measurable** — "alert on pool > 80%"
- **With an owner** — a specific team/person
- **With a date** — otherwise it's an ∞ backlog
- **Prioritized** — P0 actions before a feature freeze

Bad: "be more careful", "improve communication" without a process.

**Connection to Jira:** the `reliability` label, tracked at review.

---

## Review meeting

30–60 min, participants: IC, tech, PM, optionally support.

1. Scribe walks through the timeline (5 min).
2. Clarifications (10 min).
3. Action items — the owner **confirms** in the room (10 min).
4. "What the company learned" (5 min).

The **record** is for those who weren't in the incident; **not** for public shaming.

---

## Publication and security

| Audience | Content |
|-----------|------------|
| Engineering (wide) | the full doc |
| Leadership | summary + budget impact |
| Customers | status page language, no internal names |

Secrets, 0-days, PII — **redact**. A credential leak in a postmortem — **rotate**, don't copy into the doc.

---

## Culture: when a postmortem "doesn't work"

| Symptom | Cure |
|---------|---------|
| Actions never close | reliability sprint, WIP limit |
| Copy-paste from the last one | template + mandatory unique timeline |
| Fear | leadership participates blamelessly |
| Only SRE writes | the dev on-call writes the draft |

---

## Connection to the error budget

A postmortem with a **large burn** is the entry into a **policy freeze** ([chapter 04](04-error-budgets.md)). Leadership wants to see: **what will change** so as not to burn the remaining budget.

---

## In mock-exams

Write a postmortem for the tabletop from [chapter 08](08-incident-management.md) — at minimum a timeline + 3 action items.

Runbook culture: [observability-advanced](../observability-advanced/README.md).

---

## Interview notes

- Blameless — what does it **not** mean?
- The difference between mitigate and root cause in a postmortem.
- An example of a good vs a bad action item.
- Why a timeline in UTC?

---

## Summary

A postmortem is an **investment** in reducing the frequency and duration of future incidents. Without actions it's an **archive of complaints**; with actions and review it's a **mechanism** for the system's evolution.

---

## Checklist

- [ ] A postmortem template in the wiki/Git?
- [ ] Your last P0 — is there a doc < 72h?
- [ ] ≥1 action closed last quarter from a postmortem?
- [ ] Is the doc's language blameless?

**Next:** [10. Capacity, performance, cost](10-capacity-performance.md).
