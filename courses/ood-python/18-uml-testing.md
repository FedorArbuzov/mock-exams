# 18. UML, диаграммы, тесты

## Введение

UML на доске — **коммуникация**, не цель. Тесты показывают **testability** дизайна.

---

## Минимум UML

- Class diagram: 4–6 классов
- Sequence: один use case (checkout)
- State: vending / order status

Не тратьте 15 мин на стрелки — 5 мин sketch достаточно.

---

## Тесты в OOD интервью

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

## Подзадачи

**Время:** ~55 мин.

### 18.1 Sequence (20 мин)

Checkout bookstore — 5 сообщений между объектами.

### 18.2 Write 2 tests (25 мин)

Для parking или LRU без подглядывания в solutions.

### 18.3 Mock vs fake (10 мин)

Когда `unittest.mock` vs `FakeRepo`?

---

## Чек-лист

- [ ] Один sequence diagram?
- [ ] Тест на edge case?

**Дальше:** [19. Q&A](19-interview-qa.md).
