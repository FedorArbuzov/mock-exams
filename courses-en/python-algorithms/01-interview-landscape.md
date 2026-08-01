# 01. Interview landscape and preparation plan

## Intro

The algorithmic section isn't about "knowing 500 problems by heart" — it's about **recognizing the pattern**, writing **working code** in 25–35 minutes, and **explaining** the complexity. In Python this is both a plus (concise syntax) and a minus (the interviewer expects care with types and edge cases).

---

## Formats

| Format | Duration | What's assessed |
|--------|--------------|-------------|
| Live coding | 45–60 min | 1–2 problems + questions |
| Take-home | 2–4 h | cleanliness, tests, README |
| OA (online assessment) | time limit | many easy/medium |
| Pair programming | 60 min | dialogue, refactoring |

---

## Problem levels

| Level | Expectation | Share at interview |
|---------|----------|------------------|
| Easy | pattern in 5 min, code in 10 min | warm-up / OA |
| Medium | pattern in 10–15 min, code in 15–20 min | **the core** |
| Hard | rare for middle; part of senior | 0–1 per cycle |

Course goal: **confident medium** in Python.

---

## 8-week plan (template)

| Week | Focus | Problems in code |
|--------|-------|--------------|
| 1 | 01–04, complexity, stdlib | 8 easy |
| 2 | 05–08 arrays/strings | 12 |
| 3 | 09–11 hash, sort, BS | 12 |
| 4 | 12–14 stack, list | 10 |
| 5 | 15–17 trees | 12 |
| 6 | 18–19 graphs | 10 |
| 7 | 20–24 heap, DP, greedy | 15 |
| 8 | 25–26 mock × 4 | review weak spots |

1–1.5 h/day is steadier than 10 h on the weekend.

---

## Tools

| Tool | Why |
|------------|-------|
| [examples/](examples/pyproject.toml) + pytest | automated checking |
| Anki / mistakes notebook | off-by-one, forgotten empty |
| 25-min timer on medium | realistic pace |
| CoderPad / Google Doc | practice without an IDE |

---

## Python at the interview

| Do | Avoid |
|---------|-----------|
| `def solve(nums: list[int]) -> int:` | classes without need |
| say the complexity out loud | magic single-letter names everywhere |
| test on the example from the statement | print-debugging for 15 min |
| clarify the input (empty? duplicates?) | guessing silently |

---

## Subtasks

**Time:** ~50 min.

### 1.1 Goal (10 min)

Write down: company/interview type, date (or "in 2 months"), target level (middle/senior).

### 1.2 Diagnostics (15 min)

Solve 2 easy problems without hints (e.g., Two Sum, Valid Parentheses). Time yourself. Note where you got stuck.

### 1.3 Schedule (15 min)

Transfer the 8-week template into your calendar: specific days and course chapters.

### 1.4 Mistakes notebook (10 min)

Create a `mistakes.md` file: template — date | problem | mistake | pattern reminder.

### 1.5 Setup (10 min)

Set up a venv in `examples/`, run `pytest` (there should be FAILs on NotImplemented — that's fine).

---

## Summary

Preparation is **patterns + repetition + mock under a timer**. The course provides the structure; the volume of problems is your discipline.

---

## Checklist

- [ ] Do you have an interview date/horizon?
- [ ] Do venv + pytest work?
- [ ] Is mistakes.md created?

**Next:** [02. Complexity](02-complexity.md).
