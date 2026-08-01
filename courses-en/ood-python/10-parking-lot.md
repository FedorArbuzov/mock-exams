# 10. Parking Lot

## Intro

An OOD classic: vehicle types, spots, parking/leaving. It tests **enum**, **allocation**, and extension (bus = 5 spots — optional).

---

## Clarifying questions

- Does a bus take 1 spot or several?
- Are payment / tickets in scope?
- Multi-level lot?

**MVP:** motorcycle/car → a spot of its own type; a **bus** in the simplified version takes **one car spot** (extension: 5 car spots — see sub-task 10.3); `leave(spot_id)`.

---

## Model

```text
ParkingLot
  ├── Spot (id, VehicleType, plate?)
  └── park(type, plate) -> spot_id | None
```

See [examples/ood/parking_lot.py](examples/ood/parking_lot.py).

---

## Extensions (if asked)

- `find_vehicle(plate)`
- Pricing per hour
- Handicapped spots

---

## Sub-tasks

**Time:** ~70 min.

### 10.1 Design (15 min)

Classes on the whiteboard without code.

### 10.2 Implement (35 min)

`examples/ood/parking_lot.py` + `pytest`.

### 10.3 Extension (20 min)

Out loud: a bus takes 3 car spots — how does the design change?

---

## Checklist

- [ ] park/leave API?
- [ ] Tests green?

**Next:** [11. LRU Cache](11-lru-cache.md).
