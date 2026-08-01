# 01. The OOD round landscape

## Intro

**OOD** in an interview isn't a 20-class UML diagram — it's a **clear model** for the requirements within 45 minutes. In Python it's often combined with **live coding** of a single problem (LRU, limiter).

---

## How OOD differs from system design

| | OOD | System design |
|--|-----|----------------|
| Scale | classes in a process | services, DBs, queues |
| Time | 45–60 min | 45–60 min, different focus |
| Artifact | API + 3–7 classes | diagram + trade-offs |

[microservices-patterns](../microservices-patterns/README.md) — not a replacement for OOD.

---

## What's evaluated

- Clarifying requirements
- Identifying entities
- Extensibility (open/closed)
- Clean API
- Testability
- Communication

---

## Typical problems

Parking lot, LRU, rate limiter, library, elevator, chess lite, hotel booking, ATM.

---

## Sub-tasks

**Time:** ~45 min.

### 1.1 Target company's format (15 min)

Is there OOD? How many minutes? Live code or a diagram only?

### 1.2 Self-check (15 min)

Rate yourself 1–5: classes, patterns, interview process.

### 1.3 One problem (15 min)

Pick one from the README, ch. 10–17 — read the prompt, write out 5 questions for the interviewer.

---

## Checklist

- [ ] Is the round format clear?
- [ ] A list of questions about the prompt?

**Next:** [02. SOLID](02-solid.md).
