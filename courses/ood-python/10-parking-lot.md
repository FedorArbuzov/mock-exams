# 10. Parking Lot

## Введение

Классика OOD: типы ТС, места, парковка/выезд. Проверяют **enum**, **allocation**, расширение (bus = 5 spots — optional).

---

## Clarifying questions

- Bus занимает 1 spot или несколько?
- Оплата / билеты в scope?
- Multi-level lot?

**MVP:** motorcycle/car → место своего типа; **bus** в упрощении занимает **одно car-место** (расширение: 5 car spots — см. подзадачу 10.3); `leave(spot_id)`.

---

## Модель

```text
ParkingLot
  ├── Spot (id, VehicleType, plate?)
  └── park(type, plate) -> spot_id | None
```

См. [examples/ood/parking_lot.py](examples/ood/parking_lot.py).

---

## Расширения (если спросят)

- `find_vehicle(plate)`
- Pricing per hour
- Handicapped spots

---

## Подзадачи

**Время:** ~70 мин.

### 10.1 Design (15 мин)

Классы на доске без кода.

### 10.2 Implement (35 мин)

`examples/ood/parking_lot.py` + `pytest`.

### 10.3 Extension (20 мин)

Устно: bus занимает 3 car spots — как меняется дизайн?

---

## Чек-лист

- [ ] park/leave API?
- [ ] Тесты зелёные?

**Дальше:** [11. LRU Cache](11-lru-cache.md).
