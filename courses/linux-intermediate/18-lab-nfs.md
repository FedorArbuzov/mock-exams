# 18. Лаба: NFS srv1 → lab

## Цель лабы

На практике пройти полный цикл **NFS**: экспорт каталога на **srv1**, монтирование на **lab**, чтение/запись с обеих сторон, разбор типичных ошибок и корректный **umount**. После лабы вы не будете путать NFS с Samba и поймёте, почему «mount завис» — это чаще сеть или firewall, а не «сломался диск».

## Предварительно

- [17. NFS](17-nfs.md) прочитан.
- Стенд Up: srv1 `172.28.0.11`, lab `172.28.0.10`.
- На **srv1**: `nfs-kernel-server`, на **lab**: `nfs-common`.

```bash
# с хоста
cd deploy/linux && docker compose up -d
ping -c1 172.28.0.11   # с lab
```

---

## Подготовка: установка пакетов

**На srv1:**

```bash
ssh course@172.28.0.11
sudo apt update
sudo apt install -y nfs-kernel-server
systemctl is-active nfs-server || systemctl is-active nfs-kernel-server
```

**На lab:**

```bash
docker compose exec lab bash
sudo apt update
sudo apt install -y nfs-common showmount
```

---

## Задание 1. Каталог и маркер на сервере

**Зачем:** убедиться, что данные на диске srv1 до mount.

```bash
# на srv1
sudo mkdir -p /srv/nfs-share
echo "nfs marker $(date -Is)" | sudo tee /srv/nfs-share/marker.txt
ls -la /srv/nfs-share/
```

**Что увидите:** файл `marker.txt` с timestamp.

---

## Задание 2. Экспорт в /etc/exports

**Зачем:** без записи в exports клиент получит *access denied*.

```bash
# на srv1
echo '/srv/nfs-share 172.28.0.0/24(rw,sync,no_subtree_check,no_root_squash)' | sudo tee /etc/exports
sudo exportfs -ra
sudo exportfs -v
```

**Что увидите:**

```text
/srv/nfs-share   172.28.0.0/24(sync,wdelay,hide,no_subtree_check,sec=sys,rw,...)
```

| Если ошибка | Причина |
|-------------|---------|
| `exportfs: invalid option` | опечатка в скобках |
| пустой `exportfs -v` | не сделали `-ra` после правки |

**Важно:** `no_root_squash` — только для lab. В проде — `root_squash`.

---

## Задание 3. Проверка экспорта с клиента (до mount)

**На lab:**

```bash
showmount -e 172.28.0.11
```

**Что увидите:** список экспортов, включая `/srv/nfs-share`.

**Если RPC: Program not registered / timeout:**

```bash
ping -c2 172.28.0.11
# NFSv4: один порт 2049; для v3 нужен rpcbind
```

На учебном стенде обычно достаточно NFSv4.

---

## Задание 4. Монтирование

**На lab:**

```bash
sudo mkdir -p /mnt/nfs-share
sudo mount -t nfs 172.28.0.11:/srv/nfs-share /mnt/nfs-share
df -h /mnt/nfs-share
mount | grep nfs
```

**Что увидите:** строка в `df` с `172.28.0.11:/srv/nfs-share`.

**Если mount.nfs: access denied:** CIDR в exports не включает IP lab (должен быть 172.28.0.10 в 172.28.0.0/24).

**Если Connection timed out:** firewall (позже ufw) режет 2049; сначала ping.

---

## Задание 5. Чтение и запись с lab

```bash
cat /mnt/nfs-share/marker.txt
echo "written from lab at $(date -Is)" | sudo tee /mnt/nfs-share/from-lab.txt
ls -l /mnt/nfs-share/
```

**Что увидите:** marker с srv1 и новый файл from-lab.

---

## Задание 6. Проверка на srv1

```bash
ssh course@172.28.0.11 'cat /srv/nfs-share/from-lab.txt'
ssh course@172.28.0.11 'ls -l /srv/nfs-share/'
```

**Зачем:** NFS — общая ФС; файл на сервере = тот же inode tree, что видел клиент.

---

## Задание 7. Права и uid (опционально)

**Зачем:** в проде частая боль — «на NFS Permission denied» при uid mismatch.

```bash
ls -ln /mnt/nfs-share/   # числовые uid/gid
id
```

Если пишете от root на lab с `root_squash` — запись отклонится (в нашей lab `no_root_squash` — root пишет).

---

## Задание 8. umount

**На lab:**

```bash
sudo umount /mnt/nfs-share
df -h /mnt/nfs-share
```

**Если target is busy:**

```bash
sudo lsof +D /mnt/nfs-share
cd /
sudo umount /mnt/nfs-share
```

---

## Уборка (srv1, опционально)

```bash
ssh course@172.28.0.11
sudo sed -i '/\/srv\/nfs-share/d' /etc/exports
sudo exportfs -ra
```

Каталог `/srv/nfs-share` можно оставить.

---

## Критерии успеха

- [ ] `exportfs -v` на srv1 показывает экспорт для 172.28.0.0/24
- [ ] `showmount -e` с lab видит экспорт
- [ ] mount на lab без ошибок
- [ ] marker читается, from-lab виден на srv1
- [ ] umount выполнен

## Что унести в работу

- Сначала **exports + exportfs**, потом mount.
- **showmount** и **ping** — до разборов «NFS сломан».
- **2049/tcp**, в prod — отдельная storage-сеть или VPN.
- **root_squash** в prod; **no_root_squash** — только lab.

Следующий урок: [19. Postfix](19-postfix.md).
