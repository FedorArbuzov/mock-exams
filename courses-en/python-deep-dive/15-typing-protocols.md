# 15. Typing, Protocol, ABC

## Intro

Static typing in Python is **optional** (mypy/pyright). In interviews: `list[int]`, `Optional`, `Protocol`, the difference between ABC and Protocol.

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

## Subtasks

**Time:** ~55 min.

### 15.1 Protocol (20 min)

A `SupportsClose` protocol + a `close_all` function.

### 15.2 mypy one file (20 min)

Run mypy on a typed module — fix 1 error.

### 15.3 Interview (15 min)

Protocol vs ABC — a table.

---

## Checklist

- [ ] structural vs nominal?
- [ ] Generics basics?

**Next:** [16. weakref](16-weakref.md).
