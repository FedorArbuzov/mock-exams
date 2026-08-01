# 01. From DevOps to engineering culture

## Intro

“We rolled out Jenkins” — and a year later releases are still once a month, because **culture** didn't change: the same approvals, the same “windows,” the same fear of prod. **DevOps** was about **culture and organization** from the start, not a tool with a logo.

---

## History in one paragraph

2009 — **DevOps Days**: Patrick Debois, the idea of **collaboration** between dev and ops.  
2010s — **“The Phoenix Project”**, **“The DevOps Handbook”** (Gene Kim et al.): work flow, feedback, experiments.  
2010s — **DORA** (DevOps Research and Assessment): **measurable** correlations between practices and outcomes.  
2020s — **Team Topologies** (Skelton & Pais): **team structure** as a delivery lever.  
In parallel — **SRE** (Google): reliability as an engineering discipline with SLOs.

---

## Three DevOps ideas (Handbook)

| Idea | In practice |
|------|-------------|
| **Flow** | small batches, WIP limits, CI |
| **Feedback** | monitoring, incidents, the user |
| **Continual learning** | postmortem, blameless, experiments |

Tools **support** flow; without process change, CI becomes a “queue in Jenkins.”

---

## “DevOps engineer” as a role

A contested term. In mature companies:

- there is **no** separate “DevOps department” that “deploys for everyone”;
- there **is** a platform team + product teams with **self-service**;
- there **are** shared practices: Git, MR, pipeline, observability.

The [gitlab-basic](../gitlab-basic/README.md) course teaches the **mechanics**; this course — **why** the organization needs them.

---

## Culture vs declaration

| Declaration | Real culture (signals) |
|------------|----------------------------|
| “We're agile” | Friday releases banned |
| “Blameless” | postmortem hunts for a culprit |
| “You build it” | dev has no access to logs |
| “Platform” | tickets sit 2 weeks in queue |

Culture is hard to measure; **proxies** — DORA ([chapter 03](03-dora-metrics.md)) and **time from idea to prod**.

---

## In mock-exams

| Flow practice | Course |
|---------------|------|
| Git + MR | [gitlab-basic](../gitlab-basic/README.md) |
| Deploy to mockctl | [gitlab-intermediate](../gitlab-intermediate/README.md) |
| GitOps | [gitops-basic](../gitops-basic/README.md) |
| SLOs and incidents | [sre](../sre/README.md) |

---

## Summary

DevOps culture is **how the organization delivers change**. Tools without Conway + Team Topologies + metrics are decoration.

---

## Checklist

- [ ] Name the three ideas from the DevOps Handbook.
- [ ] Give one “bad culture” signal from your practice.
- [ ] How does culture differ from “we bought GitLab”?

**Next:** [02. DevOps, SRE, Platform](02-devops-sre-platform.md).
