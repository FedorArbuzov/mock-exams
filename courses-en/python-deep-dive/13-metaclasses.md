# 13. Metaclasses (when and why)

## Intro

`type` is the default metaclass. `class Foo: pass` → `type('Foo', (), {})` is the low-level equivalent.

**In interviews:** know the **concept**; in prod it's rare, more often a **decorator** or `__init_subclass__`.

---

## `__init_subclass__` (often better)

```python
class Base:
    def __init_subclass__(cls, **kwargs):
        super().__init_subclass__(**kwargs)
        cls.registry = getattr(cls, 'registry', [])
        cls.registry.append(cls)
```

---

## Metaclass use cases

| Case | Alternative |
|------|--------------|
| Registering subclasses | `__init_subclass__` |
| Validating attrs | Pydantic, dataclass |
| ORM | SQLAlchemy does it for you |

```python
class Meta(type):
    def __new__(mcs, name, bases, namespace):
        ...
        return super().__new__(mcs, name, bases, namespace)
```

---

## Subtasks

**Time:** ~50 min.

### 13.1 init_subclass (20 min)

A plugin registry across 3 classes.

### 13.2 When NOT a metaclass (15 min)

3 situations from experience — a decorator is simpler.

### 13.3 Interview (15 min)

"What is a metaclass?" 90 sec without overclaiming.

---

## Checklist

- [ ] Do you know __init_subclass__?
- [ ] You don't suggest a metaclass everywhere?

**Next:** [14. __slots__](14-slots.md).
