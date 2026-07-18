# 07. Сеть на хосте: bonding, VLAN, MTU

## Интерфейсы

```bash
ip link show
ip addr show
```

Имена: `eno1`, `ens3f0` (predictable) или старые `eth0`.

## Bonding (LAG)

Объединение 2+ NIC в один логический **bond0** для отказоустойчивости и/или bandwidth:

| Режим | Описание |
|---|---|
| **active-backup** (mode 1) | один активный, второй standby |
| **802.3ad** (LACP, mode 4) | нужна поддержка switch |

```text
eno1 ──┐
       ├── bond0 ── 10.0.1.50
eno2 ──┘
```

В Kubernetes node address часто на bond или VLAN interface.

## VLAN (802.1Q)

```text
eno1.100  → VLAN 100 (production)
eno1.200  → VLAN 200 (storage)
```

Subinterface `eno1.100` — tagged traffic. TOR должен trunk VLAN.

Аналогия AWS: несколько subnet ENI на одном instance — логически похоже, реализация другая.

## MTU

- Стандарт **1500**.
- **Jumbo frames 9000** — storage network (NFS, Ceph), только end-to-end.
- **MTU mismatch** — silent performance pain или black holes (особенно VPN/overlay).

В Kubernetes: Calico/VXLAN/wireguard — учитывать overhead (уроки в `kuber-advanced`).

## DNS и `/etc/resolv.conf`

На bare metal — корпоративные DNS. В cloud — VPC DNS (Route53 resolver).

## Firewall

**nftables/iptables** на хосте + security groups в облаке — разные слои. На metal только host firewall (и внешний firewall ЦОД).

## Чек-лист

- Bond mode 1 vs 4?
- Зачем VLAN на сервере?
- Jumbo frames — когда?
- Где настраивается MTU для pod network?

Следующий урок: [08-operations-lifecycle.md](08-operations-lifecycle.md).
