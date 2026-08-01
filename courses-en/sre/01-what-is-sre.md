# 01. What is SRE: history, role, boundaries

## Intro: "we have DevOps, but prod still burns"

Friday, 23:40. Checkout returns 503, three Slack channels are active: `#devops-alerts`, `#backend-oncall`, `#support-escalation`. The on-call engineer restarts Pods, a developer rolls back the release, a manager asks "when will it be fixed". A week later the same story — but this time because of a full disk on Kafka. The team calls itself **DevOps**, but there is no shared answer to the questions: *what level of unavailability is acceptable*, *how many releases per month can we risk*, *who owns the incident*, *what counts as "fixed"*.

**Site Reliability Engineering (SRE)** is not a set of tools and not a synonym for "an admin who knows Kubernetes". It is an **engineering approach to the reliability of product systems**: measurable goals (SLO), an error budget, incident discipline, and a conscious trade-off between **the speed of change** and **stability**. This chapter lays out the map of the territory; the details of SLIs, incidents, and capacity are in the following chapters.

---

## Where SRE came from

In the early 2000s Google hit a scale at which classic operations ("admins per servers") did not scale together with the products. Development teams wanted to **ship often**, while operations wanted to **not break things**. Ben Treynor Sloss framed the idea: **hand production operations to the same engineers** who design the systems — but with **different KPIs**: not "close the ticket", but **keep the service within SLO**.

The book *Site Reliability Engineering* (2016, free from Google) codified the practices:

- **SLO instead of "it should be stable"**
- **Error budget** as permission to take risk
- **Toil** — the enemy that must be measured and burned down
- **Blameless postmortem** — learning, not execution

Today SRE is the **de facto standard** in large tech companies; in mid-sized teams it is a mix of "platform + on-call + SLO document" roles.

---

## Defining SRE in one phrase and in full

**Short:** SRE is the application of **software engineering** to **operational** reliability problems.

**In full:** an SRE team (or role) **designs** systems to withstand the real world (failures, spikes, bad releases), **measures** the user experience through SLI/SLO, **responds** to deviations (alerts, incidents), **learns** (postmortem), and **negotiates** with product: more features — less reliability margin, and vice versa.

| Emphasis | Not SRE | SRE |
|--------|--------|-----|
| Goal of the shift | "put out the fire" | restore **SLO** and eliminate a class of recurrences |
| Success metric | server uptime | **availability of the user journey** |
| Releases | "whenever we get to it" | within the **error budget** |
| Documentation | wiki "how to restart" | SLO doc + runbook + postmortem |

---

## SRE vs DevOps vs Platform Engineering

The terms overlap; the confusion is normal.

### DevOps

**DevOps** is a cultural and organizational thesis: **reduce the wall** between dev and ops, automate delivery, ownership of "you build it, you run it". DevOps **does not set** a number for how much downtime is acceptable.

### Platform Engineering

**Platform** (Internal Developer Platform) is a **product for developers**: CI, clusters, templates, golden paths. The goal is **speed and standardization**. A platform can **include** SRE practices (SLO dashboards, a paved road with probes), but it may also lack an error budget policy.

### SRE

**SRE** is a **concrete reliability practice**: SLO, budget, toil ≤50%, an incident process. At Google, SRE is often a **separate function** with the right to **block** a release when the budget is exhausted.

```text
                    ┌─────────────────────────────────────┐
                    │        Product business goals        │
                    └─────────────────┬───────────────────┘
                                      │
          ┌───────────────────────────┼───────────────────────────┐
          ▼                           ▼                           ▼
   ┌──────────────┐           ┌──────────────┐           ┌──────────────┐
   │   DevOps     │           │  Platform    │           │     SRE      │
   │ CI/CD, cul-  │           │ IDP, temp-   │           │ SLO, budget, │
   │ ture, auto-  │           │ lates, self- │           │ incidents    │
   │ mation       │           │ service      │           │              │
   └──────────────┘           └──────────────┘           └──────────────┘
          │                           │                           │
          └───────────────────────────┴───────────────────────────┘
                              Often one person
                              wears 2–3 hats
```

**In practice in mock-exams:** [`gitlab-*`](../gitlab-basic/README.md) + [`gitops-*`](../gitops-basic/README.md) — **delivery**; [`observability-*`](../observability-basic/README.md) — **measurement**; **this SRE course** — **how to make decisions** when the metric goes red.

---

## Reliability as a product property

A user does not buy "99.99% Pod uptime". They buy the **ability to place an order**, **see the feed**, **receive a payment**. Reliability is the **probability that the journey completes acceptably fast and correctly**.

