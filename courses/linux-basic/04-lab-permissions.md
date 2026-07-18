# 04. Лаба: права и владельцы

Практика «как починить сломанный каталог»: создаёте файлы под разными пользователями, меняете права, проверяете доступ через `sudo -u`.

## Стенд

`docker compose exec lab bash`, нужен `sudo`.

---

## Задание 1. Базовый chmod

```bash
cd /tmp
rm -f perm-demo.txt
echo secret > perm-demo.txt
ls -l perm-demo.txt
chmod 600 perm-demo.txt
ls -l perm-demo.txt
```

**Что увидите:** `-rw-------` — читать может только владелец.

Проверка от другого пользователя (если есть `nobody` или `www-data`):

```bash
sudo -u www-data cat /tmp/perm-demo.txt
```

Ожидается **Permission denied**.

---

## Задание 2. Каталог и бит x

```bash
mkdir -p /tmp/permdir/sub
chmod 644 /tmp/permdir      # убрать x у всех
ls -ld /tmp/permdir
cd /tmp/permdir
```

**Что увидите:** `cd` не сработает — «Permission denied», хотя `ls` на родителе мог показать имя.

Верните вход:

```bash
chmod 755 /tmp/permdir
cd /tmp/permdir && pwd
```

---

## Задание 3. Групповой доступ

```bash
sudo groupadd permgrp
sudo useradd -m -s /bin/bash perma
sudo usermod -aG permgrp perma
sudo mkdir /srv/permshare
sudo chown root:permgrp /srv/permshare
sudo chmod 2770 /srv/permshare
ls -ld /srv/permshare
```

Создайте файл от perma:

```bash
sudo -u perma touch /srv/permshare/from-perma.txt
ls -l /srv/permshare/
```

**Что увидите:** группа файла `permgrp` (setgid на каталоге), права зависят от umask perma.

Проверьте, что пользователь **не** в `permgrp` не пишет:

```bash
sudo -u www-data touch /srv/permshare/hack.txt
```

---

## Задание 4. Sticky bit (как /tmp)

```bash
mkdir /tmp/sticky-demo
chmod 1777 /tmp/sticky-demo
ls -ld /tmp/sticky-demo
```

От user A создайте файл, от user B попробуйте удалить:

```bash
sudo -u perma touch /tmp/sticky-demo/a-file
sudo -u www-data rm /tmp/sticky-demo/a-file
```

**Что увидите:** удаление чужого файла запрещено при sticky.

---

## Задание 5. chown

```bash
sudo chown perma:permgrp /srv/permshare/from-perma.txt
ls -l /srv/permshare/from-perma.txt
```

---

## Уборка

```bash
sudo rm -rf /srv/permshare /tmp/sticky-demo /tmp/permdir
sudo userdel -r perma 2>/dev/null
sudo groupdel permgrp 2>/dev/null
```

---

## Критерии успеха

- [ ] Файл `600` недоступен для `www-data`
- [ ] Показали, что без `x` на каталоге нельзя `cd`
- [ ] В `/srv/permshare` setgid и групповая запись работают
- [ ] Sticky не даёт удалить чужой файл

Следующий урок: [05. find и locate](05-files-find.md).
