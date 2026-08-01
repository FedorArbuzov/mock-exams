# 07. Behavioral: strategy, observer, state

## Intro

Behavioral is about **algorithms and behavior** extracted from a monolithic class.

---

## Strategy

```python
class PricingStrategy(Protocol):
    def price(self, base: Decimal) -> Decimal: ...

class Order:
    def __init__(self, strategy: PricingStrategy):
        self._strategy = strategy
```

Swapping discount rules without changing `Order`.

---

## Observer

```python
class Subject:
    def attach(self, observer): ...
    def notify(self, event): ...
```

Event bus lite; in prod — [messaging-deep](../messaging-deep/README.md).

---

## State

Vending machine: `IdleState`, `HasMoneyState` — transitions instead of `if status ==`.

Related: [15-vending-machine](15-vending-machine.md).

---

## Sub-tasks

**Time:** ~55 min.

### 7.1 Strategy (20 min)

`ShippingStrategy`: standard/express.

### 7.2 Observer (20 min)

`OrderPlaced` → `EmailNotifier`, `MetricsNotifier`.

### 7.3 State diagram (15 min)

Vending: 3 states, 4 transitions on paper.

---

## Checklist

- [ ] Strategy vs if-else?
- [ ] State vs status enum?

**Next:** [08. Layering](08-layering.md).
