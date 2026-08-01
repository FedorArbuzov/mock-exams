# 14. Security zones, zero trust, DDoS at the edge

## Intro

The network is not just connectivity, but also **trust boundaries**. Connects to: [linux-security](../linux-security/README.md), [aws-advanced/11 WAF](../aws-advanced/11-waf-shield.md), [secrets-basic](../secrets-basic/README.md).

---

## Defense in depth (network layer)

```text
Internet
  → DDoS scrubbing / WAF (L7)
  → Perimeter FW / ALB SG
  → Public subnet (bastion, LB only)
  → Private app subnet (SG: only from LB SG)
  → Data subnet (SG: only from app SG)
```

Each hop is a **separate** rule, not "one firewall for everything."

---

## Zero trust (network aspect)

- **No** implicit trust inside the VPC ("we're in private, so it's safe").
- **mTLS** or an identity-aware proxy between services.
- **Micro-segmentation:** SG per tier, NetworkPolicy per namespace.
- **Least privilege egress:** not the whole `0.0.0.0/0` from the app subnet without a reason.

---

## Bastion vs SSM vs VPN

| Access | Risk | Note |
|--------|------|------------|
| Bastion SSH | keys, jump host compromise | SG only from corp IP |
| SSM Session Manager | no inbound SSH | IAM policy |
| Client VPN | broad L3 into the VPC | split tunnel preferred |

Checking "ping works from the bastion" does **not** replace the user path.

---

## DDoS and volumetric

- **Edge:** Shield, CloudFront, WAF rate limits.
- **ALB:** connection surges, scale targets.
- **NACL** — a blunt hammer (stateless), be careful with the ephemeral return.

An application-layer flood (an expensive API) is addressed with **L7 rate limits** and auth, not just a firewall.

---

## Exfiltration paths

- Open egress NAT → miner, data leak.
- VPC endpoint misconfig → data to the wrong account (rare, but IAM + bucket policy).
- DNS tunneling — monitor anomalous DNS ([10-dns-production](10-dns-production.md)).

---

## Network compliance (briefly)

- **Segmentation** PCI: CDE isolated.
- **Logging:** VPC Flow Logs, ALB access logs, firewall logs.
- **Encryption in transit:** TLS everywhere, IPsec for site-to-site.

---

## In mock-exams

- WAF lab: [aws-advanced/12](../aws-advanced/12-lab-waf.md)
- linux-security: [linux-security](../linux-security/README.md)

---

## Summary

A secure network means **minimal paths** and **explicit deny**. Zero trust removes "private = safe." DDoS is multi-layered: edge + app limits.

---

## Checklist

- [ ] Draw the three zones for your service.
- [ ] Where is egress open for you, and why?
- [ ] How does a WAF differ from an SG?

**Next:** [15. Troubleshooting lab](15-lab-troubleshooting.md).