| Level | Example of "reliable" | Example of "unreliable" |
|---------|------------------|---------------------|
| UX | payment went through, receipt by email | money charged, order "stuck" |
| API | 200 in 300 ms p95 | 30 s timeouts |
| Infra | node NotReady, service alive | all replicas in CrashLoop |

SRE looks **top-down**: first the **user journey**, then the services, then the hardware. A "CPU 90%" alert with no connection to a journey is a **symptom**, not an SLI ([chapter 06](06-observability-for-sre.md)).

---

## Five pillars (a simplified course map)

| Pillar | Question | Chapter |
|-------|--------|-------|
| **Measurement** | How well do we perform for the user? | 03–04 |
| **Budget** | How much "bad" can we spend? | 04 |
| **Response** | What do we do when things go bad? | 07–09 |
| **Prevention** | How do we avoid repeating it? | 05, 11, 14 |
| **Capacity and DR** | Will we survive a spike and a DC outage? | 10, 12 |

---

## Typical roles in the SRE loop

| Role | Focus | Don't confuse with |
|------|-------|-------------|
| **SRE engineer** | SLO, automation, incidents, capacity | just "tweaking Helm" |
| **Incident Commander (IC)** | coordination during an outage | the most senior by grade |
| **Tech lead on-call** | deep diagnostics | the only one allowed to touch prod |
| **Comms** | status for business/support | a developer in the thread |
| **Scribe** | timeline, decisions | someone who "just takes notes" |

On-call rotation is **not a punishment** but an **investment** in product feedback ([chapter 07](07-alerting-on-call.md)).

---

## Myths about SRE

| Myth | Reality |
|-----|------------|
| "SRE = 24/7 on-call with no authority" | on-call is part of the role; authority means release veto when the budget is spent and priority for reliability work |
| "You need 99.999% for everything" | excessive reliability is **expensive**; SLOs are tuned to the business ([chapter 15](15-economics-of-reliability.md)) |
| "SRE replaces developers" | SRE is a **partner**; everyone writes code, service ownership stays with the product team |
| "Just buy Datadog" | a tool without SLO = **noise** |
| "Postmortem is for punishment" | the goal is **systemic** improvements ([chapter 09](09-postmortems.md)) |

---

## SRE at different company scales

### Startup (5–20 engineers)

Often **no separate SRE team**: founders + one "on-call". It makes sense **early**: 1–2 SLOs on a critical path, a simple runbook, an incident channel. You don't need a 40-page process.

### Mid-sized product (50–200)

A **platform** appears + a **dedicated on-call** per service. You need: a **single SLO template**, a weekly incident review, an **error budget policy** agreed with the PM.

### Large enterprise

Several **SRE units** (foundation vs product-embedded), a **center of expertise** for incidents, **Game Days**, a formal PRR ([chapter 14](14-production-readiness.md)). The risk is **bureaucracy**; the antidote is a **toil cap** and automation.

---

## In mock-exams: where SRE fits

| SRE practice | Course / sandbox |
|--------------|--------------|
| Metrics, RED/USE | [observability-basic](../observability-basic/README.md) |
| SLO, burn rate | [observability-intermediate/07](../observability-intermediate/07-slo-sli-sla.md) |
| Runbooks, interviews | [observability-advanced](../observability-advanced/README.md) |
| K8s failures, probes | [kuber-basic](../kuber-basic/README.md), [kuber-intermediate](../kuber-intermediate/README.md) |
| GitOps, safe releases | [gitops-*](../gitops-basic/README.md) |
| Secrets, blast radius | [secrets-*](../secrets-basic/README.md) |

This course **does not duplicate** the Prometheus labs — it explains **why** you configure scraping and **how** to negotiate 99.9% with the business.

---

## Interview notes

- **SRE** = software engineering + operations + **quantified** reliability.
- Difference from DevOps: **SLO/error budget** as a management tool.
- **Toil** — manual, repetitive work with no long-term value; the goal is **≤50%** of your time (Google's guideline).
- **Blameless** — focus on the system, not on "who pressed the button".
- Reliability is **not maximized** — it is **traded off** against cost and velocity.

---

## Summary

SRE answers the question: **"what level of unreliability do we consciously accept, and how do we manage it"** — through measurement, budget, processes, and engineering. DevOps and Platform deliver changes; SRE makes sure changes **do not break the promise to the user**.

---

## Self-check checklist

- [ ] Explain SRE to a colleague in 2 minutes without the word "Kubernetes".
- [ ] Name three differences between SRE and a "night-shift admin".
- [ ] Give an example of a **user journey**, not a server.
- [ ] Where is the "gap" in your company right now — no SLO, no postmortem, or no on-call?
- [ ] Which mock-exams course will you take next for **hands-on** practice with measurement?

**Next:** [02. Reliability, risk, and failures](02-reliability-and-risk.md).
