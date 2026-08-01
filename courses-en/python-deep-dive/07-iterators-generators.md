# 07. Iterators and generators

## Intro

`for x in iterable` calls `iter()` → `__next__()` until `StopIteration`. A **generator** is a function with `yield`, lazy and memory-efficient.

---

## Protocol

```python
class CountDown:
    def __init__(self, n):
        self.n = n
    def __iter__(self):
        return self
    def __next__(self):
        if self.n <= 0:
            raise StopIteration
        self.n -= 1
        return self.n + 1
```

---

## Generator

```python
def countdown(n):
    while n > 0:
        yield n
        n -= 1
```

`yield from` — delegating to a sub-generator.

---

## Lab

[`examples/lab/generators.py`](examples/lab/generators.py) — `running_max`.

---

## Subtasks

**Time:** ~60 min.

### 7.1 running_max (20 min)

pytest green.

### 7.2 Generator expr (15 min)

`sum(x*x for x in range(10))` vs list comp memory.

### 7.3 send/throw (15 min)

Read up on `gen.send()` — when it's useful (coroutine proto).

### 7.4 Interview (10 min)

"Iterator vs generator" — answer.

---

## Checklist

- [ ] Is StopIteration clear?
- [ ] running_max green?

**Next:** [08. Context managers](08-context-managers.md).
