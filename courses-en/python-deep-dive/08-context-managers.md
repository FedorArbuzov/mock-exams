# 08. Context managers

## Intro

`with` guarantees **cleanup** (file, lock, transaction). The protocol: `__enter__` / `__exit__`.

---

## class-based

```python
class Managed:
    def __enter__(self):
        return self
    def __exit__(self, exc_type, exc, tb):
        # cleanup; return True suppresses exception
        return False
```

---

## contextlib

```python
from contextlib import contextmanager

@contextmanager
def managed():
    setup()
    try:
        yield resource
    finally:
        teardown()
```

---

## Subtasks

**Time:** ~50 min.

### 8.1 Timer CM (20 min)

A context that prints the elapsed time.

### 8.2 suppress (10 min)

`contextlib.suppress(FileNotFoundError)` — when it's appropriate.

### 8.3 Interview (15 min)

"What does with open(...) guarantee?" + the exception path.

### 8.4 async with (5 min)

Link to [python-async](../python-async/README.md) — one sentence.

---

## Checklist

- [ ] __exit__ return True?
- [ ] contextmanager yield once?

**Next:** [09. Exceptions](09-exceptions.md).
