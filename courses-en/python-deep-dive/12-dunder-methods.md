# 12. Data model: dunder methods

## Intro

The [data model](https://docs.python.org/3/reference/datamodel.html) is the object's contract with Python. The key ones for interviews: `__repr__`, `__eq__`, `__hash__`, `__len__`, `__getitem__`.

---

## Common ones

| Method | Called on |
|-------|----------------|
| `__str__` / `__repr__` | print, repr |
| `__eq__` / `__hash__` | ==, set/dict keys |
| `__lt__` … | sort, heapq |
| `__len__` | len() |
| `__getitem__` | obj[key] |
| `__call__` | obj() |

---

## eq and hash

**Rule:** if `__eq__` is defined and objects are equal → **same hash** (or disable with `__hash__ = None`).

Mutable objects — usually `__hash__ = None`, not in a set.

---

## Subtasks

**Time:** ~55 min.

### 12.1 Money class (25 min)

`__eq__`, `__repr__`, ordering by amount.

### 12.2 Hashable? (15 min)

Why a list is not hashable, but a tuple of immutables is.

### 12.3 Interview (15 min)

`__repr__` vs `__str__` — examples.

---

## Checklist

- [ ] eq/hash rule?
- [ ] __repr__ unambiguous?

**Next:** [13. Metaclasses](13-metaclasses.md).
