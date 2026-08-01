# 11. Psychological safety and incidents

## Intro

The DORA capability **“generative culture”** / **“learning culture”** correlates with performance more strongly than another Jenkins agent. Without **trust**, postmortems and frequent deploys are impossible.

In depth: [sre/08–09](../sre/08-incident-management.md) — here the **organizational** layer.

---

## Westrum: culture types

| Type | Behavior in an incident |
|-----|-------------------------|
| **Pathological** | hunt for blame, concealment |
| **Bureaucratic** | procedures over the fix |
| **Generative** | focus on the system, learning |

DevOps/SRE aim for **generative** — not “everything is allowed,” but **blameless** investigation.

---

## Blameless ≠ no accountability

| Blameless | Accountability |
|-----------|----------------|
| we don't punish for a mistake when hitting deploy | we own action items |
| we look for systemic cause | we change process/code |
| IC focuses on restore | PM watches comms |

[sre/09-postmortems](../sre/09-postmortems.md): actions with owner and due date.

---

## On-call as a cultural signal

| Trust signal | Fear signal |
|----------------|---------------|
| runbook exists | “only Vasya knows” |
| compensation / time off | hero nights with no account |
| post-incident fix priority | “it happens” |

On-call **inside a stream-aligned** team — ownership. Centralized “on-call admins” without context — the **wall** again.

---

## Psychological safety in MRs

- review the **code**, not the person;
- a “mandatory” security finding — not shame;
- a senior can be wrong in public.

Platform does **not** use MRs as a battlefield of “us vs you.”

---

## Experiments and error budget

[sre/04](../sre/04-error-budgets.md): budget gives the **right** to risk releases. Culture without budget → **hidden** Friday-night releases.

---

## Summary

DORA metrics fall when people **fear** deploying and **hide** incidents. Trust is infrastructure above Kubernetes.

---

## Checklist

- [ ] Last postmortem — systemic actions?
- [ ] Can you say “I broke prod” without career fear?
- [ ] Is on-call rotation fair?

**Next:** [12. Anti-patterns](12-anti-patterns.md).
