# 10. When to choose bare metal

## Decision matrix

| Requirement | Cloud VM | Bare metal |
|---|---|---|
| Fast autoscale | ✅ | ❌ |
| Peak GPU/CPU with no neighbors | expensive | ✅ |
| Data on-prem only | hybrid | ✅ |
| Managed DB/queue | ✅ | self-manage |
| CapEx vs OpEx | OpEx | CapEx/leasing |
| 24/7 hardware team | not needed | needed, or a vendor |

## Hybrid (typical in enterprise)

```text
On-prem bare metal: Kubernetes, Oracle, legacy
        │
        VPN / Direct Connect
        │
AWS/Azure: burst, ML training, DR, S3
```

## Anti-patterns

- "Let's spin up our own data center on 3 servers in the office" without cooling, UPS, or a backup link.
- Bare metal for **stateless** microservices for no reason — harder than the cloud.
- Ignoring BMC security.

## The DevOps role vs the traditional sysadmin

| Sysadmin | DevOps on metal |
|---|---|
| RAID, firmware, switch ports | the same + IaC, K8s, CI |
| Manual tickets | GitOps, Ansible, MAAS |
| Silo | platform team |

The course doesn't replace RHCSA, but it closes the **gap** between cloud-native and hardware.

## Final course checklist

- [ ] I can explain bare metal vs VM vs cloud
- [ ] I know why BMC and a separate management network exist
- [ ] I understand PXE/Kickstart/cloud-init
- [ ] I can read a RAID+LVM layout
- [ ] I know bonding/VLAN on the host
- [ ] I understand drain when patching a K8s node
- [ ] I know why MetalLB and local storage exist

## Next

- Practice: [MAAS](https://maas.io/), homelab, Talos.
- Repository courses: [`kuber-advanced`](../kuber-advanced/README.md), [`aws-advanced`](../aws-advanced/README.md).
- PDF of all courses: `dist/courses.pdf` (if built with the `scripts/build-courses-pdf.py` script).

---

**The bare-metal course is complete** (theory).
