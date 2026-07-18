# 17. threading vs multiprocessing

## Введение

Практическое продолжение [02-gil](02-gil.md): API, синхронизация, когда ProcessPool.

---

## threading

```python
import threading
lock = threading.Lock()

with lock:
  shared_counter += 1
```

**Race** без lock. `threading.local()` — per-thread state.

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

`queue.Queue` thread-safe; `multiprocessing.Queue` cross-process.

---

## Подзадачи

**Время:** ~55 мин.

### 17.1 Race demo (15 мин)

counter без lock — покажите drift.

### 17.2 ProcessPool (20 мин)

CPU-bound function `sum(i*i for i in range(n))` — thread vs process timing.

### 17.3 Interview (20 мин)

«Как распараллелить CPU задачу в Python?»

---

## Чек-лист

- [ ] Lock для shared mutable?
- [ ] ProcessPool для CPU?

**Дальше:** [18. asyncio internals](18-asyncio-internals.md).
