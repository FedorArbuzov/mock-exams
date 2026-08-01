# 08. Operations: patches, firmware, lifecycle

## Server lifecycle

```text
Order → rack & cable → provision OS → join cluster → production
    → patch cycle → hardware failure / EOL → decommission
```

## OS patches

| Type | Example | Risk |
|---|---|---|
| Security errata | CVE kernel | reboot |
| Minor update | glibc | low |
| Major | 8 → 9 | high, plan ahead |

**Unattended-upgrades** on servers — be careful; in K8s — **drain node** → patch → uncordon.

```bash
kubectl drain node1 --ignore-daemonsets --delete-emptydir-data
# patch & reboot on node1
kubectl uncordon node1
```

## Firmware

- BIOS/UEFI, RAID controller, NIC, BMC — separate from `yum update`.
- Maintenance window, risk of "bricking" — recover via the BMC.
- Dell Lifecycle Controller, HPE SPP — bundle updates.

## Hardware monitoring

| Source | Metrics |
|---|---|
| **node_exporter** | CPU, mem, disk |
| **ipmi_exporter** | temps, power, SEL |
| **smartctl exporter** | disk health |

Alerts: RAID degraded, rising ECC errors, fan failure.

## Decommission

1. Drain workloads.
2. Remove from inventory / Terraform / MAAS.
3. Wipe disks (**NIST wipe** / shred).
4. Deregister, return/leasing.

## Documentation

A runbook like in [`aws-advanced`](../aws-advanced/22-lab-guardduty-config.md) — but for "the disk is red in RAID".

## Checklist

- Why patch a node via drain?
- Firmware vs OS package?
- What is SEL?
- Wipe before disposal — why?

Next lesson: [09-kubernetes-on-bare-metal.md](09-kubernetes-on-bare-metal.md).
