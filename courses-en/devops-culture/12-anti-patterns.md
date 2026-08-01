# 12. Anti-patterns: heroes, walls, the “DevOps department”

## Intro

Knowing the models is half the work. The other half is **recognizing the poisons** that kill flow. Below — common anti-patterns in companies “after a DevOps transformation.”

---

## The “DevOps department”

| Symptom | Cure |
|---------|---------|
| dev throws a jar over the wall | stream ownership + you build it |
| DevOps “deploys for everyone” | platform self-service |
| DevOps = the only on-call | embed / rotate in squads |

DevOps is a **culture**, not a **silo**.

---

## Hero culture

| Symptom | Risk |
|---------|------|
| “call Oleg” | bus factor, burnout |
| night “rescues” without PM | normalizing deviation |
| no runbooks | knowledge in someone's head |

Heroes are **short-term** useful, **long-term** — anti-DORA (MTTR depends on one person).

---

## Ticket-driven platform

A platform with a 3-week queue → streams **bypass** it (shadow IT, their own clusters).

**Cure:** X-as-a-Service, SLAs, self-service for 80% of requests.

---

## Metric theater

| Theater | Reality |
|---------|------------|
| 1000 pipeline runs | 950 — lint on a feature branch never merged |
| “5 nines” marketing | no SLO measurement |
| velocity story points ↑ | lead time unchanged |

[sre/03](../sre/03-sli-slo-sla.md) + [chapter 13](13-metrics-maturity.md).

---

## Architecture astronauts

Microservices **without** an org split ([chapter 05](05-conway-law.md)):

- distributed monolith;
- 3-hop sync chain to “get user”;
- CFR ↑, frequency ↓.

---

## Tool-first transformation

“Bought GitLab Ultimate” → **no** MR culture.  
“Installed Kubernetes” → **no** platform team.

A tool **amplifies** culture; it doesn't create it.

---

## Summary

Anti-patterns diagnose maturity. If you recognized 3+ — prioritize **org**, not a new Helm chart.

---

## Checklist

- [ ] Is there a “DevOps department” separate from product?
- [ ] Who is the hero on prod — one person?
- [ ] Is platform a queue or a product?

**Next:** [13. Maturity metrics](13-metrics-maturity.md).
