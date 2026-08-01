# 11. Descriptors and `property`

## Intro

A **descriptor** is an object with `__get__` / `__set__` / `__delete__`. `property`, ORM fields, validated attributes — all descriptors.

---

## Protocol

```python
class Desc:
    def __get__(self, obj, objtype=None):
        ...
    def __set__(self, obj, value):
        ...
```

On the class — a **data descriptor**; on the instance dict, the instance attr wins **unless** there's a data descriptor on the class.

---

## property

```python
@property
def price(self):
    return self._price

@price.setter
def price(self, v):
    if v < 0: raise ValueError
    self._price = v
```

Under the hood, `property` is a descriptor.

**Lab:** [`examples/lab/descriptors.py`](examples/lab/descriptors.py).

---

## `__set_name__`

PEP 487 — the descriptor knows the attribute name (`Positive` in the lab).

---

## Subtasks

**Time:** ~65 min.

### 11.1 Order pytest (25 min)

`Positive` descriptor green.

### 11.2 Typed property (20 min)

A descriptor with a str type check.

### 11.3 Interview (15 min)

"How does @property work?" — lookup order.

### 11.4 Django/FastAPI (5 min)

Where descriptors are in the ORM/Pydantic (awareness).

---

## Checklist

- [ ] data vs non-data descriptor?
- [ ] lab green?

**Next:** [12. Dunder](12-dunder-methods.md).
