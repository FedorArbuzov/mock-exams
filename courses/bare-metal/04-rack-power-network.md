# 04. Стойка, питание, физическая сеть

## Стойка (rack)

- **19 inch** ширина, юниты (U) по высоте.
- **PDU** (Power Distribution Unit) — «удлинитель в стойке», питание серверов.
- **Два PDU (A/B feeds)** — отказоустойчивость: сервер с двумя БП подключён к разным линиям.

```text
PDU-A ──────┬── server PSU1
            │
PDU-B ──────┴── server PSU2
```

Потеря одного PDU или линии — сервер работает.

## Охлаждение

- **Hot aisle / cold aisle** — лицом в холодный коридор, сзадь в горячий.
- Перегрев → throttle CPU → алерты BMC.

## Физическая сеть в ЦОД

```text
Server TOR switch (Top of Rack)
        │
   Leaf / Spine (большие ЦОД)
        │
   Router / Firewall
```

| Термин | Значение |
|---|---|
| **TOR** | коммутатор наверху стойки, короткие патчкорды |
| **Cross-connect** | кабель сервер ↔ TOR |
| **SFP+/QSFP** | оптика 10G/25G/100G |

## VLAN на проводе

Сервер может гнать **802.1Q tagged** VLAN на TOR — несколько логических сетей с одного NIC (как в AWS multiple ENI/subnets, но на L2).

## Cabling checklist при приёмке

- [ ] BMC в management VLAN
- [ ] Production NIC в правильные порты TOR
- [ ] Link speed / duplex согласованы (auto-negotiate обычно OK)
- [ ] Метки на кабелях (asset tags)

## Облако vs ЦОД

В AWS **физическую** прокладку кабеля вы не видите. В on-prem DevOps часто участвует в **rack table** — какой сервер в какой U, какой MAC, какой switch port.

## Чек-лист

- Зачем два PDU?
- TOR — что это?
- Hot/cold aisle — зачем?
- Tagged VLAN на сервере — зачем?

Следующий урок: [05-os-provisioning.md](05-os-provisioning.md).
