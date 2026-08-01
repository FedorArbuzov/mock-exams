# 05. Routing: tables, policy routing, asymmetry

## Intro

A packet "knows" only the destination IP. The **route table** decides which interface to hand it to. "Ping works from host A but not from B" — often **different tables** or an asymmetric path.

Baseline: [linux-intermediate/01](../linux-intermediate/01-tcp-ip.md). NAT lab: [05-nat-forwarding](../linux-intermediate/05-nat-forwarding.md).

---

## Longest prefix match

With multiple routes to `10.0.10.5`, the **longest prefix** (the most specific) is chosen.

```text
10.0.0.0/8      via 192.168.1.1
10.0.10.0/24    via 10.0.1.1      ← wins for 10.0.10.5
```

---

## Default route and blackholes

```bash
ip route show default
ip route get 203.0.113.50 from 10.0.10.5
```

| Symptom | Cause |
|---------|---------|
| `Network is unreachable` | no route |
| Packets leave, no reply | asymmetric routing, NACL, SG |
| Traffic goes "the wrong way" | static route to an old VPN |

In AWS the **route table** is attached to a **subnet** — an instance inherits the subnet's routes (not "its own" table on the ENI, except in special cases).

---

## Policy routing (ip rule)

Multiple tables — selected by **source IP**, fwmark, uid.

```bash
ip rule list
ip route show table main
ip route show table 100
```

Use case: **management** traffic on `eth1`, production on `eth0`; a multi-homed server; some CNIs.

---

## ECMP

Multiple next-hops with the same cost — hashed by flow (usually the 5-tuple). A single connection doesn't "hop" between paths; new flows are distributed.

---

## Asymmetric routing

```text
Request:  Client → FW-A → Server
Response: Server → FW-B → Client   (FW-B didn't see the SYN)
```

A stateful firewall / conntrack **drops** the reply. Fix: a **symmetric** forward/return path, or a stateless ACL only where acceptable.

---

## VPC route tables (AWS)

| Destination | Target | Subnet type |
|-------------|--------|-------------|
| `10.0.0.0/16` | local | any |
| `0.0.0.0/0` | igw-xxx | public |
| `0.0.0.0/0` | nat-xxx | private |
| `pl-xxx` (S3 prefix list) | vpc-endpoint | private without NAT |

The **implicit router** in a VPC is not a Linux box, but the LPM logic is the same.

---

## In mock-exams

- Custom VPC lab: [aws-intermediate/02-lab-vpc-custom](../aws-intermediate/02-lab-vpc-custom.md)
- Diagnostics lab: [15-lab-troubleshooting](15-lab-troubleshooting.md)

---

## Summary

Routing is a **deterministic choice of interface**. Policy routing and multi-homing complicate the picture; an asymmetric path is the classic "works sometimes."

---

## Checklist

- [ ] Explain LPM using two routes as an example.
- [ ] Why must the return packet pass through the same stateful FW?
- [ ] Where in AWS is the default route set for a private subnet?

**Next:** [06. NAT](06-nat.md).
