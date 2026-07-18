# 03. Композиция, ABC, Protocol

## Введение

«Наследовать всё от `BaseModel`» — не OOD. **Композиция** и **интерфейсы** (Protocol/ABC) — основа Python-дизайна на интервью.

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

На интервью: «duck typing + Protocol для тестов и подмен».

---

## dataclass для DTO

```python
@dataclass(frozen=True, slots=True)
class Book:
    isbn: str
    title: str
```

Entity vs value object: frozen = value.

---

## Подзадачи

**Время:** ~50 мин.

### 3.1 Refactor inheritance (20 мин)

`AdminUser(User)` с лишними методами → composition `Permissions`.

### 3.2 Protocol (15 мин)

`Cache` protocol + `DictCache` + `RedisCache` stub.

### 3.3 Entity vs VO (15 мин)

Два dataclass: `Money(frozen)` vs `ShoppingCart(mutable)`.

---

## Чек-лист

- [ ] Protocol vs ABC?
- [ ] Composition example?

**Дальше:** [04. Процесс](04-interview-process.md).
