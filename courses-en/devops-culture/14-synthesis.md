# 14. Synthesis: team map and DORA baseline

## Practice task

Pick an organization:

- a real one (no secrets in a public fork), or
- a training one: **image-platform** ([aws-intermediate](../aws-intermediate/projects/image-platform/)) + GitLab + mockctl — 3 squads, 1 platform.

### Deliverables (2–3 hours)

**1. Org + Conway (1 page)**

- Current team diagram (boxes).
- Service/repo diagram.
- 3 sentences: where Conway **matches**, where it **hurts**.

**2. Target Team Topologies (1 page)**

| Team | Type | Owns | Interaction with platform |
|---------|-----|---------|------------------------|
| … | stream / platform / enabling | … | collaboration / X-as-a-Service / facilitating |

**3. DORA baseline (table)**

| Metric | Current (estimate) | 6-month goal | How to measure |
|---------|------------------|------------|--------------|
| Deployment frequency | | | GitLab deploy job |
| Lead time | | | MR merged → prod |
| Change failure rate | | | incidents / deploys |
| Time to restore | | | postmortem data |

**4. Platform Team API (½ page)**

What platform **provides**, **does not provide**, SLA, communication channel.

**5. Three anti-patterns + action**

From [chapter 12](12-anti-patterns.md) — what to fix in the first quarter.

---

## Course map

```text
01–02   Culture and roles           →  “why and who”
03–04   DORA                      →  “how to measure flow”
05–06   Conway                    →  “structure = architecture”
07–08   Team Topologies           →  “types and modes”
09–10   Stream/platform + CI/CD   →  “how the day works”
11–12   Trust + anti-patterns      →  “what kills it”
13–14   Metrics + synthesis          →  “your plan”
```

---

## Interview questions

### 1. The four DORA metrics?

Deployment frequency, lead time for changes, change failure rate, time to restore service.

### 2. Conway's law?

Systems mirror the organization's communication structure.

### 3. Four Team Topologies team types?

Stream-aligned, platform, enabling, complicated-subsystem.

### 4. Three interaction modes?

Collaboration, X-as-a-Service, facilitating.

### 5. DevOps vs SRE vs Platform in one sentence?

DevOps — flow culture; SRE — reliability practice with SLOs; Platform — an internal product for dev.

### 6. Why is a “DevOps department” an anti-pattern?

It brings the wall back; streams don't own prod; platform becomes a bottleneck.

### 7. Blameless postmortem?

Focus on systemic causes without punishing the mistake; accountability through actions.

---

## In mock-exams — next

| Goal | Course |
|------|------|
| SLOs and incidents | [sre](../sre/README.md) |
| CI/CD hands-on | [gitlab-advanced](../gitlab-advanced/README.md) |
| GitOps delivery | [gitops-intermediate](../gitops-intermediate/README.md) |
| Cost culture | [finops](../finops/README.md) |
| Org SRE models | [sre/13](../sre/13-organizing-sre.md) |

---

## Master checklist

- [ ] I can draw stream + platform for a product
- [ ] I know current lead time (at least roughly)
- [ ] Platform has a published API
- [ ] No single hero on-call
- [ ] Postmortem actions get closed
- [ ] Conway is discussed when splitting services

---

## Summary

The DevOps culture course is done when you have a **written** target topology and a **measurable** DORA baseline — not when you've read every chapter.
