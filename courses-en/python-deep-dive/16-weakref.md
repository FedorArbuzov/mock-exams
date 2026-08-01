# 16. weakref and reference cycles

## Intro

A **weakref** is a reference that doesn't increase the refcount. Caches, graphs, observer patterns without leaks.

---

## API

```python
import weakref

class Big: pass
obj = Big()
r = weakref.ref(obj)
r() is obj  # True
del obj
r() is None   # collected
```

`WeakValueDictionary` — a cache by id without holding the objects.

---

## Cycles

A list↔list cycle: GC saves you. A cycle with `__del__` is a historic pain; in modern CPython it's rarely a problem.

---

## Subtasks

**Time:** ~45 min.

### 16.1 weakref demo (15 min)

ref before and after del.

### 16.2 Cache pattern (15 min)

A WeakValueDictionary sketch for an ORM-like cache.

### 16.3 Interview (15 min)

"How does a weakref differ from a regular reference?"

---

## Checklist

- [ ] weakref doesn't prevent GC?
- [ ] Do you know WeakValueDictionary?

**Next:** [17. Threading](17-threading-multiprocessing.md).
