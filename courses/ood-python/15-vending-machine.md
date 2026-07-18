# 15. Vending Machine

## Введение

Идеальная задача для **State pattern**: idle → has money → dispensing → change.

[07-behavioral](07-behavioral.md).

---

## States

| State | Events |
|-------|--------|
| Idle | insert coin → HasMoney |
| HasMoney | select product → Dispense |
| Dispense | deliver → Idle |
| | cancel → refund → Idle |

---

## Классы

```text
VendingMachine (context)
  current_state: State
Product (sku, price, qty)
Coin / Wallet
```

---

## Без паттерна (допустимо)

`enum Status` + `handle_event()` — назовите когда State избыточен.

---

## Подзадачи

**Время:** ~70 мин.

### 15.1 State diagram (15 мин)

Нарисуйте 4 состояния.

### 15.2 Code sketch (35 мин)

`State` ABC + 2 states + context.

### 15.3 Out of stock (20 мин)

Как встроить в transition?

---

## Чек-лист

- [ ] Refund path?
- [ ] State vs enum justified?

**Дальше:** [16. Deck of cards](16-deck-cards.md).
