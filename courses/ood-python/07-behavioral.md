# 07. Behavioral: strategy, observer, state

## Введение

Behavioral — **алгоритмы и поведение**, вынесенные из монолитного класса.

---

## Strategy

```python
class PricingStrategy(Protocol):
    def price(self, base: Decimal) -> Decimal: ...

class Order:
    def __init__(self, strategy: PricingStrategy):
        self._strategy = strategy
```

Замена discount rules без изменения `Order`.

---

## Observer

```python
class Subject:
    def attach(self, observer): ...
    def notify(self, event): ...
```

Event bus lite; в prod — [messaging-deep](../messaging-deep/README.md).

---

## State

Vending machine: `IdleState`, `HasMoneyState` — переходы вместо `if status ==`.

Связь: [15-vending-machine](15-vending-machine.md).

---

## Подзадачи

**Время:** ~55 мин.

### 7.1 Strategy (20 мин)

`ShippingStrategy`: standard/express.

### 7.2 Observer (20 мин)

`OrderPlaced` → `EmailNotifier`, `MetricsNotifier`.

### 7.3 State diagram (15 мин)

Vending: 3 states, 4 transitions на бумаге.

---

## Чек-лист

- [ ] Strategy vs if-else?
- [ ] State vs status enum?

**Дальше:** [08. Layering](08-layering.md).
