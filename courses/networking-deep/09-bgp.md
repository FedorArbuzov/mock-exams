# 09. BGP для операторов: AS, path, peering

## Введение

BGP — **протокол маршрутизации между автономными системами (AS)** в интернете и в дата-центрах. DevOps не обязан конфигурировать Cisco, но должен понимать **почему префикс 10.0.0.0/16 появился в таблице** и что такое **AS_PATH**.

Связь: [aws-advanced/07 TGW](../aws-advanced/07-transit-gateway.md), Calico BGP mode, [bare-metal/04](../bare-metal/04-rack-power-network.md).

---

## Автономная система (AS)

- Номер ASN (16/32 bit).
- Одна AS = одна **политика маршрутизации** (одна организация или её сегмент).
- Internet: AS **обмениваются** префиксами; в DC: leaf-spine BGP.

---

## eBGP vs iBGP

| | eBGP | iBGP |
|---|------|------|
| Между | разными AS | внутри одной AS |
| TTL | обычно 1 на линке | 255 |
| Full mesh | нет | нужен route reflector в больших сетях |

**Peering session:** TCP **179**, соседи объявляют **NLRI** (префиксы).

---

## Атрибуты (что помнить)

| Атрибут | Смысл для оператора |
|---------|---------------------|
| AS_PATH | через какие AS идёт маршрут; loop detection |
| NEXT_HOP | куда форвардить пакет |
| LOCAL_PREF | предпочтение внутри AS (выше — лучше) |
| MED | «стоимость» на границе (слабее local_pref) |

**Policy:** inbound/outbound route-maps — **какие** префиксы принять и **кому** отдать.

---

## Типичные сценарии DevOps

### Direct Connect / VPN в AWS

On-prem объявляет `192.168.0.0/16`, AWS — `10.0.0.0/16`. TGW route table решает, куда уйдёт пакет.

### Calico BGP (Kubernetes)

Каждая нода — peer с ToR router; Pod CIDR **анонсируется** в underlay (без overlay VXLAN).

### Anycast / CDN

Один и тот же префикс из **разных** мест — BGP выбирает **ближайший** path (упрощённо).

---

## Чего BGP не делает

- Не заменяет **firewall** — только доставляет до «входа» в сеть.
- Не балансирует **L7** — только reachability (L3).
- Не чинит **overlapping RFC1918** без NAT или renumbering.

---

## Диагностика (если есть доступ)

```bash
# на Linux с FRR/BIRD/GoBGP — зависит от стека
vtysh -c 'show ip bgp summary'
```

В облаке: **VPC Route Tables**, **TGW attachments**, **VPN tunnel status** — концептуальный аналог «сосед up?».

---

## В mock-exams

- TGW labs: [aws-advanced/08](../aws-advanced/08-lab-transit-gateway.md)
- Calico: [kuber-advanced/09](../kuber-advanced/09-lab-cni-calico.md)

---

## Резюме

BGP отвечает на **«кто знает маршрут до сети X»** на масштабе DC/интернета. Для K8s — опциональный способ **впрыснуть Pod routes** в underlay.

---

## Чек-лист

- [ ] Чем eBGP на границе DC отличается от iBGP внутри spine?
- [ ] Что случится при одинаковом `10.0.0.0/16` в VPN и VPC без NAT?
- [ ] Зачем Calico BGP mode?

**Дальше:** [10. DNS в продакшене](10-dns-production.md).
