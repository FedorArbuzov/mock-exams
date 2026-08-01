# 03. BMC, IPMI, and out-of-band management

## The problem

The server "hung", SSH is unresponsive, there's a kernel panic on the screen, and the data center is far away. You need a channel **outside** the running OS.

## BMC (Baseboard Management Controller)

A separate microcontroller on the motherboard:

- Power on/off/reboot (**power cycle**).
- **KVM over IP** console (like a monitor + keyboard in the browser).
- Virtual media — "insert" an ISO over the network to install the OS.
- Temperatures, fans, power.
- Hardware event log (SEL).

## Brand names

| Vendor | Name |
|---|---|
| Dell | iDRAC |
| HPE | iLO |
| Supermicro | IPMI |
| Lenovo | XCC |

They all speak **IPMI** (Intelligent Platform Management Interface) or Redfish (a modern REST API on top of the BMC).

## Out-of-band network

```text
Production LAN (10G)     Management LAN (1G, separate VLAN)
      │                            │
   eth0, eth1                  BMC port
      │                            │
   Kubernetes                  Admins only
   applications                VPN / jump host
```

**Rules:**

- Never expose the BMC to the public internet.
- Separate subnet, firewall, strong passwords / certificates.
- Change the factory default password before racking.

## Typical DevOps tasks

| Task | Via BMC |
|---|---|
| OS installation from ISO | virtual media |
| Recovery after a disk failure | power off, replace disk, power on |
| BIOS setting (boot order) | KVM |
| Diagnosing "disk not detected" | SEL logs |

## IPMI tooling (know it, no need to use it daily)

```bash
ipmitool -H bmc.example -U admin chassis power reset
ipmitool sel list   # hardware event log
```

In the cloud, EC2 has **no** BMC of yours — only the instance stop/start API (similar to power, but not complete).

## Checklist

- BMC vs OS — what's the difference?
- Why a separate management network?
- KVM over IP — why?
- Why can't the BMC be on the internet?

Next lesson: [04-rack-power-network.md](04-rack-power-network.md).
