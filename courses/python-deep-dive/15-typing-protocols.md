# 15. Typing, Protocol, ABC

## Введение

Static typing в Python — **optional** (mypy/pyright). На интервью: `list[int]`, `Optional`, `Protocol`, разница ABC vs Protocol.

---

## Basics

```python
def fetch(url: str, timeout: float = 5.0) -> bytes: ...
```

`int | None` (3.10+), `Optional[int]` legacy.

---

## Protocol (structural)

```python
from typing import Protocol

class Readable(Protocol):
    def read(self, n: int) -> bytes: ...

def consume(r: Readable) -> int:
    ...
```

Duck typing + type checker.

---

## ABC (nominal)

```python
from abc import ABC, abstractmethod

class Repository(ABC):
    @abstractmethod
    def get(self, id: int): ...
```

---

## Generic

```python
class Stack[T]:
    def push(self, item: T) -> None: ...
```

3.12+ built-in `list[T]` everywhere.

---

## Подзадачи

**Время:** ~55 мин.

### 15.1 Protocol (20 мин)

`SupportsClose` protocol + функция `close_all`.

### 15.2 mypy one file (20 мин)

Запустите mypy на typed module — fix 1 error.

### 15.3 Interview (15 мин)

Protocol vs ABC — таблица.

---

## Чек-лист

- [ ] structural vs nominal?
- [ ] Generics basics?

**Дальше:** [16. weakref](16-weakref.md).
