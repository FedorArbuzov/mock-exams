# 18. asyncio from CPython's point of view

## Intro

We don't duplicate [python-async](../python-async/README.md) — here it's the **mechanics**: the coroutine object, the event loop, `await` = yield control.

---

## Coroutine

```python
async def f():
    return 1

c = f()       # coroutine object, not 1
```

`await c` schedules it on the event loop.

---

## Event loop

```text
loop.run_until_complete(main())
  → run ready tasks
  → on await I/O: register fd, yield
  → callback when ready
```

Default policy: `asyncio.run()` (3.7+).

---

## Tasks and futures

`asyncio.create_task` — concurrent coroutines on **one** thread.

**Don't confuse** it with threads: cooperative multitasking.

---

## Blocking in async

`time.sleep`, sync `requests` — **block the loop**. `await asyncio.sleep`, `httpx` async.

---

## Subtasks

**Time:** ~50 min.

### 18.1 Trace (15 min)

`asyncio.run` with two `await sleep` — the output order.

### 18.2 Block demo (15 min)

`time.sleep(1)` inside async — measure the delay of other tasks.

### 18.3 Bridge (20 min)

A list of python-async chapters to practice after this one.

---

## Checklist

- [ ] coroutine vs function call?
- [ ] blocking kills the loop?

**Next:** [19. Profiling](19-profiling.md).
