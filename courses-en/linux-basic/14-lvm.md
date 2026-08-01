# 14. LVM: PV, VG, LV

## Why LVM if there are partitions

On hardware, disks are expensive to swap "on the fly". **LVM** provides logical volumes on top of one or more disks (or a RAID): expand `/var` without a reinstall, pool disks together, and later — snapshots (advanced).

In the cloud you're often handed a ready volume, but LVM still shows up on legacy and on-prem systems. In our environment it's a **loop file** instead of SATA, but the idea is the same.

```text
disk / RAID / loop file
        ↓
   PV (Physical Volume)     ← pvcreate
        ↓
   VG (Volume Group)        ← space pool
        ↓
   LV (Logical Volume)      ← the "partition" you format
        ↓
   mkfs.ext4 && mount
```

## Analogy

| LVM | Image |
|-----|--------|
| PV | bricks |
| VG | a wall |
| LV | a room carved out of the wall |

## See the current state

```bash
sudo pvs
sudo vgs
sudo lvs
sudo pvdisplay
sudo lvdisplay /dev/vg_name/lv_name
```

## Creation (typical scenario)

```bash
sudo pvcreate /dev/sdb
sudo vgcreate vg_data /dev/sdb
sudo lvcreate -L 10G -n lv_app vg_data
sudo mkfs.ext4 /dev/vg_data/lv_app
sudo mkdir -p /mnt/app
sudo mount /dev/vg_data/lv_app /mnt/app
```

In fstab — the UUID from `blkid`.

## Expansion

```bash
sudo lvextend -L +5G /dev/vg_data/lv_app
sudo resize2fs /dev/vg_data/lv_app    # ext4
# for xfs: xfs_growfs /mount/point
```

Forgot `resize2fs` — `df` won't show more space, even though the LV is already bigger.

## Docker lab

In [14-lab-lvm](14-lab-lvm.md) — a file image on loop. On a real server the steps are the same, only `/dev/sdb` is real.

## RAID and bare metal

Hardware RAID (mdadm) — [`bare-metal/06-storage-raid-lvm`](../bare-metal/06-storage-raid-lvm.md). A common stack: RAID1 → LVM → ext4.

## Checklist

- The order: PV → VG → LV → mkfs?
- How does an LV differ from a `/dev/sda1` partition?
- Why call `resize2fs` after `lvextend`?

Next lesson: [14. Lab: LVM](14-lab-lvm.md).
