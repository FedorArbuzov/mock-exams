# 06. Disks: RAID, LVM, file systems

## Partitions on a server

A typical Linux layout:

```text
/dev/nvme0n1
├── nvme0n1p1  /boot/efi   (EFI System Partition)
├── nvme0n1p2  /boot       (ext4)
└── nvme0n1p3  LVM PV
         └── VG system
              ├── lv_root  /
              └── lv_var   /var
```

## Software RAID (mdadm)

```bash
# concept — not a lab
mdadm --create /dev/md0 --level=1 --raid-devices=2 /dev/sda /dev/sdb
```

| Level | Resilience | Capacity |
|---|---|---|
| RAID1 | 1 disk | 50% |
| RAID10 | 1 disk per pair | 50% |
| RAID5 | 1 disk | (n-1)/n |

**Monitor** — `mdadm --detail --scan`, alert when degraded.

## LVM

Flexible resizing:

- **PV** (physical volume) — a partition or md device.
- **VG** (volume group) — a pool.
- **LV** (logical volume) — a volume for `/`, `/var`, or a separate one for Docker.

Handy for **growing** `/var` without a reinstall.

## File systems

| FS | When |
|---|---|
| **ext4** | `/`, general |
| **XFS** | large volumes, RHEL default |
| **btrfs/zfs** | snapshots (rarely on root) |

For **Kubernetes local volumes** — a separate LV or the whole NVMe under `/var/lib/kubelet`.

## SMART and degradation

`smartctl` — predicts disk failure. In enterprise — BMC alerts + monitoring.

## vs cloud

EBS / network storage — you don't see the RAID. On bare metal, **you** design disk fault tolerance.

## vs Kubernetes

A PV on bare metal is often a **local SSD** (high perf). StatefulSet + local PV — know about the binding to a specific node.

LVM practice in a Docker lab: [`linux-basic/14-lvm`](../linux-basic/14-lvm.md).

## Checklist

- RAID1 vs RAID10?
- LVM: PV, VG, LV?
- Why a separate `/var`?
- Degraded RAID — what to do?

Next lesson: [07-host-networking.md](07-host-networking.md).
