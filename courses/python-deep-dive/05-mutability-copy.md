# 05. Mutability, copy, `is` vs `==`

## Введение

Default args `def f(a=[])` — классический баг. Причина: **mutable** default создаётся **один раз**.

---

## Типы

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

Nested list: shallow копирует внешний, inner — те же ссылки.

---

## `is` vs `==`

| | `==` | `is` |
|--|------|------|
| Смысл | равенство значения | **идентичность** объекта |
| Когда | почти всегда | `None`, sentinel |

---

## Подзадачи

**Время:** ~50 мин.

### 5.1 Default arg (10 мин)

Демонстрация бага; fix с `None`.

### 5.2 Shallow trap (15 мин)

`a=[[1]]; b=copy.copy(a); b[0].append(2)` — что в `a`?

### 5.3 Interview (15 мин)

«Почему не использовать mutable default?»

### 5.4 tuple trap (10 мин)

`t = ([1],)` — можно ли `t[0].append(1)`?

---

## Чек-лист

- [ ] deep vs shallow?
- [ ] Default None pattern?

**Дальше:** [06. Functions](06-functions-decorators.md).
