# 14. LVM: PV, VG, LV

## Зачем LVM, если есть разделы

На железе диски дорогие менять «на лету». **LVM** даёт логические тома поверх одного или нескольких дисков (или RAID): расширить `/var` без переустановки, объединить диски в пул, позже — snapshots (advanced).

В облаке часто отдают уже готовый volume, но LVM всё ещё встречается на legacy и on-prem. В нашем стенде — **loop-файл** вместо SATA, идея та же.

```text
диск / RAID / loop-файл
        ↓
   PV (Physical Volume)     ← pvcreate
        ↓
   VG (Volume Group)        ← пул места
        ↓
   LV (Logical Volume)      ← «раздел», который вы форматируете
        ↓
   mkfs.ext4 && mount
```

## Аналогия

| LVM | Образ |
|-----|--------|
| PV | кирпичи |
| VG | стена |
| LV | комната, вырезанная в стене |

## Посмотреть текущее состояние

```bash
sudo pvs
sudo vgs
sudo lvs
sudo pvdisplay
sudo lvdisplay /dev/vg_name/lv_name
```

## Создание (типовой сценарий)

```bash
sudo pvcreate /dev/sdb
sudo vgcreate vg_data /dev/sdb
sudo lvcreate -L 10G -n lv_app vg_data
sudo mkfs.ext4 /dev/vg_data/lv_app
sudo mkdir -p /mnt/app
sudo mount /dev/vg_data/lv_app /mnt/app
```

В fstab — UUID с `blkid`.

## Расширение

```bash
sudo lvextend -L +5G /dev/vg_data/lv_app
sudo resize2fs /dev/vg_data/lv_app    # ext4
# для xfs: xfs_growfs /mount/point
```

Забыли `resize2fs` — в `df` место не прибавится, хотя LV уже больше.

## Docker-лаба

В [14-lab-lvm](14-lab-lvm.md) — файл-образ на loop. На реальном сервере шаги те же, только `/dev/sdb` настоящий.

## RAID и bare metal

Аппаратный RAID (mdadm) — [`bare-metal/06-storage-raid-lvm`](../bare-metal/06-storage-raid-lvm.md). Частый стек: RAID1 → LVM → ext4.

## Чек-лист

- Порядок: PV → VG → LV → mkfs?
- Чем LV отличается от раздела `/dev/sda1`?
- Зачем после `lvextend` вызывать `resize2fs`?

Следующий урок: [14. Лаба: LVM](14-lab-lvm.md).
