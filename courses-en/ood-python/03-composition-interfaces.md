# 03. Composition, ABC, Protocol

## Intro

"Inherit everything from `BaseModel`" isn't OOD. **Composition** and **interfaces** (Protocol/ABC) are the foundation of Python design in interviews.

[python-deep-dive/15](../python-deep-dive/15-typing-protocols.md).

---

## Composition over inheritance

```python
class Car:
    def __init__(self, engine: Engine, gps: GPS):
        self._engine = engine
        self._gps = gps
```

---

## Protocol (structural)

```python
class Storable(Protocol):
    def save(self) -> None: ...
    def load(self) -> None: ...
```

---

## ABC (nominal)

```python
class Repository(ABC):
    @abstractmethod
    def get(self, id: int): ...
```

In the interview: "duck typing + Protocol for tests and substitutions".

---

## dataclass for a DTO

```python
@dataclass(frozen=True, slots=True)
class Book:
    isbn: str
    title: str
```

Entity vs value object: frozen = value.

---

## Sub-tasks

**Time:** ~50 min.

### 3.1 Refactor inheritance (20 min)

`AdminUser(User)` with extra methods → composition with `Permissions`.

### 3.2 Protocol (15 min)

`Cache` protocol + `DictCache` + `RedisCache` stub.

### 3.3 Entity vs VO (15 min)

Two dataclasses: `Money(frozen)` vs `ShoppingCart(mutable)`.

---

## Checklist

- [ ] Protocol vs ABC?
- [ ] Composition example?

**Next:** [04. Process](04-interview-process.md).
