# 06. Structural: adapter, facade, composite

## Intro

Structural is about **relationships** between classes: wrapping legacy code, a simplified facade, a tree of components.

---

## Adapter

```python
class LegacyPayment:
    def pay_cents(self, cents: int): ...

class PaymentAdapter:
    def __init__(self, legacy: LegacyPayment):
        self._legacy = legacy
    def pay(self, amount: Decimal):
        self._legacy.pay_cents(int(amount * 100))
```

---

## Facade

```python
class CheckoutFacade:
    def __init__(self, inventory, billing, shipping):
        ...
    def checkout(self, cart_id: str) -> Receipt:
        # orchestrates subsystems
```

---

## Composite

`MenuItem` leaf vs `Menu` composite — `total_price()` recursively.

---

## Sub-tasks

**Time:** ~50 min.

### 6.1 Adapter (20 min)

An adapter from an old `dict` API to a `Repository` interface.

### 6.2 Facade (20 min)

`LibraryFacade`: borrow/return hides catalog + members.

### 6.3 When not to use a facade (10 min)

1 case of the god-facade anti-pattern.

---

## Checklist

- [ ] Adapter vs inheritance?
- [ ] Facade isn't business logic?

**Next:** [07. Behavioral](07-behavioral.md).
