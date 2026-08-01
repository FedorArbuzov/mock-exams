# 05. Toil, automation, and the limits of scripts

## Intro: "we're drowning in routine"

On-call over a week: **47 tickets** "restart the Pod", **12** "add disk", **8** "reset the password in staging". Automation is a single Python script that nobody maintains. A new engineer spends **3 days** on access. The SRE lead sees it: the team **doesn't have time** to do postmortem actions because it's **drowning in toil**. Google offers a guideline: **no more than 50%** of an SRE's time on toil — the rest on **engineering** that eliminates a class of problems.

---

## What toil is

**Toil** is operational work that is:

1. **Manual** — requires a human (until automated).
2. **Repetitive** — again and again.
3. **Automatable** — in principle a script/service could do it.
4. **Without long-term value** — doesn't make the system **more resilient** to a class of failures.
5. **Scales with the service** — the more load, the more toil.

**Not toil:** writing a controller that **permanently** fixes drift; a postmortem action; SLO design.

| Toil | Not toil |
|------|---------|
| manual restart | HPA + proper probes |
| copy-paste dashboard | generation from Terraform |
| "clean up the disk on the server" | auto-expansion of a PVC |
| on-call ticket "spin up staging" | self-service preview env |

---

## Why toil is dangerous

- **Burnout** of on-call.
- **Delay** of reliability work → more incidents → more toil (a **vicious circle**).
- **Bus factor** — only Vasya knows the ritual.
- A **false** sense of "we're ops, so we firefight" instead of "we fix the system".

---

## Measuring toil

Once a quarter (or after every incident):

| Metric | How |
|---------|-----|
| % of on-call time on toil | tags in tickets, survey |
| Top 5 repetitive tickets | ITSM / Jira report |
| Toil budget in a sprint | N story points on automation |

**Goal:** each quarter **−X%** of hours on the top-3 toil item.

---

## Hierarchy of eliminating toil

1. **Remove the cause** — why does the Pod restart? ([kuber-basic](../kuber-basic/README.md) probes, limits).
2. **Self-service** — the developer spins up a preview themselves ([gitlab-intermediate](../gitlab-intermediate/README.md)).
3. **Automation** — runbook → Job / Operator.
4. **Accept** (temporarily) — if it's cheaper than automation; **with a deadline**.

---

## Automation: traps

| Trap | Example |
|---------|--------|
| **Fragile script** | SSH + sed without idempotency |
| **Snowflake** | "only prod-2 works this way" |
| **No tests** | the script breaks prod at 3 a.m. |
| **No owner** | "Uncle Vova's script" |
| **100% coverage on day 1** | never ships |

**Good automation:** idempotent, versioned in Git, CI, rollback, **alert if it failed**.

Related: [gitops-basic](../gitops-basic/README.md), [aws-terraform](../aws-terraform/README.md).

---

## Runbook vs automation

| Runbook | Automation |
|---------|------------|
| steps for a human | executed by a machine |
| needed for a novel failure | for a **known** class |
| updated after a postmortem | code review |

Path: **runbook 3 times** → **automate** the 4th.

---

## Platform as anti-toil

An internal platform ([gitlab-intermediate](../gitlab-intermediate/README.md), paved road) removes toil **en masse**: a golden Dockerfile, standard probes, automatic deploy to staging.

SRE invests in **platform primitives**, not in **manually** "spinning up a service for Ivan".

---

## Delegating toil

Not everything should be done by SRE:

| Task | To whom |
|--------|------|
| app-level bug | dev team |
| AWS quota | finops / cloud team |
| access on HR offboarding | security + IAM automation |

SRE **advises** on guardrails; it does **not** become an "all-powerful helpdesk".

---

## Case: a week of on-call

| Day | Events | Toil? |
|------|---------|-------|
| Mon | 20× restart Pod OOM | yes — no limits |
| Tue | 1× novel DB corruption | no — investigation |
| Wed | 15× "flush the cache" | yes — no self-service |
| Thu | deploy + monitoring | no |
| Fri | 30× ticket access staging | yes — IAM automation |

**Bottom line:** 65/70 tickets are **toil** → project: limits + runbook automation + self-service portal.

---

## SRE time allocation (Google's guideline)

| Category | % |
|-----------|---|
| Toil | ≤50 |
| Project (reliability, automation) | ≥25 |
| On-call (including incidents) | the rest |

If project work is **0%** for three quarters, SRE turns into **operators**.

---

## In mock-exams: toil → fix

| Toil | Elimination |
|------|------------|
| Manual `kubectl scale` | [HPA](../kuber-intermediate/17-hpa.md) |
| Manual restart after OOM | requests/limits, probes [kuber-basic](../kuber-basic/README.md) |
| Manual image bump | [gitops](../gitops-basic/README.md) + CI |
| Manual terraform apply | [aws-terraform](../aws-terraform/README.md) pipeline |

---

## Interview notes

- Definition of toil (5 properties).
- An example of toil vs engineering work.
- Why the 50% rule?
- How to prioritize the automation backlog?

---

## Summary and checklist

Toil is a **tax on bad architecture**. SRE measures it, cuts it, automates it. The 50% rule is not dogma but a **signal**: if 80% is toil — you're not SRE, you're a NOC without a process.

- [ ] Name 3 toil tasks from your week.
- [ ] Which one will go away through automation in a month?
- [ ] What can you remove rather than automate?

**Next:** [06. Observability for SRE](06-observability-for-sre.md).
