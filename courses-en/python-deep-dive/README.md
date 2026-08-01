# Python Deep Dive

A detailed course on **how Python works** for interviews and strong middle+/senior backend engineers: **CPython**, **GIL**, memory and GC, the object model, **descriptors**, MRO, decorators, generators, import, typing, and common **interview Q&A**. A "book"-style format with **subtasks**; labs live in [`examples/`](examples/pyproject.toml) + pytest.

**Who it's for:** Python backend engineers after [fastapi](../fastapi/README.md) / [django](../django/README.md); before interviews that ask "how Python works," not just the framework.

**Prerequisites:**

| Skill | Why |
|-------|--------|
| Python 3.11+ in production or a pet project | basic syntax |
| One backend course | web/async context |

**Helpful:** [python-async](../python-async/README.md) (asyncio in depth), [python-algorithms](../python-algorithms/README.md), [behavioral-interviews](../behavioral-interviews/README.md).

## How to read

- Chapters **01–20** — ~**45–60 min** (theory + **subtasks** + code in `examples/`).
- Chapters **21–22** — interview bank and **mock** (**2–3 h**).
- Run the examples in the REPL and `dis.dis()` — this course is about **mechanics**, not memorization.

**Time:** ~**22–30 hours**.

## Local practice

```bash
cd courses/python-deep-dive/examples
python -m venv .venv
.venv\Scripts\activate
pip install -e ".[dev]"
pytest -v
```

## Curriculum

### Part I — Execution and memory (01–04)

| № | Chapter |
|---|--------|
| 01 | [CPython: how code runs](01-cpython-execution.md) |
| 02 | [GIL: threads, processes, async](02-gil.md) |
| 03 | [Memory, references, garbage collection](03-memory-gc.md) |
| 04 | [Objects, type, class, MRO](04-object-model.md) |

### Part II — The language in depth (05–10)

| № | Chapter |
|---|--------|
| 05 | [Mutability, copy, `is` vs `==`](05-mutability-copy.md) |
| 06 | [Functions: closure, decorator](06-functions-decorators.md) |
| 07 | [Iterators and generators](07-iterators-generators.md) |
| 08 | [Context managers](08-context-managers.md) |
| 09 | [Exceptions](09-exceptions.md) |
| 10 | [Import system](10-import-system.md) |

### Part III — The advanced model (11–16)

| № | Chapter |
|---|--------|
| 11 | [Descriptors and `property`](11-descriptors.md) |
| 12 | [Data model: dunder methods](12-dunder-methods.md) |
| 13 | [Metaclasses (when and why)](13-metaclasses.md) |
| 14 | [`__slots__` and memory](14-slots.md) |
| 15 | [Typing, Protocol, ABC](15-typing-protocols.md) |
| 16 | [weakref and reference cycles](16-weakref.md) |

### Part IV — Concurrency and perf (17–20)

| № | Chapter |
|---|--------|
| 17 | [threading vs multiprocessing](17-threading-multiprocessing.md) |
| 18 | [asyncio from CPython's point of view](18-asyncio-internals.md) |
| 19 | [Profiling and optimization](19-profiling.md) |
| 20 | [Packaging, venv, interpreters](20-packaging.md) |

### Part V — Interview (21–22)

| № | Chapter |
|---|--------|
| 21 | [Interview Q&A: top questions](21-interview-qa.md) |
| 22 | [Synthesis: mock Python round](22-synthesis.md) |

## What you should end up with

- You can explain the **GIL** and the choice between threads / processes / asyncio.
- You can diagram **reference counting + GC** for cycles.
- You can write a **descriptor** and explain how `property` works.
- You know the **MRO** and the order of `super()`.
- You can answer **20+** common Python interview questions in 2–4 minutes each.

## Materials

| File | Purpose |
|------|------------|
| [interview-cheatsheet.md](interview-cheatsheet.md) | cheat sheet |
| [examples/](examples/pyproject.toml) | labs |

## Related courses

| Topic | Course |
|------|------|
| asyncio practice | [python-async](../python-async/README.md) |
| FastAPI async | [fastapi/27](../fastapi/27-async-patterns.md) |
| Algorithms | [python-algorithms](../python-algorithms/README.md) |
| OOD in interviews | [ood-python](../ood-python/README.md) |
| Tests | [python-testing](../python-testing/README.md) |
