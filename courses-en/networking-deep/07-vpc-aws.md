# 07. AWS VPC: SG vs NACL, peering, endpoints, TGW

## Intro

A VPC is an **isolated L3 network** in a region. Understanding SG/NACL and routes separates "I opened a port in the app" from "traffic doesn't even reach the ENI." Extends [aws-intermediate/01](../aws-intermediate/01-vpc-custom.md) and [03](../aws-intermediate/03-alb-security-groups.md).

---

## Security Group vs NACL

| | Security Group | Network ACL |
|---|----------------|---------------|
| Level | instance ENI / LB | Subnet |
| Stateful | yes | no (need both directions) |
| Rules | allow only | allow + deny |
| Default | deny inbound | allow all (default ACL) |

**Order:** NACL (subnet edge) → SG (instance). Both must allow the traffic.

Typical debug:

1. SG inbound on the target: is the app port open?
2. SG outbound: egress open or scoped to a specific target?
3. NACL: ephemeral 1024-65535 return path?
4. Route table: correct subnet?

---

## Peering and non-overlapping CIDRs

VPC Peering is an **L3 link** between VPCs; **no transit** (A↔B and B↔C don't give A↔C through B without a full mesh or TGW).

Requirement: **non-overlapping** CIDRs. A conflict of `10.0.0.0/16` in two VPCs makes peering impossible without re-IP.

---

## VPC Endpoints

| Type | What for |
|-----|----------|
| Gateway (S3, DynamoDB) | prefix list in the route table |
| Interface (most services) | ENI + private DNS in the subnet |

Why: traffic to S3 **doesn't go** to the internet → cheaper, no NAT, less exposure.

---

## Transit Gateway (TGW)

A hub for VPCs, VPN, Direct Connect. **Route tables** on the TGW decide who sees which prefixes.

```text
VPC prod ──┐
           ├── TGW ── VPN on-prem
VPC stage ─┘
```

A deeper dive in [aws-advanced/07](../aws-advanced/07-transit-gateway.md).

---

## ALB and the network

- ALB nodes are in **several AZs** — clients hit AZ-local nodes.
- A target in a **private subnet** — SG: allow from the ALB SG on the app port.
- The health check source is the **LB subnets**, not "the internet."

---

## LocalStack caveat

The VPC emulation is **simplified** — learn the **model** in Terraform; for the full networking experience use [optional-aws](../aws-intermediate/optional-aws.md) or a dev account.

---

## In mock-exams

- Terraform VPC: [02-lab-vpc-custom](../aws-intermediate/02-lab-vpc-custom.md)
- Private RDS: [13-rds-private](../aws-intermediate/13-rds-private.md)
- TGW: [aws-advanced/07–08](../aws-advanced/07-transit-gateway.md)

---

## Summary

VPC = **routes + stateful SG + stateless NACL**. Peering doesn't replace a TGW in hub-spoke. Endpoints remove the hairpin through NAT for the AWS API.

---

## Checklist

- [ ] Draw the path Client → ALB → EC2 in a private subnet with SGs.
- [ ] Why did the NACL "allow 443" but the return traffic doesn't flow?
- [ ] When do you need a TGW instead of a peering mesh?

**Next:** [08. Overlay](08-overlay.md).
