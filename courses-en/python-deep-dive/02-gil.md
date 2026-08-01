# 02. GIL: threads, processes, async

## Intro

The **Global Interpreter Lock** is a mutex in CPython: one thread executes Python bytecode per process. **Every other** middle Python backend interview asks about it.

Deeper async: [python-async/01](../python-async/01-sync-vs-async.md).

---

## What the GIL does

| | With the GIL |
|--|-------|
| CPU-bound threads | do **not** run in parallel across cores |
| I/O-bound threads | fine — the GIL is released on wait |
| multiprocessing | separate processes — **their own** GIL |

```text
Process
  ├─ Thread 1 ─┐
  └─ Thread 2 ─┴─ one GIL for bytecode
```

---

## What to use when

| Task | Tool |
|--------|------------|
| HTTP fan-out | **asyncio** or threads |
| CPU crunch | **multiprocessing**, C ext, Rust |
| Mixed | async + ProcessPoolExecutor |

---

## Will the GIL be "removed"?

**PEP 703** (nogil, 3.13+ experimental) — know the trend; in 2025–2026 interviews: "CPython has the GIL, use processes for CPU."

---

## Subtasks

**Time:** ~55 min.

### 2.1 Table (15 min)

5 tasks from your experience → thread/process/async.

### 2.2 Out loud (20 min)

A 2-minute answer: "What is the GIL and when does it get in the way?"

### 2.3 Myths (10 min)

3 myths (async gets around the GIL for CPU — no) + the truth.

### 2.4 Code smell (10 min)

`time.sleep` inside an async def — why it's bad ([fastapi/27](../fastapi/27-async-patterns.md)).

---

## Checklist

- [ ] Are I/O vs CPU separated?
- [ ] Do you know ProcessPool for CPU?

**Next:** [03. Memory and GC](03-memory-gc.md).
