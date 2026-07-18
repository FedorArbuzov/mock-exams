# 13. mount, fstab, df, du

## Диск в Linux — не только «файл на C:»

Есть **блочное устройство** (диск, раздел, LVM-том), на нём **файловая система** (ext4, xfs), она **смонтирована** в точку дерева (`/`, `/var`, `/mnt/data`). Пока не смонтировано — вы не видите файлов через обычный путь.

## Посмотреть, что есть

```bash
lsblk -f
blkid
mount | column -t
df -h
df -i
```

| Команда | Ответ на вопрос |
|---------|-----------------|
| `lsblk` | какие диски и разделы |
| `blkid` | UUID и тип ФС |
| `df -h` | сколько занято на **смонтированных** |
| `df -i` | хватает ли **inode** |
| `du -sh /var/log` | сколько весит каталог |

`df` смотрит на файловую систему; `du` **суммирует** файлы снизу вверх — на больших деревьях медленнее.

## mount и umount

```bash
sudo mkdir -p /mnt/data
sudo mount /dev/vg0/lv_app /mnt/data
df -h /mnt/data
sudo umount /mnt/data
```

Временный **tmpfs** (RAM):

```bash
sudo mkdir -p /mnt/ram
sudo mount -t tmpfs -o size=64M tmpfs /mnt/ram
df -h /mnt/ram
sudo umount /mnt/ram
```

Не размонтируйте busy mount — сначала найдите, кто держит (`lsof +D /mnt/data`).

## /etc/fstab — монтирование при загрузке

```text
# <device>  <mount>  <type>  <options>  <dump>  <pass>
UUID=xxxx   /        ext4    defaults   0       1
```

UUID предпочтительнее `/dev/sda1` — имена дисков могут поменяться.

После правки **обязательно**:

```bash
sudo mount -a
```

Ошибка в fstab на boot — сервер уйдёт в emergency mode. Держите консоль провайдера под рукой.

Последний столбец **pass**: `0` — не fsck; `1` — корень; `2` — остальные.

## inode — «место есть, записать нельзя»

```bash
df -i /
```

Миллионы кэш-файлов по 0 байт съедают inode быстрее, чем гигабайты.

## Связь с LVM

Том LVM — это тоже устройство `/dev/vg/lv` → mkfs → mount. Следующий урок: [14. LVM](14-lvm.md).

## Чек-лист

- Чем `df` отличается от `du`?
- Зачем UUID в fstab?
- Что делает `mount -a`?

Следующий урок: [13. Лаба: tmpfs](13-lab-mount.md).
