# 16. Deck of Cards

## Введение

Колода, рука, игра (blackjack lite) — **value objects**, `enum`, shuffle.

---

## Модель

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
- `Deck` не знает про правила игры

---

## Подзадачи

**Время:** ~65 мин.

### 16.1 Card + Deck (25 мин)

Implement shuffle (random.shuffle).

### 16.2 Hand value (20 мин)

Ace 1/11 — упростите или strategy.

### 16.3 Extensibility (20 мин)

Новая игра Poker — что переиспользовать?

---

## Чек-лист

- [ ] Card immutable?
- [ ] Deck single responsibility?

**Дальше:** [17. URL shortener](17-url-shortener.md).
