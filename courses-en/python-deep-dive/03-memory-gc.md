# 03. Memory, references, garbage collection

## Intro

`a = [1,2]; b = a` — one list in memory, two names. Understanding **references** explains mutations, leaks, and `del`.

---

## Reference counting

Every `PyObject` stores `ob_refcnt`. `+1` on assignment, `-1` when a reference goes away; at 0 it is freed.

```python
import sys
x = []
sys.getrefcount(x)  # inflated because of the temporary reference inside getrefcount
```

---

## Reference cycles

```python
a = []
b = []
a.append(b)
b.append(a)
del a, b  # refcount cycle → generational GC
```

The **gc** module: `gc.collect()`, `gc.get_objects()` — for debugging, not for a prod hot path.

---

## Generational GC

Three generations of objects; younger ones are checked more often. It collects **cycles** and leaves plain refcount objects alone.

---

## interning

Small ints and some strings are reused (`is` for `-5..256`).

---

## Subtasks

**Time:** ~55 min.

### 3.1 Diagram (15 min)

Draw `a=[1]; b=a; a.append(2)` — references before/after.

### 3.2 Cycle (15 min)

Create a list↔list cycle; `gc.collect()` — explain it.

### 3.3 `is` vs `==` (15 min)

5 examples where `is` being True/False is non-obvious.

### 3.4 Interview (10 min)

"How does Python free memory?" — 90 sec.

---

## Checklist

- [ ] refcount + cyclic GC?
- [ ] You don't confuse del with "delete the object everywhere"?

**Next:** [04. Object model](04-object-model.md).
