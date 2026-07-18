# 28. Лаба: ACL на shared-каталоге

## Цель лабы

Собрать типичный **shared directory** для команды: группа владельца, **setgid** на каталоге (новые файлы наследуют группу), **ACL** для конкретного пользователя без chmod 777. Проверить запись и отказ чужому пользователю.

Связано с [теорией ACL и AppArmor](27-acl-apparmor.md).

## Предварительно

- lab, sudo.
- Пакет acl.

```bash
docker compose exec lab bash
sudo apt install -y acl
```

---

## Подготовка: зачем setgid + ACL

| Механизм | Задача |
|----------|--------|
| `chown root:acldev` + `chmod 2770` | только группа acldev в каталоге; setgid → новые файлы с группой acldev |
| `setfacl -m u:acluser:rwx` | доступ пользователю **вне** основной группы |
| `setfacl -d -m ...` | default ACL на **новые** файлы в каталоге |

---

## Задание 1. Пользователи и каталог

```bash
sudo groupadd acldev 2>/dev/null || true
sudo useradd -m -s /bin/bash acluser 2>/dev/null || true
sudo usermod -aG acldev acluser
sudo mkdir -p /srv/aclshare
sudo chown root:acldev /srv/aclshare
sudo chmod 2770 /srv/aclshare
ls -ld /srv/aclshare
```

**Что увидите:** `drwxrws---` — буква **`s`** в группе = setgid.

**Без setgid:** файл от acluser может получить группу `acluser`, и коллеги из acldev его не увидят.

---

## Задание 2. ACL на каталог

```bash
sudo setfacl -m u:acluser:rwx /srv/aclshare
sudo setfacl -d -m u:acluser:rwx /srv/aclshare
getfacl /srv/aclshare
```

**Как читать getfacl (фрагмент):**

```text
# group: acldev
user::rwx
group::rwx
other::---
user:acluser:rwx
default:user:acluser:rwx
```

Строка **`mask::`** ограничивает эффективные права ACL — если что-то «не работает», смотрите mask.

---

## Задание 3. Запись от acluser

```bash
sudo -u acluser touch /srv/aclshare/from-acluser.txt
sudo -u acluser bash -c 'echo hello > /srv/aclshare/from-acluser.txt'
ls -l /srv/aclshare/
getfacl /srv/aclshare/from-acluser.txt
```

**Что увидите:** файл создан; группа файла часто **acldev** (благодаря setgid на каталоге).

---

## Задание 4. Участник группы acldev (опционально)

```bash
sudo useradd -m -G acldev dev2 2>/dev/null || true
sudo -u dev2 touch /srv/aclshare/from-dev2.txt
ls -l /srv/aclshare/
```

Должно работать через **group::rwx** без персонального ACL.

---

## Задание 5. Отказ чужому

```bash
sudo -u www-data touch /srv/aclshare/hack.txt 2>&1
echo exit_code=$?
```

**Ожидается:** `Permission denied`, ненулевой exit.

**Если получилось создать файл:** проверьте, не в группе ли www-data acldev (`groups www-data`).

---

## Задание 6. Удаление ACL (проверка)

```bash
sudo setfacl -x u:acluser /srv/aclshare
sudo -u acluser touch /srv/aclshare/should-fail.txt 2>&1
```

**Ожидается:** отказ (если acluser не в группе acldev).

Верните ACL для критериев:

```bash
sudo setfacl -m u:acluser:rwx /srv/aclshare
```

---

## Задание 7. AppArmor (обзор)

```bash
sudo aa-status 2>/dev/null | head -15
```

**Зачем:** помнить, что **права Unix** и **MAC (AppArmor)** — разные слои. ACL разрешает, профиль nginx может запретить путь.

---

## Уборка

```bash
sudo setfacl -b /srv/aclshare
sudo rm -rf /srv/aclshare
sudo userdel -r acluser 2>/dev/null
sudo userdel -r dev2 2>/dev/null
sudo groupdel acldev 2>/dev/null
```

---

## Критерии успеха

- [ ] `ls -ld` показывает setgid на каталоге
- [ ] acluser создаёт файлы в `/srv/aclshare`
- [ ] www-data получает Permission denied
- [ ] `getfacl` показывает `user:acluser:rwx`

## Что унести в работу

- Shared dir: **setgid + группа**, не `chmod 777`.
- Для «гостевого» пользователя — ACL, не смена primary group всем.
- После `setfacl` смотрите **mask** и **default ACL**.

Следующий урок: [29. Performance](29-performance.md).
