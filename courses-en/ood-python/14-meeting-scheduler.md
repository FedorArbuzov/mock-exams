# 14. Meeting Room Scheduler

## Intro

Rooms, bookings, time conflicts — **interval overlap**, a calendar.

---

## Clarifying

- One day or recurring?
- Timezone?
- Cancel/reschedule?

**MVP:** `book(room_id, start, end)` → ok / conflict.

---

## Model

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

## Sub-tasks

**Time:** ~70 min.

### 14.1 Overlap logic (20 min)

An `overlaps(a, b) -> bool` function + 3 test cases.

### 14.2 Design (25 min)

Classes + book flow.

### 14.3 Recurring (15 min)

Out loud: RRULE vs expanding instances — trade-off.

### 14.4 Scale (10 min)

1000 rooms — index by room_id + sorted intervals.

---

## Checklist

- [ ] Conflict detection?
- [ ] Immutable Booking?

**Next:** [15. Vending machine](15-vending-machine.md).
