# Site Reliability Engineering (SRE)

A theory course on **Site Reliability Engineering**: reliability as an engineering discipline, **SLI/SLO/error budget**, incidents, on-call, capacity, changes, DR, and organizing SRE teams. No mandatory labs — just in-depth "book-style" chapters in English.

**Who it's for:** DevOps / backend / platform engineers moving into SRE; team leads who need a common language for reliability; engineers coming from [`kuber-intermediate`](../kuber-intermediate/README.md) and [`observability-basic`](../observability-basic/README.md), ready to connect monitoring practice with **risk management**.

**Prerequisites (recommended):**

| Course | Why |
|------|--------|
| [linux-intermediate](../linux-intermediate/README.md) | host, network, load |
| [observability-basic](../observability-basic/README.md) | metrics, PromQL, alerts |
| [observability-intermediate/07](../observability-intermediate/07-slo-sli-sla.md) | brief intro to SLI/SLO (here — deeper) |
| [kuber-basic](../kuber-basic/README.md) | Pod/Node failure, probes |
| [gitops-basic](../gitops-basic/README.md) | changes through Git |

**Practice in other courses:** the [`deploy/observability`](../../deploy/observability/README.md) and [`mockctl`](../mockctl/README.md) sandboxes, runbook labs in [observability-advanced](../observability-advanced/README.md).

## How to read

- Each chapter is **30–60 minutes** of reading; with notes and tables — up to **90 minutes**.
- Take **notes** using the template at the end of each chapter: "definition → example from work → anti-pattern".
- Connections to repository courses are marked with the **"In mock-exams"** block — not required to understand SRE in general.

**Time:** ~**25–35 hours** for the whole course; the [final chapter](16-synthesis-practice.md) — writing an SLO document for a fictional or real service (**2–4 hours**).

## Curriculum

### Part I — Discipline and models (01–04)

| # | Chapter |
|---|--------|
| 01 | [What is SRE: history, role, boundaries](01-what-is-sre.md) |
| 02 | [Reliability, risk, and failures](02-reliability-and-risk.md) |
| 03 | [SLI, SLO, SLA: measurement and agreements](03-sli-slo-sla.md) |
| 04 | [Error budget: policy and trade-offs](04-error-budgets.md) |

### Part II — Operational work (05–09)

| # | Chapter |
|---|--------|
| 05 | [Toil, automation, and the limits of scripts](05-toil-automation.md) |
| 06 | [Observability for SRE](06-observability-for-sre.md) |
| 07 | [Alerting and on-call](07-alerting-on-call.md) |
| 08 | [Incident management](08-incident-management.md) |
| 09 | [Blameless postmortems](09-postmortems.md) |

### Part III — Capacity, changes, disasters (10–12)

| # | Chapter |
|---|--------|
| 10 | [Capacity, performance, cost](10-capacity-performance.md) |
| 11 | [Changes as the main risk](11-change-and-release.md) |
| 12 | [DR, RTO/RPO, and drills](12-disaster-recovery.md) |

### Part IV — Organization and career (13–16)

| # | Chapter |
|---|--------|
| 13 | [How to embed SRE in a company](13-organizing-sre.md) |
| 14 | [Production readiness and launch](14-production-readiness.md) |
| 15 | [The economics of reliability](15-economics-of-reliability.md) |
| 16 | [Synthesis: practice, interviews, checklist](16-synthesis-practice.md) |

## What you should end up with

- You formulate **SLI/SLO** for a user journey, not "CPU < 80%".
- You explain the **error budget** to management and the development team.
- You run (or participate in) an **incident** with IC / comms / scribe roles.
- You write a **postmortem** with action items and without blame.
- You connect **releases**, **capacity**, and **DR** to measurable risk.
- You distinguish SRE from a "night-shift admin on call" and from "pure DevOps without SLOs".

## Further reading (outside the course)

- Google — *Site Reliability Engineering* (free online).
- Google — *The Site Reliability Workbook*.
- Beyer et al. — *Implementing Service Level Objectives*.
- No textbook replaces the **SLO document for your service** — the course finale is exactly about that.
