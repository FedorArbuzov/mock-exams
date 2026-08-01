# 13. mount, fstab, df, du

## A disk in Linux is not just "a file on C:"

There's a **block device** (disk, partition, LVM volume), on it a **filesystem** (ext4, xfs), which is **mounted** at a point in the tree (`/`, `/var`, `/mnt/data`). Until it's mounted, you don't see the files via a normal path.

## See what's there

```bash
lsblk -f
blkid
mount | column -t
df -h
df -i
```

| Command | Answers the question |
|---------|-----------------|
| `lsblk` | which disks and partitions |
| `blkid` | UUID and filesystem type |
| `df -h` | how much is used on the **mounted** ones |
| `df -i` | are there enough **inodes** |
| `du -sh /var/log` | how much a directory weighs |

`df` looks at the filesystem; `du` **sums** files from the bottom up — slower on large trees.

## mount and umount

```bash
sudo mkdir -p /mnt/data
sudo mount /dev/vg0/lv_app /mnt/data
df -h /mnt/data
sudo umount /mnt/data
```

A temporary **tmpfs** (RAM):

```bash
sudo mkdir -p /mnt/ram
sudo mount -t tmpfs -o size=64M tmpfs /mnt/ram
df -h /mnt/ram
sudo umount /mnt/ram
```

Don't unmount a busy mount — first find who's holding it (`lsof +D /mnt/data`).

## /etc/fstab — mounting at boot

```text
# <device>  <mount>  <type>  <options>  <dump>  <pass>
UUID=xxxx   /        ext4    defaults   0       1
```

UUID is preferable to `/dev/sda1` — disk names can change.

After editing, **be sure** to:

```bash
sudo mount -a
```

An error in fstab at boot will send the server into emergency mode. Keep the provider's console handy.

The last column, **pass**: `0` — no fsck; `1` — root; `2` — the rest.

## inode — "there's space, but you can't write"

```bash
df -i /
```

Millions of 0-byte cache files eat inodes faster than gigabytes do.

## Relation to LVM

An LVM volume is also a device `/dev/vg/lv` → mkfs → mount. Next lesson: [14. LVM](14-lvm.md).

## Checklist

- How does `df` differ from `du`?
- Why UUID in fstab?
- What does `mount -a` do?

Next lesson: [13. Lab: tmpfs](13-lab-mount.md).
