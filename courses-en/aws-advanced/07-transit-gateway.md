# 07. Transit Gateway and VPC Peering

## VPC Peering

Two VPCs in the same or different regions — a **direct** L3 connection.

| Pro | Con |
|---|---|
| Simple | No transitive routing (A↔B and B↔C ≠ A↔C) |
| Cheap | Full mesh with N VPCs — N² peerings |

## Transit Gateway (TGW)

A **hub** for hundreds of VPCs and on-prem (VPN/Direct Connect).

```text
        Transit Gateway
       /    |     \
   VPC-A  VPC-B  VPN (on-prem)
```

| Scenario | Solution |
|---|---|
| 3+ VPCs communicate | TGW |
| 2 VPCs, one region | Peering OK |
| Shared services (egress, DNS) | TGW + central VPC |

## TGW route tables

Separate **TGW route tables** — which attachments see which CIDRs.

- **Spoke VPC** — default route `0.0.0.0/0` → central egress VPC.
- **Inspection VPC** — firewall appliances (advanced).

## RAM (Resource Access Manager)

Share TGW/subnets across accounts in Organizations.

## Cost

TGW — an **hourly** charge + data processing per GB. For labs — create and **delete** it the same day.

## Checklist

- Why does peering scale poorly?
- Transitive routing — what does TGW give you?
- Why a central egress VPC?
- RAM — why in multi-account?

Next lesson: [08-lab-transit-gateway.md](08-lab-transit-gateway.md).
