# 02. STAR, CAR, SOAR: answer structure

## Intro

An 8-minute answer with no structure — the interviewer loses the thread. **STAR** gives clarity; follow-up questions hit **Action** and **Result**.

---

## STAR

| Letter | Content | Share of time |
|-------|------------|--------------|
| **S** Situation | context, team, stakes | ~15% |
| **T** Task | your role and goal | ~10% |
| **A** Action | what **you** did (steps) | ~50% |
| **R** Result | outcome + metric + learning | ~25% |

```text
"In Q3 a team of 5 was preparing the billing release (S).
I was responsible for the payments integration (T).
I proposed idempotency keys, wrote an ADR, ran a review with 2 teams (A).
Duplicate charges dropped to zero, the release shipped on time, and the pattern was adopted into the platform guide (R)."
```

---

## CAR / SAR

**Challenge – Action – Result** — shorter, for a recruiter screen.

**SOAR** adds **Options**: which alternatives you considered — strong for senior ([10-technical-decision](10-technical-decision.md)).

---

## Action — the main mistake

| Bad | Good |
|-------|--------|
| "The team redid the architecture" | "I organized a workshop, sketched out the design, aligned with security" |
| "We fixed the bug" | "I found a race in the outbox relay via a trace, added an idempotent consumer" |

Use **"I"** even in teamwork: what exactly you did.

---

## Result — measurability

| Weak | Strong |
|-------|--------|
| "Improved performance" | "API p99 −40%, from 800ms to 480ms" |
| "Reduced incidents" | "MTTR from 2h to 35min in a quarter" |
| "Everyone was happy" | "adoption by 3 teams, 0 rollbacks" |

Rounding is acceptable; the **order of magnitude** is mandatory.

---

## Answer length

| Question | Target |
|--------|------|
| "In one sentence" | 20–30 sec |
| Standard behavioral | **2–3 min** |
| Deep dive | 5 min + dialogue |

If the interviewer nods — **stop**; don't pile on extra.

---

## Follow-up

Prepare for:

- "What would you do differently?"
- "How did you measure success?"
- "What went wrong in the process?"

---

## Subtasks

**Time:** ~55 min.

### 2.1 Markup (15 min)

Take any project; break it into S/T/A/R bullets (2–4 points each).

### 2.2 Timer (15 min)

Record, by voice or text, a 2.5 min answer; check: is Action ≥ 50%?

### 2.3 Rewrite the "we" (10 min)

One paragraph with only "I"; without losing the truth.

### 2.4 Result upgrade (10 min)

Add 1 metric and 1 qualitative outcome to the story from 2.1.

### 2.5 SOAR (5 min)

Add 2 rejected options to the same story.

---

## Summary

STAR is the skeleton; **Action** and **Result** decide the hire. Practice out loud with a timer.

---

## Checklist

- [ ] Do you have one story in full STAR?
- [ ] Result with a number?

**Next:** [03. Story bank](03-story-bank.md).
