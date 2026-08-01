# 06. Reverse Conway: design teams for the system

## Intro

**Reverse Conway maneuver** (Team Topologies): if you need a **target architecture** — first (or in parallel) **change** team boundaries and communication channels, or the system will **revert** to the old shape.

---

## Algorithm (practical)

1. **Draw** the target architecture (bounded contexts, deploy units).
2. **Assign** a stream-aligned team to each context.
3. **Carve out** platform for shared concerns (K8s, CI, observability).
4. **Reduce** cross-team release dependencies to **contracts** (API, events).
5. **Measure** DORA per squad ([chapter 03](03-dora-metrics.md)).

---

## Example: ecommerce

**Goal:** checkout independent of catalog.

| Step | Action |
|-----|----------|
| 1 | Checkout team owns checkout-api + checkout-db |
| 2 | Catalog — separate team, read API for checkout |
| 3 | Platform — EKS, GitLab, Prometheus |
| 4 | Enabling — temporarily helps checkout adopt tracing |

**Don't** do: 20 microservices, **one** team of 8 people.

---

## Strangler and org change

Migrate monolith → services **together** with team splits:

```text
Monolith squad
    → split team A (payments) + team B (catalog)
    → extract payment service (code follows the team)
```

A technical strangler without an org split — an **eternal** “shared core.”

---

## Reverse Conway risks

| Risk | Mitigation |
|------|-----------|
| Turf wars | explicit mission statements |
| Duplicated platform | one IDP |
| Underutilized people | enabling, not layoff panic |
| Big bang reorg | evolve by domain |

---

## Link to SRE org

[sre/13](../sre/13-organizing-sre.md): centralized SRE on the **platform layer**, embedded SRE in **critical** streams — an example of reverse Conway for **reliability**.

---

## Summary

First **who owns what**, then **boundaries in code**. Architecture “on paper” without reorg is wishful thinking.

---

## Checklist

- [ ] Is there a bounded context nobody owns?
- [ ] Does platform serve squads, or compete with them?
- [ ] How many teams does one release require?

**Next:** [07. Team Topologies: team types](07-team-topologies-types.md).
