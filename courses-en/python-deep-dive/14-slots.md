# 14. `__slots__` and memory

## Intro

By default an instance stores its attrs in `__dict__`. `__slots__` — fixed fields, **less memory**, no `__dict__` (unless one is added).

---

## Example

```python
class Point:
    __slots__ = ('x', 'y')
    def __init__(self, x, y):
        self.x = x
        self.y = y
```

| + | − |
|---|---|
| memory | can't add arbitrary attrs |
| faster attr access | multiple inheritance is harder |

---

## When

Millions of small objects (events, nodes). For an ordinary web DTO, a **dataclass** is enough.

---

## dataclass

```python
from dataclasses import dataclass

@dataclass(slots=True)  # 3.10+
class User:
    id: int
    name: str
```

---

## Subtasks

**Time:** ~45 min.

### 14.1 Memory sketch (15 min)

Why slots save memory (no per-instance dict).

### 14.2 slots=True dataclass (15 min)

Create one and try `u.extra = 1` — an error.

### 14.3 Interview (15 min)

"When to use __slots__?" — answer.

---

## Checklist

- [ ] slots trade-offs?
- [ ] dataclass slots=True?

**Next:** [15. Typing](15-typing-protocols.md).
