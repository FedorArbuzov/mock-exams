# 13. Лаба: tmpfs и df

## Стенд

`docker compose exec lab bash`, sudo.

---

## Задание 1. df до и после

```bash
df -h /
df -i /
```

---

## Задание 2. tmpfs

```bash
sudo mkdir -p /mnt/ramdisk
sudo mount -t tmpfs -o size=32M tmpfs /mnt/ramdisk
df -h /mnt/ramdisk
echo hello > /mnt/ramdisk/test.txt
cat /mnt/ramdisk/test.txt
```

**Что увидите:** ~32M размер ФС, файл в RAM.

---

## Задание 3. umount

```bash
sudo umount /mnt/ramdisk
ls /mnt/ramdisk
```

После umount каталог пуст (файл пропал — он был в tmpfs).

---

## Задание 4. du vs df

```bash
sudo du -sh /var/log
df -h /var
```

**Что увидите:** du — сумма файлов; df — использование ФС целиком.

---

## Задание 5. fstab (только чтение)

```bash
grep -v '^#' /etc/fstab | grep -v '^$'
```

Не добавляйте tmpfs в fstab в shared lab без необходимости.

---

## Критерии успеха

- [ ] tmpfs смонтирован и записан файл
- [ ] umount выполнен
- [ ] Объяснили себе разницу du и df

Следующий урок: [14. LVM](14-lvm.md).
