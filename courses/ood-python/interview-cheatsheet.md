# OOD Python — interview cheatsheet

Краткая шпаргалка перед раундом. Детали — в главах 01–20.

---

## 45-минутный процесс

1. Clarify scope (5 min)
2. Entities + use cases (5 min)
3. Public API sketch (5 min)
4. Implement happy path (20 min)
5. Extension + tests (5 min)
6. Trade-offs (5 min)

---

## SOLID (one-liners)

| | |
|--|--|
| **S** | one reason to change |
| **O** | extend via new types |
| **L** | substitutable subclasses |
| **I** | small interfaces |
| **D** | depend on abstractions |

---

## Паттерны — когда назвать

| Pattern | Trigger |
|---------|---------|
| Strategy | interchangeable algorithms |
| State | many transitions |
| Factory | create family of objects |
| Adapter | legacy API |
| Facade | simplify subsystems |
| Repository | persistence swap |

---

## Python defaults

- `Protocol` for interfaces
- `@dataclass(frozen=True)` for value objects
- Composition > deep inheritance
- Module as singleton, not class

---

## Классические задачи

| Task | Key classes |
|------|-------------|
| Parking | `ParkingLot`, `Spot`, `VehicleType` |
| LRU | `LRUCache`, optional `Cache` Protocol |
| Rate limit | `TokenBucketLimiter`, `RateLimiter` Protocol |
| Bookstore | `CatalogService`, `Cart`, `BookRepository` |
| Vending | `VendingMachine`, `State` hierarchy |

---

## Complexity (coding slice)

- LRU: OrderedDict O(1) amortized
- Overlap: O(n) bookings per room
- Token bucket: O(1) per `allow()`

---

## Вопросы интервьюеру

- Single process? Persistence? Concurrency?
- What's explicitly out of scope?

---

## Мои заметки (заполните)

**Сильные стороны:**

-

**Улучшить:**

-

**Целевая дата mock:**

-
