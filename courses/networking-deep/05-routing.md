# 05. Маршрутизация: таблицы, policy routing, асимметрия

## Введение

Пакет «знает» только destination IP. **Таблица маршрутов** решает, в какой интерфейс его отдать. «Пинг с хоста A идёт, с B нет» — часто **разные таблицы** или asymmetric path.

База: [linux-intermediate/01](../linux-intermediate/01-tcp-ip.md). Лаба NAT: [05-nat-forwarding](../linux-intermediate/05-nat-forwarding.md).

---

## Longest prefix match

При нескольких маршрутах к `10.0.10.5` выбирается **самый длинный префикс** (наиболее специфичный).

```text
10.0.0.0/8      via 192.168.1.1
10.0.10.0/24    via 10.0.1.1      ← победит для 10.0.10.5
```

---

## Default route и blackholes

```bash
ip route show default
ip route get 203.0.113.50 from 10.0.10.5
```

| Симптом | Причина |
|---------|---------|
| `Network is unreachable` | нет маршрута |
| Пакеты уходят, ответа нет | asymmetric routing, NACL, SG |
| Трафик «не туда» | static route на старый VPN |

В AWS **route table** привязана к **subnet** — instance наследует маршруты subnet (не «свою» таблицу на ENI, кроме special cases).

---

## Policy routing (ip rule)

Несколько таблиц — выбор по **source IP**, fwmark, uid.

```bash
ip rule list
ip route show table main
ip route show table 100
```

Use case: **management** трафик с `eth1`, production с `eth0`; multi-homed сервер; некоторые CNI.

---

## ECMP

Несколько next-hop с одинаковым cost — hash по flow (обычно 5-tuple). Одно соединение не «прыгает» между путями; новые flows — распределяются.

---

## Асимметричная маршрутизация

```text
Request:  Client → FW-A → Server
Response: Server → FW-B → Client   (FW-B не видел SYN)
```

Stateful firewall / conntrack **дропает** ответ. Лечение: **симметричный** forward/return path или stateless ACL только там, где допустимо.

---

## VPC route tables (AWS)

| Destination | Target | Subnet type |
|-------------|--------|-------------|
| `10.0.0.0/16` | local | любой |
| `0.0.0.0/0` | igw-xxx | public |
| `0.0.0.0/0` | nat-xxx | private |
| `pl-xxx` (S3 prefix list) | vpc-endpoint | private без NAT |

**Implicit router** в VPC — не Linux box, но логика LPM та же.

---

## В mock-exams

- Custom VPC lab: [aws-intermediate/02-lab-vpc-custom](../aws-intermediate/02-lab-vpc-custom.md)
- Лаба диагностики: [15-lab-troubleshooting](15-lab-troubleshooting.md)

---

## Резюме

Маршрутизация — **детерминированный выбор интерфейса**. Policy routing и multi-homing усложняют картину; asymmetric path — классика «иногда работает».

---

## Чек-лист

- [ ] Объясните LPM на примере двух маршрутов.
- [ ] Почему ответный пакет должен пройти через тот же stateful FW?
- [ ] Где в AWS задаётся default route для private subnet?

**Дальше:** [06. NAT](06-nat.md).
