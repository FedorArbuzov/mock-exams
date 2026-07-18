# 06. Функции: closure, decorator

## Введение

Функции — **first-class objects**: присваивание, аргументы, возврат. **Closure** захватывает переменные внешней области.

---

## Closure

```python
def make_adder(n):
    def add(x):
        return x + n
    return add

add5 = make_adder(5)
```

`n` живёт в `__closure__`.

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

**Лаба:** [`examples/lab/decorators.py`](examples/lab/decorators.py).

---

## nonlocal / global

`nonlocal` для замыкания; `global` — редко, избегайте в prod.

---

## Подзадачи

**Время:** ~65 мин.

### 6.1 pytest decorators (25 мин)

`trace_calls` до green.

### 6.2 Parametrized decorator (20 мин)

`@retry(times=3)` sketch.

### 6.3 Closure inspect (10 мин)

`add5.__closure__[0].cell_contents`

### 6.4 Interview (10 мин)

«Что такое decorator?» 60 сек.

---

## Чек-лист

- [ ] functools.wraps?
- [ ] pytest green?

**Дальше:** [07. Generators](07-iterators-generators.md).
