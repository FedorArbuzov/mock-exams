# 14. `__slots__` и память

## Введение

По умолчанию instance хранит attrs в `__dict__`. `__slots__` — фиксированные поля, **меньше памяти**, нет `__dict__` (если не добавлен).

---

## Пример

```python
class Point:
    __slots__ = ('x', 'y')
    def __init__(self, x, y):
        self.x = x
        self.y = y
```

| + | − |
|---|---|
| memory | нельзя произвольные attrs |
| faster attr access | multiple inheritance сложнее |

---

## Когда

Миллионы мелких объектов (события, узлы). В обычном web DTO — **dataclass** достаточно.

---

## dataclass

```python
from dataclasses import dataclass

@dataclass(slots=True)  # 3.10+
class User:
    id: int
    name: str
```

---

## Подзадачи

**Время:** ~45 мин.

### 14.1 Memory sketch (15 мин)

Почему slots экономят (no per-instance dict).

### 14.2 slots=True dataclass (15 мин)

Создайте и попробуйте `u.extra = 1` — ошибка.

### 14.3 Interview (15 мин)

«Когда __slots__?» — ответ.

---

## Чек-лист

- [ ] trade-offs slots?
- [ ] dataclass slots=True?

**Дальше:** [15. Typing](15-typing-protocols.md).
