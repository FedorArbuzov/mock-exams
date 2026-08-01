# 14. Lab: LVM on a loop file

Repeat the PV → VG → LV chain without a real disk — the same way it's done in test environments.

## Environment

`docker compose exec lab bash`, sudo. You need the `lvm2` package (usually present in the environment image).

---

## Task 1. Loop file

```bash
sudo truncate -s 200M /var/lab-lvm.img
sudo losetup -f /var/lab-lvm.img
LOOP=$(losetup -j /var/lab-lvm.img | awk -F: '{print $1}')
echo "LOOP=$LOOP"
```

---

## Task 2. PV, VG, LV

```bash
sudo pvcreate "$LOOP"
sudo vgcreate vg_lab "$LOOP"
sudo lvcreate -L 80M -n lv_lab vg_lab
sudo lvs
```

---

## Task 3. Filesystem and mount

```bash
sudo mkfs.ext4 /dev/vg_lab/lv_lab
sudo mkdir -p /mnt/lvm-lab
sudo mount /dev/vg_lab/lv_lab /mnt/lvm-lab
df -h /mnt/lvm-lab
echo lvm-ok | sudo tee /mnt/lvm-lab/marker.txt
```

---

## Task 4. Expansion

```bash
sudo lvextend -L +40M /dev/vg_lab/lv_lab
sudo resize2fs /dev/vg_lab/lv_lab
df -h /mnt/lvm-lab
```

**What you'll see:** the filesystem size grew.

---

## Task 5. Cleanup

```bash
sudo umount /mnt/lvm-lab
sudo lvremove -f vg_lab/lv_lab
sudo vgremove vg_lab
sudo pvremove "$LOOP"
sudo losetup -d "$LOOP"
sudo rm -f /var/lab-lvm.img
```

---

## Success criteria

- [ ] `lvs` shows `vg_lab/lv_lab`
- [ ] The `marker.txt` file is on the mounted volume
- [ ] After `lvextend` + `resize2fs`, df shows a larger size

Next lesson: [15. tar and rsync](15-archives-rsync.md).
