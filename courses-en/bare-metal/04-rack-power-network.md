# 04. Rack, power, physical network

## Rack

- **19 inch** width, units (U) for height.
- **PDU** (Power Distribution Unit) — the "power strip in the rack" that feeds the servers.
- **Two PDUs (A/B feeds)** — fault tolerance: a server with two PSUs is connected to different lines.

```text
PDU-A ──────┬── server PSU1
            │
PDU-B ──────┴── server PSU2
```

Losing one PDU or line — the server keeps running.

## Cooling

- **Hot aisle / cold aisle** — front facing the cold aisle, rear facing the hot one.
- Overheating → CPU throttle → BMC alerts.

## Physical network in the data center

```text
Server TOR switch (Top of Rack)
        │
   Leaf / Spine (large data centers)
        │
   Router / Firewall
```

| Term | Meaning |
|---|---|
| **TOR** | switch at the top of the rack, short patch cords |
| **Cross-connect** | cable server ↔ TOR |
| **SFP+/QSFP** | 10G/25G/100G optics |

## VLAN on the wire

A server can push **802.1Q tagged** VLANs to the TOR — several logical networks over a single NIC (like multiple ENIs/subnets in AWS, but at L2).

## Cabling checklist at acceptance

- [ ] BMC in the management VLAN
- [ ] Production NIC in the correct TOR ports
- [ ] Link speed / duplex negotiated (auto-negotiate is usually OK)
- [ ] Labels on the cables (asset tags)

## Cloud vs data center

In AWS you don't see the **physical** cabling. In on-prem, DevOps often takes part in the **rack table** — which server is in which U, which MAC, which switch port.

## Checklist

- Why two PDUs?
- TOR — what is it?
- Hot/cold aisle — why?
- Tagged VLAN on the server — why?

Next lesson: [05-os-provisioning.md](05-os-provisioning.md).
