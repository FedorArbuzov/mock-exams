# 06. NAT: SNAT/DNAT, hairpin, mapping to AWS IGW/NAT

## Intro

NAT translates addresses at a boundary. DevOps sees NAT in **iptables MASQUERADE**, **Docker**, **kube-proxy**, the **AWS NAT Gateway**, and **ALB**. Different places — one idea: **conntrack ties together** the external and internal 5-tuple.

Baseline: [linux-intermediate/05–06](../linux-intermediate/05-nat-forwarding.md).

---

## SNAT and DNAT

| Type | Direction | Example |
|-----|-------------|--------|
| SNAT | internal → external | private subnet → internet via NAT GW |
| DNAT | external → internal | ALB → instance:8080, `kubectl port-forward` |

```bash
# MASQUERADE example (illustrative, don't copy-paste to prod without policy)
iptables -t nat -A POSTROUTING -s 172.28.0.0/24 -o eth0 -j MASQUERADE
```

---

## Hairpin (NAT loopback)

A client **inside** the network reaches the **public DNS** name of its own service:

```text
App (10.0.10.5) → public IP ALB → ???
```

Without hairpin/NAT reflection the packet goes "outward" and is lost. Solutions:

- **internal DNS** (private zone) → private IP / internal ALB
- split-horizon DNS
- NAT hairpin on the edge router (rare in the cloud)

---

## Docker NAT

```text
Container 172.17.0.2 → NAT to the host IP → internet
Host → container: published port -p 8080:80
```

The `docker0` bridge is a separate subnet; **don't confuse** it with the VPC CIDR on EC2.

---

## AWS: IGW vs NAT Gateway

| | Internet Gateway | NAT Gateway |
|---|------------------|-------------|
| Direction | inbound+outbound for a public IP | outbound SNAT only |
| Where | public subnet route | private subnet default route |
| Public IP on the instance | yes (optional) | no on the instance |

The **NACL** on the NAT subnet is stateless: you need ephemeral ports **back**.

---

## kube-proxy SNAT

Pod → external IP: often SNAT to the **node's IP** (or an IP from the CNI's SNAT policy). That's why the **SG on the node** and the **NACL** matter for egress.

---

## In mock-exams

- NAT lab: [linux-intermediate/06-lab-nat](../linux-intermediate/06-lab-nat.md)
- VPC: [aws-intermediate/01](../aws-intermediate/01-vpc-custom.md)

---

## Summary

NAT **hides** topology and **breaks** tracing if you ignore translation. Hairpin and split DNS are frequent "magic" bugs after migrating to the cloud.

---

## Checklist

- [ ] Explain SNAT when a Pod egresses to the internet on EKS.
- [ ] Why can't a private instance without NAT pull images?
- [ ] How does the ALB's DNAT differ from the NAT GW's SNAT?

**Next:** [07. AWS VPC](07-vpc-aws.md).
