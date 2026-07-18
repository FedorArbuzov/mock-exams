# 07. Итераторы и генераторы

## Введение

`for x in iterable` вызывает `iter()` → `__next__()` до `StopIteration`. **Generator** — функция с `yield`, lazy и memory-efficient.

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

`yield from` — делегирование sub-generator.

---

## Лаба

[`examples/lab/generators.py`](examples/lab/generators.py) — `running_max`.

---

## Подзадачи

**Время:** ~60 мин.

### 7.1 running_max (20 мин)

pytest green.

### 7.2 Generator expr (15 мин)

`sum(x*x for x in range(10))` vs list comp memory.

### 7.3 send/throw (15 мин)

Прочитайте про `gen.send()` — когда полезно (coroutine proto).

### 7.4 Interview (10 мин)

«Iterator vs generator» — ответ.

---

## Чек-лист

- [ ] StopIteration понятен?
- [ ] running_max green?

**Дальше:** [08. Context managers](08-context-managers.md).
