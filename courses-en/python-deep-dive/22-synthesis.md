# 22. Synthesis: mock Python round

## Final task

A **mock Python deep dive** — 45–60 min (solo or with a colleague). Rubric + reviewing the labs.

**Time:** ~**2–3 h**.

---

## Mock format

| Block | Min | Content |
|------|-----|------------|
| Warm-up | 5 | tell me your Python stack |
| Q&A | 25 | 8–10 questions from [21](21-interview-qa.md) |
| Live code | 15 | descriptor OR decorator OR generator |
| Follow-up | 10 | GIL / memory / async choice for a task |

---

## Live code (pick one)

1. **Decorator** `retry(times=3)` with `functools.wraps`
2. **Descriptor** validated field (like `Positive`)
3. **Generator** pipeline: read numbers → running max → yield
4. **Context manager** timer

Verification: `pytest` in [`examples/`](examples/pyproject.toml).

---

## Rubric (1–4)

| Score | Criterion |
|------|----------|
| 1 | wrong / "I don't know" without structure |
| 2 | partial, no depth |
| 3 | correct, examples, tied to practice |
| 4 | + trade-offs, knows chapters 17–18, honest about limits |

**Hire bar (middle):** average ≥3 on Q&A; live code works.

---

## Deliverable: Python Interview Sheet

One page (create `python-interview-sheet.md`):

| Section | Content |
|--------|------------|
| GIL | 3 sentences |
| Memory | refcount + GC |
| Concurrency | task→tool table |
| Top 5 weak topics | + a link to the chapter |
| Mock score | date, score |
| Lab status | pytest green? |

---

## Course map

```text
01–04   CPython, GIL, memory, MRO
05–10   mutability, functions, iter, CM, except, import
11–16   descriptor, dunder, meta, slots, typing, weakref
17–20   threads, async view, profile, packaging
21–22   Q&A, mock
```

---

## Subtasks

### 22.1 Labs (30 min)

All of `examples/` green (copy from `solutions/` only after your own attempt).

### 22.2 Sheet (30 min)

Fill out the Python Interview Sheet.

### 22.3 Mock (45 min)

A run through the format; record the scores.

### 22.4 Retake (30 min)

Redo 3 weak questions a week later (schedule it).

---

## In mock-exams — the full interview stack

| Round | Course |
|-------|------|
| Algorithms | [python-algorithms](../python-algorithms/README.md) |
| Python depth | this course |
| Framework | [fastapi](../fastapi/README.md) / [django](../django/README.md) |
| Design | [microservices-patterns](../microservices-patterns/README.md) |
| Behavioral | [behavioral-interviews](../behavioral-interviews/README.md) |

---

## Course checklist

- [ ] Chapters 01–20 subtasks done?
- [ ] pytest examples green?
- [ ] 21-interview ≥15/21?
- [ ] Mock completed?
- [ ] [interview-cheatsheet](interview-cheatsheet.md) before the interview?

**Course complete.**
