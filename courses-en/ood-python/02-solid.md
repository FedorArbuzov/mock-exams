# 02. SOLID in Python

## Intro

SOLID is a language for **justifying** your design in an interview, not magic letters to slap on every class.

---

## S — Single Responsibility

One class — one reason to change.

```python
# bad: ReportGenerator and saves to disk
# good: ReportBuilder + FileExporter
```

---

## O — Open/Closed

Open for extension, closed for modification.

```python
class PaymentProcessor(ABC):
    @abstractmethod
    def charge(self, amount: Decimal) -> str: ...

class StripeProcessor(PaymentProcessor): ...
```

A new provider means a new class, not editing `if provider ==`.

---

## L — Liskov Substitution

A subclass doesn't break the base class's contract. `Square`/`Rectangle` is the classic counterexample.

---

## I — Interface Segregation

Small Protocols instead of a "god interface".

---

## D — Dependency Inversion

Depend on an abstraction:

```python
class OrderService:
    def __init__(self, repo: OrderRepository): ...
```

---

## Sub-tasks

**Time:** ~55 min.

### 2.1 Violating S (15 min)

Find a class in your code with 2+ responsibilities; split it on paper.

### 2.2 OCP (15 min)

`Notifier`: Email/SMS without `if type`.

### 2.3 DIP (15 min)

`BookService` + `InMemoryRepo` / `PostgresRepo` constructor.

### 2.4 Out loud (10 min)

Explain one principle in 60 seconds with an example.

---

## Checklist

- [ ] Can you name all 5?
- [ ] A DIP example from practice?

**Next:** [03. Composition](03-composition-interfaces.md).
