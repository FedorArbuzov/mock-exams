# 13. Lab: tmpfs and df

## Environment

`docker compose exec lab bash`, sudo.

---

## Task 1. df before and after

```bash
df -h /
df -i /
```

---

## Task 2. tmpfs

```bash
sudo mkdir -p /mnt/ramdisk
sudo mount -t tmpfs -o size=32M tmpfs /mnt/ramdisk
df -h /mnt/ramdisk
echo hello > /mnt/ramdisk/test.txt
cat /mnt/ramdisk/test.txt
```

**What you'll see:** ~32M filesystem size, a file in RAM.

---

## Task 3. umount

```bash
sudo umount /mnt/ramdisk
ls /mnt/ramdisk
```

After umount the directory is empty (the file is gone — it was in tmpfs).

---

## Task 4. du vs df

```bash
sudo du -sh /var/log
df -h /var
```

**What you'll see:** du — the sum of files; df — usage of the whole filesystem.

---

## Task 5. fstab (read only)

```bash
grep -v '^#' /etc/fstab | grep -v '^$'
```

Don't add tmpfs to fstab in a shared lab without a need.

---

## Success criteria

- [ ] tmpfs mounted and a file written
- [ ] umount performed
- [ ] You've explained to yourself the difference between du and df

Next lesson: [14. LVM](14-lvm.md).
