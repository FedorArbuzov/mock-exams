# 16. Synthesis: runbook, interviews, checklist

## Practical task: network runbook

Pick a service:

- teaching: `web` (`172.28.0.20`) from [deploy/linux](../../deploy/linux/README.md);
- or [aws-intermediate image-platform](../aws-intermediate/projects/image-platform/) (ALB + private subnets);
- or the Ingress from [deploy/gitops](../../deploy/gitops/README.md) on `mockctl`.

### Deliverables (2–3 hours)

1. **A path diagram** (ASCII or mermaid): client → edge → app → DB.
2. **A CIDR table** — all subnets / SG / NP on the path.
3. **A runbook** using the template from [chapter 13](13-troubleshooting.md) — at least 5 quick checks.
4. **Three "break and fix"** hypotheses (like in [lab 15](15-lab-troubleshooting.md)) with the expected symptom.
5. **An MTU note** — is there a VPN/overlay on the path ([chapter 11](11-tls-mtu.md)).

### Self-check criteria

| # | Criterion |
|---|----------|
| 1 | The path doesn't mix bastion and user traffic |
| 2 | SG/NACL or host firewall are listed separately |
| 3 | DNS split-horizon is accounted for if there's public + internal |
| 4 | There are L3/L4/L7 commands, not just "restart" |
| 5 | Links to mock-exams courses for a deeper dive |

---

## Course map

```text
01–04   L2–L7 model            →  "which layer hurts"
05–06   Routes, NAT            →  "where the packet goes"
07      AWS VPC                →  "cloud boundaries"
08–09   Overlay, BGP           →  "K8s and DC WAN"
10–11   DNS, TLS, MTU          →  "name, trust, frame size"
12–14   K8s, debug, security   →  "production and zero trust"
15–16   Lab, runbook           →  "your artifact"
```

---

## Interview questions

### 1. Timeout vs connection refused?

**Refused** — an RST from the host: port closed / not listening. **Timeout** — no reply: filter, blackhole route, NP drop, wrong path.

### 2. IGW vs NAT Gateway?

**IGW** — bidirectional for resources with a public IP in a public subnet. **NAT GW** — outbound SNAT only from a private subnet.

### 3. SG vs NACL?

**SG** — stateful on the ENI, allow-only. **NACL** — stateless on the subnet, allow/deny, needs rules for return traffic.

### 4. Why overlay in Kubernetes?

Dense isolation of Pod networks, policy, not exhausting VPC IPs (except VPC CNI mode). The underlay sees the **nodes'** IPs or encapsulation.

### 5. What is BGP in two sentences?

Exchanging routes between ASes. In the DC/cloud — delivering the prefix `10.0.0.0/16` to the right next-hop.

### 6. PMTUD blackhole?

ICMP "fragmentation needed" is blocked with DF=1 → TCP hangs on large packets. Fix: MTU/MSS, allow ICMP, jumbo where supported.

### 7. How do you debug "works in curl from the node, not from a Pod"?

`dig` from the Pod, `ip route` on the node, NetworkPolicy, Service vs Pod IP, different DNS (ndots), SNAT/SG on the node.

---

## In mock-exams — where to go next

| Goal | Course |
|------|------|
| CKA networking exam | [kuber-advanced](../kuber-advanced/README.md), [mock-ckad](../mock-ckad/README.md) |
| AWS production networking | [aws-advanced](../aws-advanced/README.md) TGW, PrivateLink |
| SRE processes | [sre](../sre/README.md) |
| Path metrics | [observability-*](../observability-basic/README.md) |
| nginx / TLS edge | [nginx-intermediate](../nginx-intermediate/README.md) |

---

## Master maturity checklist

- [ ] I can design a `/16` VPC with public/private and NAT without overlap.
- [ ] I explain the packet path Pod → internet on EKS.
- [ ] I run an incident by layers without "opening all ports."
- [ ] I know where to look at Flow Logs / tcpdump / `ss`.
- [ ] A runbook document sits next to the service in Git.

---

## Summary

Networking-deep ends with **your** runbook — not someone else's diagram. If you can draw the path and name **one command per layer** — the course has achieved its goal.
