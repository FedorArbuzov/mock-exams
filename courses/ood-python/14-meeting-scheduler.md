# 14. Meeting Room Scheduler

## Введение

Комнаты, брони, конфликты по времени — **interval overlap**, календарь.

---

## Clarifying

- Один день или recurring?
- Timezone?
- Cancel/reschedule?

**MVP:** `book(room_id, start, end)` → ok / conflict.

---

## Модель

```python
@dataclass
class Booking:
    room_id: int
    start: datetime
    end: datetime
    user_id: str

class Scheduler:
    def book(self, booking: Booking) -> bool: ...
```

Overlap: `start1 < end2 and start2 < end1`.

---

## OOD

- `Room`, `Booking`
- `SchedulerService`
- `BookingRepository`

Strategy: `ConflictPolicy` (reject vs suggest slot).

---

## Подзадачи

**Время:** ~70 мин.

### 14.1 Overlap logic (20 мин)

Функция `overlaps(a, b) -> bool` + 3 test cases.

### 14.2 Design (25 мин)

Классы + book flow.

### 14.3 Recurring (15 мин)

Устно: RRULE vs expand instances — trade-off.

### 14.4 Scale (10 мин)

1000 rooms — index by room_id + sorted intervals.

---

## Чек-лист

- [ ] Conflict detection?
- [ ] Immutable Booking?

**Дальше:** [15. Vending machine](15-vending-machine.md).
