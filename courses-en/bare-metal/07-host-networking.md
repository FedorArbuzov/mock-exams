# 07. Host networking: bonding, VLAN, MTU

## Interfaces

```bash
ip link show
ip addr show
```

Names: `eno1`, `ens3f0` (predictable) or the old `eth0`.

## Bonding (LAG)

Combining 2+ NICs into a single logical **bond0** for fault tolerance and/or bandwidth:

| Mode | Description |
|---|---|
| **active-backup** (mode 1) | one active, the other standby |
| **802.3ad** (LACP, mode 4) | requires switch support |

```text
eno1 ──┐
       ├── bond0 ── 10.0.1.50
eno2 ──┘
```

In Kubernetes, the node address is often on a bond or VLAN interface.

## VLAN (802.1Q)

```text
eno1.100  → VLAN 100 (production)
eno1.200  → VLAN 200 (storage)
```

The `eno1.100` subinterface — tagged traffic. The TOR must trunk the VLAN.

AWS analogy: several subnet ENIs on one instance — logically similar, different implementation.

## MTU

- Standard **1500**.
- **Jumbo frames 9000** — storage network (NFS, Ceph), only end-to-end.
- **MTU mismatch** — silent performance pain or black holes (especially VPN/overlay).

In Kubernetes: Calico/VXLAN/wireguard — account for overhead (lessons in `kuber-advanced`).

## DNS and `/etc/resolv.conf`

On bare metal — corporate DNS. In the cloud — VPC DNS (Route53 resolver).

## Firewall

**nftables/iptables** on the host + security groups in the cloud — different layers. On metal, only the host firewall (and the data center's external firewall).

## Checklist

- Bond mode 1 vs 4?
- Why a VLAN on the server?
- Jumbo frames — when?
- Where is the MTU configured for the pod network?

Next lesson: [08-operations-lifecycle.md](08-operations-lifecycle.md).
