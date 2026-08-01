# 07. Mistake, failure, postmortem

## Intro

"Tell me about a failure" is a trap for perfectionists. **No failure** = no honesty or no experience. You need a **real** mistake with a **systemic** learning.

---

## Structure

| Part | Focus |
|-------|-------|
| S/T | what broke, impact (users, money, time) |
| A | how you found it, mitigation, your contribution |
| R | fix + **process** (test, alert, runbook) |

Link to [sre/09 postmortems](../sre/09-postmortems.md): blameless, action items.

---

## Levels of failure

| Level | Example |
|---------|--------|
| Bug in a feature | caught on staging |
| Prod incident | rollback, MTTR |
| Process | skipped review, recurred |

For middle+ it's better to pick a **prod or near-prod** one with moderate impact (not "we lost millions" without context).

---

## What not to tell

- Deliberate violation of security/ethics.
- A story where you're the only one at fault with no remediation.
- A fresh, raw conflict with your current employer.

---

## Subtasks

**Time:** ~65 min.

### 7.1 Postmortem STAR (30 min)

An incident or a serious bug; metric MTTR or affected users.

### 7.2 Action items (15 min)

A list of 3 changes afterward (tests, monitoring, checklist).

### 7.3 No blame (10 min)

Rewrite it, removing names; keep the facts.

### 7.4 Follow-up answer (10 min)

"Would it recur today?" — honestly yes/no + why.

---

## Checklist

- [ ] Is there a process takeaway?
- [ ] Is the impact named?

**Next:** [08. Leadership](08-leadership.md).
