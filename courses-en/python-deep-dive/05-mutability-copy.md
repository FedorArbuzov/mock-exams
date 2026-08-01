# 05. Mutability, copy, `is` vs `==`

## Intro

Default args `def f(a=[])` — a classic bug. The reason: a **mutable** default is created **once**.

---

## Types

| Mutable | Immutable |
|---------|-----------|
| list, dict, set | int, str, tuple, frozenset |
| bytearray | bytes |

---

## Copy

```python
import copy
b = copy.copy(a)       # shallow
c = copy.deepcopy(a)   # recursive
```

Nested list: shallow copies the outer one, the inner ones are the same references.

---

## `is` vs `==`

| | `==` | `is` |
|--|------|------|
| Meaning | value equality | object **identity** |
| When | almost always | `None`, sentinel |

---

## Subtasks

**Time:** ~50 min.

### 5.1 Default arg (10 min)

Demonstrate the bug; fix with `None`.

### 5.2 Shallow trap (15 min)

`a=[[1]]; b=copy.copy(a); b[0].append(2)` — what's in `a`?

### 5.3 Interview (15 min)

"Why not use a mutable default?"

### 5.4 tuple trap (10 min)

`t = ([1],)` — can you do `t[0].append(1)`?

---

## Checklist

- [ ] deep vs shallow?
- [ ] Default None pattern?

**Next:** [06. Functions](06-functions-decorators.md).
