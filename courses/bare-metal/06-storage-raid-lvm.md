# 06. Диски: RAID, LVM, файловые системы

## Разделы на сервере

Типичная схема Linux:

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
# концепт — не лаба
mdadm --create /dev/md0 --level=1 --raid-devices=2 /dev/sda /dev/sdb
```

| Level | Устойчивость | Ёмкость |
|---|---|---|
| RAID1 | 1 диск | 50% |
| RAID10 | 1 диск в паре | 50% |
| RAID5 | 1 диск | (n-1)/n |

**Monitor** — `mdadm --detail --scan`, алерт при degraded.

## LVM

Гибкое изменение размеров:

- **PV** (physical volume) — раздел или md device.
- **VG** (volume group) — пул.
- **LV** (logical volume) — том для `/`, `/var`, отдельно под Docker.

Удобно для **роста** `/var` без переустановки.

## Файловые системы

| FS | Когда |
|---|---|
| **ext4** | `/`, general |
| **XFS** | большие тома, RHEL default |
| **btrfs/zfs** | snapshots (реже на root) |

Для **Kubernetes local volumes** — отдельный LV или весь NVMe под `/var/lib/kubelet`.

## SMART и деградация

`smartctl` — предсказание отказа диска. В enterprise — алерты BMC + monitoring.

## vs облако

EBS / network storage — вы не видите RAID. На bare metal **вы** проектируете отказоустойчивость дисков.

## vs Kubernetes

PV на bare metal часто **local SSD** (high perf). StatefulSet + local PV — знать про привязку к конкретной ноде.

Практика LVM в Docker-лабе: [`linux-basic/14-lvm`](../linux-basic/14-lvm.md).

## Чек-лист

- RAID1 vs RAID10?
- LVM: PV, VG, LV?
- Зачем отдельный `/var`?
- Degraded RAID — что делать?

Следующий урок: [07-host-networking.md](07-host-networking.md).
