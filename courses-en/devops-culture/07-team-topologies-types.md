# 07. Team Topologies: four team types

## Intro

*Team Topologies* (Matthew Skelton, Manuel Pais) — a practical model of **four team types** and **three interaction modes**. The goal is **fast flow** in stream-aligned teams with **minimal** cognitive load.

---

## Four types

| Type | Mission | Example in mock-exams |
|-----|--------|---------------------|
| **Stream-aligned** | deliver **value** to the user (feature, product) | squad “image upload API” |
| **Platform** | **speed up** streams via self-service | `mockctl` team + GitLab + observability stack |
| **Enabling** | **temporarily** raise capabilities (coach) | help a squad adopt SLO / GitOps |
| **Complicated-subsystem** | **deep** expertise (math, legacy, hardware) | billing core, FPGA, old mainframe bridge |

Most people are in **stream-aligned**. Platform does **not** build product features.

---

## Stream-aligned team

**Owns** the full flow:

```text
Ideation → code → test → deploy → operate → learn
```

| Good | Bad |
|--------|-------|
| end-to-end ownership | “we only write code, ops is someone else's” |
| product metrics | 47 tickets in other queues |

DORA link: frequency and lead time **per squad**.

---

## Platform team

**Treat as an internal SaaS:**

- documentation, APIs, templates;
- **golden paths** ([gitlab-intermediate](../gitlab-intermediate/README.md) deploy mockctl);
- platform SLO: “deploy in 15 minutes,” “cluster API 99.9%.”

**Not** platform: “we're the only ones who can kubectl apply.”

---

## Enabling team

**Temporary** engagement: 2–3 months helping a squad learn tests, security, observability — then **step back**.

Permanent enabling without exit — **dependency** and hidden staff aug.

---

## Complicated-subsystem team

When the domain is **too complex** for every stream to duplicate expertise:

- query engine optimization;
- codec / crypto;
- integration with a regulatory core.

They deliver a **library / service** to streams; they don't take product ownership.

---

## Summary

The four types are **not an org chart forever**, they're **lenses**. Every team should know its type and the **mode** of connection to others ([chapter 08](08-interaction-modes.md)).

---

## Checklist

- [ ] Is your team stream, platform, enabling, or subsystem?
- [ ] How many platforms per how many streams (guideline 1:4–8)?
- [ ] Does enabling “never leave”?

**Next:** [08. Interaction modes](08-interaction-modes.md).
