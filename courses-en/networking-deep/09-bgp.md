# 09. BGP for operators: AS, path, peering

## Intro

BGP is the **routing protocol between autonomous systems (AS)** on the internet and in data centers. DevOps isn't required to configure Cisco, but must understand **why the prefix 10.0.0.0/16 appeared in the table** and what **AS_PATH** is.

Connects to: [aws-advanced/07 TGW](../aws-advanced/07-transit-gateway.md), Calico BGP mode, [bare-metal/04](../bare-metal/04-rack-power-network.md).

---

## Autonomous system (AS)

- An ASN number (16/32 bit).
- One AS = one **routing policy** (one organization or its segment).
- Internet: ASes **exchange** prefixes; in the DC: leaf-spine BGP.

---

## eBGP vs iBGP

| | eBGP | iBGP |
|---|------|------|
| Between | different ASes | within one AS |
| TTL | usually 1 on the link | 255 |
| Full mesh | no | a route reflector needed in large networks |

**Peering session:** TCP **179**, neighbors advertise **NLRI** (prefixes).

---

## Attributes (what to remember)

| Attribute | Meaning for the operator |
|---------|---------------------|
| AS_PATH | which ASes the route traverses; loop detection |
| NEXT_HOP | where to forward the packet |
| LOCAL_PREF | preference within the AS (higher is better) |
| MED | the "cost" at the boundary (weaker than local_pref) |

**Policy:** inbound/outbound route-maps — **which** prefixes to accept and **to whom** to advertise.

---

## Typical DevOps scenarios

### Direct Connect / VPN in AWS

On-prem advertises `192.168.0.0/16`, AWS advertises `10.0.0.0/16`. The TGW route table decides where the packet goes.

### Calico BGP (Kubernetes)

Each node peers with the ToR router; the Pod CIDR is **announced** into the underlay (without overlay VXLAN).

### Anycast / CDN

The same prefix from **different** locations — BGP picks the **nearest** path (simplified).

---

## What BGP doesn't do

- It doesn't replace a **firewall** — it only delivers to the "entrance" of the network.
- It doesn't balance **L7** — only reachability (L3).
- It doesn't fix **overlapping RFC1918** without NAT or renumbering.

---

## Diagnostics (if you have access)

```bash
# on Linux with FRR/BIRD/GoBGP — depends on the stack
vtysh -c 'show ip bgp summary'
```

In the cloud: **VPC Route Tables**, **TGW attachments**, **VPN tunnel status** — the conceptual equivalent of "neighbor up?".

---

## In mock-exams

- TGW labs: [aws-advanced/08](../aws-advanced/08-lab-transit-gateway.md)
- Calico: [kuber-advanced/09](../kuber-advanced/09-lab-cni-calico.md)

---

## Summary

BGP answers **"who knows the route to network X"** at DC/internet scale. For K8s it's an optional way to **inject Pod routes** into the underlay.

---

## Checklist

- [ ] How does eBGP at the DC edge differ from iBGP inside the spine?
- [ ] What happens with the same `10.0.0.0/16` in the VPN and the VPC without NAT?
- [ ] Why Calico BGP mode?

**Next:** [10. DNS in production](10-dns-production.md).
