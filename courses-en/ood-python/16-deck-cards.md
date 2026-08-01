# 16. Deck of Cards

## Intro

Deck, hand, game (blackjack lite) — **value objects**, `enum`, shuffle.

---

## Model

```python
class Suit(Enum): ...
class Rank(Enum): ...

@dataclass(frozen=True, slots=True)
class Card:
    suit: Suit
    rank: Rank

class Deck:
    def shuffle(self): ...
    def deal(self, n: int) -> list[Card]: ...
```

---

## OOD

- `Hand` holds cards, `value()` for blackjack
- `Game` orchestrates dealer/player
- `Deck` doesn't know about the game rules

---

## Sub-tasks

**Time:** ~65 min.

### 16.1 Card + Deck (25 min)

Implement shuffle (random.shuffle).

### 16.2 Hand value (20 min)

Ace 1/11 — simplify or use a strategy.

### 16.3 Extensibility (20 min)

A new game, Poker — what to reuse?

---

## Checklist

- [ ] Card immutable?
- [ ] Deck single responsibility?

**Next:** [17. URL shortener](17-url-shortener.md).
