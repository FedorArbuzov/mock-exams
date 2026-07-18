# 08. Overlay: VXLAN, Geneve, Docker bridge, CNI

## Введение

**Underlay** — реальная сеть (VPC, физика). **Overlay** — туннель поверх неё с **своими** IP (Pod CIDR). Kubernetes «сеть» для большинства — overlay + правила NAT.

Связь: [containers-basic/06](../containers-basic/06-networking.md), [kuber-advanced/08](../kuber-advanced/08-network-internals.md), [09-lab-cni-calico](../kuber-advanced/09-lab-cni-calico.md).

---

## Зачем overlay

- Много **логических** сетей на одном underlay.
- Миграция Pod без смены **физической** топологии.
- Policy между Pod без thousands routes в VPC.

---

## VXLAN (упрощённо)

```text
Inner frame:  Pod A 10.244.1.5 → Pod B 10.244.2.3
Outer UDP:    Node1 VPC IP → Node2 VPC IP, VNI=42
```

| Поле | Роль |
|------|------|
| VNI | идентификатор «виртуальной L2» |
| Outer IP | адреса **нод** в underlay |

**MTU:** overlay добавляет заголовки → **PMTUD blackhole** если VPC MTU 1500 и нет jumbo (см. [11-tls-mtu](11-tls-mtu.md)).

---

## Geneve

Более гибкий header (metadata для policy). Используют некоторые CNI / OVN. Для оператора — та же логика: **encap/decap на ноде**.

---

## Docker networking modes

| Mode | Overlay? | Примечание |
|------|----------|------------|
| bridge | L2 bridge + NAT | default |
| host | нет | Pod-like, port conflict |
| macvlan | L2 в LAN | bare metal |
| none | изоляция | sidecar pattern |

---

## CNI в Kubernetes

CNI binary вызывается kubelet при создании Pod:

1. Создать veth в network namespace Pod.
2. Назначить IP из Pod CIDR.
3. Программировать маршруты / eBPF / iptables.

| CNI | Особенность |
|-----|-------------|
| Calico | BGP или overlay, NetworkPolicy |
| Cilium | eBPF, может заменить kube-proxy |
| Flannel | VXLAN простой |
| AWS VPC CNI | Pod IP из subnet VPC (меньше overlay) |

---

## kube-proxy и overlay

Service ClusterIP — **virtual IP**, DNAT на Pod IP через iptables/IPVS/eBPF. **Реальный** path: client → Service IP → kube-proxy → Pod IP (через CNI).

---

## В mock-exams

- Calico lab: [kuber-advanced/09](../kuber-advanced/09-lab-cni-calico.md)
- NetworkPolicy: [kuber-intermediate](../kuber-intermediate/README.md)

---

## Резюме

Overlay **не заменяет** VPC — добавляет слой. Проблемы «Pod не видит Pod» — CNI routes, NP, или MTU — не «DNS сломался» (пока не доказано).

---

## Чек-лист

- [ ] Где заканчивается VPC IP и начинается Pod CIDR?
- [ ] Зачем VXLAN, если есть VPC peering?
- [ ] Что ломается при MTU 1500 end-to-end с overlay?

**Дальше:** [09. BGP](09-bgp.md).
