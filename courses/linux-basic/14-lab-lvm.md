# 14. Лаба: LVM на loop-файле

Повторите цепочку PV → VG → LV без реального диска — так же делают в тестовых средах.

## Стенд

`docker compose exec lab bash`, sudo. Нужны пакеты `lvm2` (в образе стенда обычно есть).

---

## Задание 1. Loop-файл

```bash
sudo truncate -s 200M /var/lab-lvm.img
sudo losetup -f /var/lab-lvm.img
LOOP=$(losetup -j /var/lab-lvm.img | awk -F: '{print $1}')
echo "LOOP=$LOOP"
```

---

## Задание 2. PV, VG, LV

```bash
sudo pvcreate "$LOOP"
sudo vgcreate vg_lab "$LOOP"
sudo lvcreate -L 80M -n lv_lab vg_lab
sudo lvs
```

---

## Задание 3. ФС и mount

```bash
sudo mkfs.ext4 /dev/vg_lab/lv_lab
sudo mkdir -p /mnt/lvm-lab
sudo mount /dev/vg_lab/lv_lab /mnt/lvm-lab
df -h /mnt/lvm-lab
echo lvm-ok | sudo tee /mnt/lvm-lab/marker.txt
```

---

## Задание 4. Расширение

```bash
sudo lvextend -L +40M /dev/vg_lab/lv_lab
sudo resize2fs /dev/vg_lab/lv_lab
df -h /mnt/lvm-lab
```

**Что увидите:** размер ФС вырос.

---

## Задание 5. Уборка

```bash
sudo umount /mnt/lvm-lab
sudo lvremove -f vg_lab/lv_lab
sudo vgremove vg_lab
sudo pvremove "$LOOP"
sudo losetup -d "$LOOP"
sudo rm -f /var/lab-lvm.img
```

---

## Критерии успеха

- [ ] `lvs` показывает `vg_lab/lv_lab`
- [ ] Файл `marker.txt` на смонтированном томе
- [ ] После `lvextend` + `resize2fs` df показывает больший размер

Следующий урок: [15. tar и rsync](15-archives-rsync.md).
