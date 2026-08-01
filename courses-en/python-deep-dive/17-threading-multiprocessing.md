# 17. threading vs multiprocessing

## Intro

A practical continuation of [02-gil](02-gil.md): the API, synchronization, when to use ProcessPool.

---

## threading

```python
import threading
lock = threading.Lock()

with lock:
  shared_counter += 1
```

A **race** without a lock. `threading.local()` — per-thread state.

---

## multiprocessing

```python
from concurrent.futures import ProcessPoolExecutor

with ProcessPoolExecutor() as pool:
    results = list(pool.map(fn, items))
```

Pickle-able args only. IPC overhead.

---

## Queue

`queue.Queue` is thread-safe; `multiprocessing.Queue` is cross-process.

---

## Subtasks

**Time:** ~55 min.

### 17.1 Race demo (15 min)

A counter without a lock — show the drift.

### 17.2 ProcessPool (20 min)

CPU-bound function `sum(i*i for i in range(n))` — thread vs process timing.

### 17.3 Interview (20 min)

"How do you parallelize a CPU task in Python?"

---

## Checklist

- [ ] Lock for shared mutable?
- [ ] ProcessPool for CPU?

**Next:** [18. asyncio internals](18-asyncio-internals.md).
