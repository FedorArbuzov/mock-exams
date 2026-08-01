# 15. Vending Machine

## Intro

The perfect problem for the **State pattern**: idle → has money → dispensing → change.

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

## Classes

```text
VendingMachine (context)
  current_state: State
Product (sku, price, qty)
Coin / Wallet
```

---

## Without the pattern (acceptable)

`enum Status` + `handle_event()` — say when State is overkill.

---

## Sub-tasks

**Time:** ~70 min.

### 15.1 State diagram (15 min)

Draw the 4 states.

### 15.2 Code sketch (35 min)

`State` ABC + 2 states + context.

### 15.3 Out of stock (20 min)

How to build it into the transition?

---

## Checklist

- [ ] Refund path?
- [ ] State vs enum justified?

**Next:** [16. Deck of cards](16-deck-cards.md).
