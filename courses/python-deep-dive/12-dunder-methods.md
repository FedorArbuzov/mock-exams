# 12. Data model: dunder methods

## Введение

[Data model](https://docs.python.org/3/reference/datamodel.html) — контракт объекта с Python. Ключевые для интервью: `__repr__`, `__eq__`, `__hash__`, `__len__`, `__getitem__`.

---

## Частые

| Метод | Вызывается при |
|-------|----------------|
| `__str__` / `__repr__` | print, repr |
| `__eq__` / `__hash__` | ==, set/dict keys |
| `__lt__` … | sort, heapq |
| `__len__` | len() |
| `__getitem__` | obj[key] |
| `__call__` | obj() |

---

## eq и hash

**Правило:** если `__eq__` defined и objects equal → **same hash** (или disable `__hash__ = None`).

Mutable objects — usually `__hash__ = None`, not in set.

---

## Подзадачи

**Время:** ~55 мин.

### 12.1 Money class (25 мин)

`__eq__`, `__repr__`, ordering by amount.

### 12.2 Hashable? (15 мин)

Почему list not hashable, tuple of immutables — yes.

### 12.3 Interview (15 мин)

`__repr__` vs `__str__` — примеры.

---

## Чек-лист

- [ ] eq/hash rule?
- [ ] __repr__ unambiguous?

**Дальше:** [13. Metaclasses](13-metaclasses.md).
