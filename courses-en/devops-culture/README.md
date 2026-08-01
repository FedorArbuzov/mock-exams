# DevOps Culture

A theory course on DevOps **organization and culture**: **DORA metrics**, **Team Topologies**, **Conway's law**, team interaction, platform thinking, and the link to **CI/CD**. A “book” format in English, without required labs.

**Who it's for:** team leads, platform / DevOps / SRE, architects; engineers who want to understand **why** “we have DevOps in the title, but releases once a quarter.”

**Prerequisites (recommended):**

| Course | Why |
|------|--------|
| [gitlab-basic](../gitlab-basic/README.md) | CI, MR, pipeline as delivery culture |
| [sre/01](../sre/01-what-is-sre.md) | SRE vs DevOps boundaries |
| [sre/13](../sre/13-organizing-sre.md) | organizing reliability (here — broader: all of engineering) |

**Useful in parallel:** [gitops-basic](../gitops-basic/README.md), [finops/11](../finops/11-process-culture.md), [kuber-advanced](../kuber-advanced/README.md).

## How to read

- Chapters **01–12** — about **30–50 minutes** each; with notes — up to **75 minutes**.
- The **“In mock-exams”** block — practice in other courses in the repo.
- [Finale](14-synthesis.md) — a draft **Team Topologies** map for your (or a training) organization (**2–3 hours**).

**Time:** ~**12–16 hours** for the whole course.

## Curriculum

### Part I — Culture and measurement (01–04)

| # | Chapter |
|---|--------|
| 01 | [From DevOps to engineering culture](01-intro-devops-culture.md) |
| 02 | [DevOps, SRE, Platform: roles and boundaries](02-devops-sre-platform.md) |
| 03 | [DORA: four metrics and what they mean](03-dora-metrics.md) |
| 04 | [DORA capabilities and measurement traps](04-dora-capabilities.md) |

### Part II — Team structure (05–08)

| # | Chapter |
|---|--------|
| 05 | [Conway's law and architecture](05-conway-law.md) |
| 06 | [Reverse Conway: design teams for the system](06-reverse-conway.md) |
| 07 | [Team Topologies: four team types](07-team-topologies-types.md) |
| 08 | [Team interaction modes](08-interaction-modes.md) |

### Part III — Practice in the organization (09–12)

| # | Chapter |
|---|--------|
| 09 | [Stream-aligned and platform teams](09-stream-and-platform.md) |
| 10 | [CI/CD as a cultural contract](10-cicd-culture.md) |
| 11 | [Psychological safety and incidents](11-trust-and-incidents.md) |
| 12 | [Anti-patterns: heroes, walls, the “DevOps department”](12-anti-patterns.md) |

### Part IV — Synthesis (13–14)

| # | Chapter |
|---|--------|
| 13 | [Maturity metrics without vanity](13-metrics-maturity.md) |
| 14 | [Synthesis: team map and DORA baseline](14-synthesis.md) |

## What you should end up with

- You can explain the **four DORA metrics** and don't confuse them with “number of deploys in Jira.”
- You can draw a **team topology** (stream / platform / enabling) for a product.
- You can apply **Conway's law** to the “monolith vs microservices” debate.
- You can connect **`.gitlab-ci.yml`** to a culture of frequent small changes.
- You can produce a **one-pager** on “how we're organized and what we improve this quarter.”

## Requirements

Reading only. For the finale, experience (or a fictional case) with a team of 20–80 people is useful.

## Related to SRE

| sre | devops-culture |
|-----|----------------|
| [13-organizing-sre](../sre/13-organizing-sre.md) | SRE models inside the overall topology |
| [01-what-is-sre](../sre/01-what-is-sre.md) | SRE as a specialization, not a replacement for DevOps culture |

After this course, logical next steps: [sre](../sre/README.md) in full, [gitlab-advanced](../gitlab-advanced/README.md), [finops](../finops/README.md).
