# 10. DNS in production: split-horizon, TTL, failures

## Intro

In 30% of incidents "the network doesn't work" is **stale DNS** or split-horizon. Baseline: [linux-intermediate/03](../linux-intermediate/03-dns.md), BIND sandbox: `172.28.0.53` in [deploy/linux](../../deploy/linux/README.md).

---

## Resolution hierarchy

```text
Application → /etc/nsswitch → stub resolver (systemd-resolved)
           → recursive (corp DNS / 8.8.8.8)
           → authoritative (zone owner)
```

```bash
dig +trace api.example.com
dig @172.28.0.53 app.lab.local
```

---

## TTL and cache

| Event | Effect |
|---------|--------|
| IP change, TTL=300 | clients on the old one for up to 5 min |
| TTL=0 | more load on the authoritative server |
| Negative caching (NXDOMAIN) | "name doesn't exist" is remembered |

For a **failover**, lower the TTL **in advance**, not at the moment of the outage.

---

## Split-horizon (views)

One FQDN, **different answers**:

```text
api.service.internal
  from the VPC:     10.0.10.50 (internal ALB)
  from the internet: 203.0.113.10 (public ALB)
```

Without this — hairpin and unnecessary NAT ([06-nat](06-nat.md)).

---

## Kubernetes DNS

`service.namespace.svc.cluster.local` — CoreDNS. Problems:

- **ndots:5** — extra search suffixes → delays
- headless vs ClusterIP
- externalName — a CNAME, not an IP

```bash
kubectl run -it --rm dnstest --image=busybox -- nslookup my-svc.default.svc.cluster.local
```

---

## Private hosted zones (Route 53)

VPC association — the zone is visible **only** from associated VPCs. Check the **resolver rules** and **hybrid DNS** (on-prem ↔ cloud).

---

## Typical failures

| Symptom | Cause |
|---------|---------|
| Works by IP, not by name | DNS / search path |
| Some clients on the old IP | TTL / cache |
| Intermittent | two round-robin records, one is dead |
| `SERVFAIL` | authoritative down, ACL on zone transfer |

---

## In mock-exams

- BIND lab: [linux-intermediate/03](../linux-intermediate/03-dns.md)
- Route53 private: [aws-advanced/09](../aws-advanced/09-route53-privatelink.md)

---

## Summary

DNS is a **distributed cache with policy**. Any IP cutover requires a TTL plan and verification of **all** resolver paths (corp laptop, Pod, Lambda VPC).

---

## Checklist

- [ ] Explain split-horizon using an internal ALB as an example.
- [ ] Why `dig +trace`?
- [ ] How does ndots affect latency?

**Next:** [11. TLS, SNI, MTU](11-tls-mtu.md).
