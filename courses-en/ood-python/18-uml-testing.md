# 18. UML, diagrams, tests

## Intro

UML on the whiteboard is **communication**, not the goal. Tests show the **testability** of the design.

---

## Minimum UML

- Class diagram: 4–6 classes
- Sequence: one use case (checkout)
- State: vending / order status

Don't spend 15 min on arrows — a 5-min sketch is enough.

---

## Tests in an OOD interview

```python
def test_park_full_lot():
    lot = ParkingLot(0, 0, 0)
    assert lot.park(VehicleType.CAR, "X") is None
```

- Fake repos
- No DB
- Happy + one edge

[examples/tests](examples/tests/test_ood.py).

---

## pytest fixtures

```python
@pytest.fixture
def empty_lot():
    return ParkingLot(1, 1, 0)
```

---

## Sub-tasks

**Time:** ~55 min.

### 18.1 Sequence (20 min)

Bookstore checkout — 5 messages between objects.

### 18.2 Write 2 tests (25 min)

For parking or LRU without peeking at the solutions.

### 18.3 Mock vs fake (10 min)

When to use `unittest.mock` vs `FakeRepo`?

---

## Checklist

- [ ] One sequence diagram?
- [ ] A test for an edge case?

**Next:** [19. Q&A](19-interview-qa.md).
