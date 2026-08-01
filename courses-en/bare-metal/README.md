# Bare Metal for DevOps

A text course about **physical servers** in the data center and on-prem: hardware, BMC, networking, OS installation, operations. No mandatory labs — theory and checklists only.

**Who it's for:** DevOps / SRE / platform engineers who have only worked with cloud or Kubernetes and want to understand what's "underneath" them.

**Prerequisites:** [`linux-basic`](../linux-basic/README.md) (Linux practice) and [`kuber-basic`](../kuber-basic/README.md) (containers). Cloud — [`aws-basic`](../aws-basic/README.md).

## Curriculum (theory)

1. [Bare metal, VMs, and cloud](01-intro-bare-metal.md)
2. [Server hardware](02-server-hardware.md)
3. [BMC, IPMI, iDRAC, iLO](03-bmc-out-of-band.md)
4. [Rack, power, physical network](04-rack-power-network.md)
5. [OS installation: PXE, Kickstart, cloud-init](05-os-provisioning.md)
6. [Disks: RAID, LVM, file systems](06-storage-raid-lvm.md)
7. [Host networking: bonding, VLAN, MTU](07-host-networking.md)
8. [Operations: patches, firmware, lifecycle](08-operations-lifecycle.md)
9. [Kubernetes and bare metal](09-kubernetes-on-bare-metal.md)
10. [When to choose bare metal](10-when-bare-metal.md)

## What you should end up with

- You can tell bare metal apart from VMs and from managed cloud.
- You understand why BMC exists and why you must never "lose" the IPMI network.
- You know what PXE/Kickstart are and how they relate to cloud-init in AWS.
- You can discuss RAID, bonding, and VLAN with data center admins without gaps in terminology.

## Related courses

| Bare metal topic | Course in the repository |
|---|---|
| Kubernetes on nodes | `kuber-*`, Talos/Metal3 — lesson 09 |
| Networking like in a VPC | `aws-basic` / `aws-intermediate` |
| CI for installation images | `gitlab-*` |
| Linux practice on the host | `linux-basic` → `linux-intermediate` |
| IaC for servers | `aws-terraform` (analogy), outside the course — Ansible/Terraform MAAS |

## Next (on your own)

- [Linux Foundation](https://training.linuxfoundation.org/) — systems administration.
- Practice: homelab (a single server), MAAS, Talos, Metal3.
- Certifications: there's no single "bare metal CKA", but LPIC and RHCSA overlap.
