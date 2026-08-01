# OOD Python — object-oriented design in interviews

The **OOD live-coding** course in Python: **SOLID**, composition, patterns, classic problems (parking lot, LRU, rate limiter), and **sub-tasks** in every chapter. Practice — [`examples/`](examples/pyproject.toml) + pytest.

**Who it's for:** backend Python middle+; "design the classes" rounds after or instead of a second algorithm problem.

**Prerequisites:**

| Skill | Why |
|-------|--------|
| Python OOP | classes, inheritance, typing |
| [python-deep-dive](../python-deep-dive/README.md) chapters 04, 11–15 | MRO, Protocol, dunder |

**Useful:** [python-algorithms](../python-algorithms/README.md), [api-design](../api-design/README.md), [behavioral-interviews](../behavioral-interviews/README.md).

## How to read

- Chapters **01–18** — ~**50–65 min** (theory + sub-tasks + code).
- Chapters **19–20** — mock OOD + **capstone** (**3–4 h**).
- In the interview: **first** requirements and API, **then** classes; don't go silent.

**Time:** ~**20–28 hours**.

## Local practice

```bash
cd courses/ood-python/examples
python -m venv .venv
.venv\Scripts\activate
pip install -e ".[dev]"
pytest -v
```

## Curriculum

### Part I — Foundations (01–04)

| № | Chapter |
|---|--------|
| 01 | [The OOD round landscape](01-landscape.md) |
| 02 | [SOLID in Python](02-solid.md) |
| 03 | [Composition, ABC, Protocol](03-composition-interfaces.md) |
| 04 | [Process: 45 minutes of an OOD interview](04-interview-process.md) |

### Part II — Patterns (05–09)

| № | Chapter |
|---|--------|
| 05 | [Creational: factory, builder, singleton](05-creational.md) |
| 06 | [Structural: adapter, facade, composite](06-structural.md) |
| 07 | [Behavioral: strategy, observer, state](07-behavioral.md) |
| 08 | [Repository, service, domain layer](08-layering.md) |
| 09 | [When you don't need a pattern](09-anti-patterns.md) |

### Part III — Classic problems (10–17)

| № | Chapter |
|---|--------|
| 10 | [Parking Lot](10-parking-lot.md) |
| 11 | [LRU Cache](11-lru-cache.md) |
| 12 | [Rate Limiter](12-rate-limiter.md) |
| 13 | [In-memory Bookstore / Catalog](13-bookstore.md) |
| 14 | [Meeting Room Scheduler](14-meeting-scheduler.md) |
| 15 | [Vending Machine (state)](15-vending-machine.md) |
| 16 | [Deck of Cards / Blackjack lite](16-deck-cards.md) |
| 17 | [URL Shortener (OOD slice)](17-url-shortener.md) |

### Part IV — Synthesis (18–20)

| № | Chapter |
|---|--------|
| 18 | [UML and tests for OOD](18-uml-testing.md) |
| 19 | [Interview Q&A](19-interview-qa.md) |
| 20 | [Synthesis: mock + capstone](20-synthesis.md) |

## What you should end up with

- In 5 minutes you can write out the **entities, API, extensions**.
- You implement **LRU** and a **rate limiter** with tests.
- You explain **SOLID** using one of your own classes.
- You pass a **45-min mock OOD** with a rubric of ≥3/4.

## Materials

| File | Purpose |
|------|------------|
| [interview-cheatsheet.md](interview-cheatsheet.md) | cheat sheet |
| [examples/](examples/pyproject.toml) | LRU, rate limit, parking |

## Related courses

| Topic | Course |
|------|------|
| Descriptors, Protocol | [python-deep-dive](../python-deep-dive/README.md) |
| API design | [api-design](../api-design/README.md) |
| Algorithms inside OOD | [python-algorithms](../python-algorithms/README.md) |
| Tests | [python-testing](../python-testing/README.md) |
