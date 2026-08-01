# 08. Overlay: VXLAN, Geneve, Docker bridge, CNI

## Intro

The **underlay** is the real network (VPC, physical). The **overlay** is a tunnel on top of it with **its own** IPs (Pod CIDR). For most people the Kubernetes "network" is overlay + NAT rules.

Connects to: [containers-basic/06](../containers-basic/06-networking.md), [kuber-advanced/08](../kuber-advanced/08-network-internals.md), [09-lab-cni-calico](../kuber-advanced/09-lab-cni-calico.md).

---

## Why overlay

- Many **logical** networks on one underlay.
- Pod migration without changing the **physical** topology.
- Policy between Pods without thousands of routes in the VPC.

---

## VXLAN (simplified)

```text
Inner frame:  Pod A 10.244.1.5 → Pod B 10.244.2.3
Outer UDP:    Node1 VPC IP → Node2 VPC IP, VNI=42
```

| Field | Role |
|------|------|
| VNI | identifier of the "virtual L2" |
| Outer IP | the **nodes'** addresses in the underlay |

**MTU:** the overlay adds headers → a **PMTUD blackhole** if the VPC MTU is 1500 and there's no jumbo (see [11-tls-mtu](11-tls-mtu.md)).

---

## Geneve

A more flexible header (metadata for policy). Used by some CNIs / OVN. For the operator it's the same logic: **encap/decap on the node**.

---

## Docker networking modes

| Mode | Overlay? | Note |
|------|----------|------------|
| bridge | L2 bridge + NAT | default |
| host | no | Pod-like, port conflict |
| macvlan | L2 in the LAN | bare metal |
| none | isolation | sidecar pattern |

---

## CNI in Kubernetes

The CNI binary is invoked by kubelet when a Pod is created:

1. Create a veth in the Pod's network namespace.
2. Assign an IP from the Pod CIDR.
3. Program routes / eBPF / iptables.

| CNI | Trait |
|-----|-------------|
| Calico | BGP or overlay, NetworkPolicy |
| Cilium | eBPF, can replace kube-proxy |
| Flannel | simple VXLAN |
| AWS VPC CNI | Pod IP from the VPC subnet (less overlay) |

---

## kube-proxy and overlay

A Service ClusterIP is a **virtual IP**, DNAT'd to the Pod IP via iptables/IPVS/eBPF. The **real** path: client → Service IP → kube-proxy → Pod IP (through the CNI).

---

## In mock-exams

- Calico lab: [kuber-advanced/09](../kuber-advanced/09-lab-cni-calico.md)
- NetworkPolicy: [kuber-intermediate](../kuber-intermediate/README.md)

---

## Summary

Overlay **doesn't replace** the VPC — it adds a layer. "Pod can't see Pod" problems are CNI routes, NP, or MTU — not "DNS broke" (until proven).

---

## Checklist

- [ ] Where does the VPC IP end and the Pod CIDR begin?
- [ ] Why VXLAN if you have VPC peering?
- [ ] What breaks with MTU 1500 end-to-end when using overlay?

**Next:** [09. BGP](09-bgp.md).
