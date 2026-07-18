# 06. Structural: adapter, facade, composite

## Введение

Structural — **связи** между классами: обёртка legacy, упрощённый фасад, дерево компонентов.

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

`MenuItem` leaf vs `Menu` composite — `total_price()` рекурсивно.

---

## Подзадачи

**Время:** ~50 мин.

### 6.1 Adapter (20 мин)

Адаптер старого `dict` API к `Repository` interface.

### 6.2 Facade (20 мин)

`LibraryFacade`: borrow/return скрывает catalog + members.

### 6.3 Когда не facade (10 мин)

1 случай god-facade anti-pattern.

---

## Чек-лист

- [ ] Adapter vs inheritance?
- [ ] Facade не бизнес-логика?

**Дальше:** [07. Behavioral](07-behavioral.md).
