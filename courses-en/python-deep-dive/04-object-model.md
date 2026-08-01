# 04. Objects, type, class, MRO

## Intro

In Python **everything is an object**, including `class` and `function`. `type(x)` is the metaclass of an instance (usually `type`).

---

## type and class

```python
class Dog: ...
d = Dog()
type(d)        # <class 'Dog'>
type(Dog)      # <class 'type'>
isinstance(d, Dog)  # True
```

---

## MRO (Method Resolution Order)

```python
class A: ...
class B(A): ...
class C(A): ...
class D(B, C): ...

D.__mro__  # D, B, C, A, object
```

**C3 linearization** — a predictable `super()` order.

---

## super()

```python
class B(A):
    def method(self):
        super().method()  # the next in the MRO, not necessarily A
```

---

## Subtasks

**Time:** ~60 min.

### 4.1 Diamond (20 min)

A classic diamond; draw the MRO; call the `super()` chain.

### 4.2 type() factory (15 min)

`type('MyClass', (object,), {'x': 1})` — equivalent to a class statement.

### 4.3 Interview (15 min)

"The difference between class and instance" + MRO in 2 min.

### 4.4 mixin (10 min)

One mixin from your code — why the inheritance order matters.

---

## Checklist

- [ ] Can you read `__mro__`?
- [ ] super() is not "just the parent"?

**Next:** [05. Mutability](05-mutability-copy.md).
