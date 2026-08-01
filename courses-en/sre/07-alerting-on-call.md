# 07. Alerting and on-call

## Intro: "they woke us up, and there's nothing to do"

03:14, PagerDuty: **Critical: CPU > 90%**. The on-call engineer wakes up, looks — it's a nightly batch job, **expected**. At 09:00 — **Critical: checkout errors**, but the alert arrived **after** 20 min of downtime: the threshold is ">1% errors over 15 min". By lunchtime the on-call is **tired of ignoring** CPU — and missed the real one. SRE builds alerting as a **product**: every page costs money (sleep, reputation, burnout).

---

## Alerting principles

1. **Page only if action is needed now** (wake up).
2. **Symptom / SLO**, not a cause without context.
3. **Every alert** has a runbook link.
4. **Test** the alert (alertmanager test, game day).
5. **Regularly clean up** (quarterly alert review).

| Level | Channel | Example |
|---------|-------|--------|
| Page | PagerDuty, phone call | SLO fast burn, checkout down |
| Ticket | Jira, Slack next day | disk 70% |
| Log | dashboard only | dev staging noise |

---

## On-call models

| Model | Description |
|--------|----------|
| **Follow-the-sun** | handoff across time zones |
| **Primary + secondary** | backup if primary doesn't respond |
| **Embedded** | dev teams are on-call for their own service |
| **Central SRE** | platform + escalation |

**Required:**

- A **runbook** and an **escalation** (whom to call after 15 min).
- **Compensation** (time off, pay) — the culture depends on the company.
- **Blameless** — the on-call is not to blame for the incident.
- A **limit** on weeks/year per person.

---

## Alert fatigue

Causes:

- duplicate alerts (CPU + Memory + Pod restart for the same thing);
- flaky (self-resolving);
- "known noise" without a fix.

**The cure:** consolidation, `for: 5m`, inhibition in Alertmanager ([observability-intermediate/09](../observability-intermediate/09-alertmanager-routing.md)), **removing** the useless ones.

---

## SLO-based alerting

| Approach | When |
|--------|-------|
| Static threshold | a resource with a hard ceiling (disk 95%) |
| Burn rate | a user-facing SLO ([chapter 04](04-error-budgets.md)) |
| Anomaly detection | seasonal traffic (with caution) |

Example policy (concept):

- **Page** if burn > 14× over 1h **and** > 6× over 6h (multi-window).
- **Ticket** if budget < 25% over 30d.

---

## Escalation and communication

```text
L1 on-call (15 min) → L2 service owner → L3 platform → executive (P0 only)
```

The **status page** / support is the **comms** role, not the IC ([chapter 08](08-incident-management.md)).

---

## Tools

| Function | Examples |
|---------|---------|
| Routing | Alertmanager, PagerDuty, Opsgenie |
| Schedules | PagerDuty rotations |
| Incident channel | Slack `#inc-YYYYMMDD-checkout` |

---

## After-action for alerts

After every false page:

- **Tune** or **delete** the alert?
- Does the **runbook** need an update?

---

## On-call health and sustainability

| Practice | Why |
|----------|-------|
| Max 1 week primary / month | sleep |
| Handoff document | context at the handover |
| "No deploy" for the on-call day after | recovery |
| Post-incident debrief for the on-call | not just for the system |

On-call **burnout** is the risk of **missing** a real P0.

---

## Runbook minimum

```markdown
# Alert: CheckoutHighErrorRate

## Impact
Users cannot complete purchase.

## First steps (5 min)
1. Check SLO dashboard: ...
2. Recent deploys: ...
3. If deploy < 30m ago → rollback: ...

## Escalate
@payments-oncall → @platform after 15m
```

Without a runbook an alert is **panic**; with a runbook it's a **checklist**.

---

## Example burn-rate policy (in words)

At an SLO of 99.9% / 30d:

- **Page** if in 1h we spend budget like over 24h **and** in 6h like over 3d.
- **Ticket** if budget remaining < 25%.
- **Freeze** if < 10% ([chapter 04](04-error-budgets.md)).

Implementation: Prometheus + Alertmanager or SaaS SLO tools.

---

## Interview notes

- Page vs ticket vs log?
- How to fight alert fatigue?
- Follow-the-sun vs a single team?
- Why a secondary on-call?

---

## Checklist

- [ ] How many alerts last week **required** action?
- [ ] Is there a runbook URL in every critical?
- [ ] Are primary/secondary defined?
- [ ] Are SLO burn alerts configured?

**Next:** [08. Incident management](08-incident-management.md).
