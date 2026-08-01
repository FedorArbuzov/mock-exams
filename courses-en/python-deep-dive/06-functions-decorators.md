# 06. Functions: closure, decorator

## Intro

Functions are **first-class objects**: assignment, arguments, return. A **closure** captures variables from the enclosing scope.

---

## Closure

```python
def make_adder(n):
    def add(x):
        return x + n
    return add

add5 = make_adder(5)
```

`n` lives in `__closure__`.

---

## Decorator

```python
def deco(func):
    @functools.wraps(func)
    def wrapper(*args, **kwargs):
        ...
        return func(*args, **kwargs)
    return wrapper
```

`@deco` = `func = deco(func)`.

**Lab:** [`examples/lab/decorators.py`](examples/lab/decorators.py).

---

## nonlocal / global

`nonlocal` for a closure; `global` — rarely, avoid it in prod.

---

## Subtasks

**Time:** ~65 min.

### 6.1 pytest decorators (25 min)

`trace_calls` until green.

### 6.2 Parametrized decorator (20 min)

`@retry(times=3)` sketch.

### 6.3 Closure inspect (10 min)

`add5.__closure__[0].cell_contents`

### 6.4 Interview (10 min)

"What is a decorator?" 60 sec.

---

## Checklist

- [ ] functools.wraps?
- [ ] pytest green?

**Next:** [07. Generators](07-iterators-generators.md).
