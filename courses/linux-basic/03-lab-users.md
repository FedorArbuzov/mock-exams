# 03. Лаба: пользователи и группы

Вы создадите учебного пользователя так, как это делают при подготовке сервера под деплой: отдельный аккаунт, home, группа, проверка через `id`. Пароли в этой лабе простые — **только в Docker-стенде**.

## Стенд

```bash
cd deploy/linux
docker compose exec lab bash
```

Работайте от пользователя, у которого есть `sudo` (часто **course**), либо от root в контейнере.

---

## Задание 1. Изучить свою учётную запись

```bash
whoami
id
grep "^$(whoami):" /etc/passwd
groups
```

**Что увидите:** числовой UID, основную GID и список групп (в т.ч. `sudo`, если есть).

Запишите свой UID — пригодится, если будете искать файлы через `find -user`.

---

## Задание 2. Создать пользователя labuser

```bash
sudo useradd -m -s /bin/bash labuser
sudo passwd labuser
# введите: labpass (или свой учебный пароль)
```

Проверка:

```bash
getent passwd labuser
sudo ls -la /home/labuser
```

**Что увидите:** строку в passwd и каталог home с skeleton-файлами (`.bashrc` и т.д.).

---

## Задание 3. Группа и членство

```bash
sudo groupadd labteam
sudo usermod -aG labteam labuser
groups labuser
grep labteam /etc/group
```

**Что увидите:** `labuser` в выводе `groups`; в `/etc/group` — `labteam:x:GID:labuser` (или список через запятую).

Проверьте, что **вы** не потеряли свои группы после `usermod` (если экспериментировали на себе — используйте только `-aG`).

---

## Задание 4. sudo для labuser (учебно)

```bash
echo 'labuser ALL=(ALL) NOPASSWD: /usr/bin/id, /usr/bin/whoami' | sudo tee /etc/sudoers.d/labuser-lab
sudo chmod 440 /etc/sudoers.d/labuser-lab
sudo visudo -c
```

Переключитесь и проверьте:

```bash
sudo -u labuser sudo -n whoami
sudo -u labuser sudo -n id
```

**Что увидите:** `root` и полный `id` **без пароля** только для разрешённых команд.

Попробуйте запрещённое (должно спросить пароль или отказать):

```bash
sudo -u labuser sudo -n apt update
```

**Зачем так в проде:** deploy может перезапускать сервис, но не ставить пакеты.

---

## Задание 5. umask

```bash
umask
sudo -u labuser bash -c 'umask; touch /home/labuser/from-labuser; ls -l /home/labuser/from-labuser'
```

**Что увидите:** типично `0022` и файл `644` у labuser.

---

## Задание 6. Уборка (опционально)

Если пользователь больше не нужен:

```bash
sudo userdel -r labuser
sudo groupdel labteam
sudo rm -f /etc/sudoers.d/labuser-lab
```

На srv1 в финальном проекте пользователя **deploy** как раз **не** удаляйте.

---

## Критерии успеха

- [ ] Пользователь `labuser` существует, есть `/home/labuser`
- [ ] `labuser` в группе `labteam`
- [ ] `sudo -u labuser sudo -n whoami` выводит `root`
- [ ] Созданный файл имеет ожидаемые права (644 при umask 022)

## Если что-то пошло не так

| Симптом | Решение |
|---------|---------|
| `useradd: user exists` | `sudo userdel -r labuser` и повторить |
| `visudo -c` ругается на syntax | исправьте файл в `/etc/sudoers.d/`, не оставляйте битый sudoers |
| Нет sudo у себя | работайте как root в контейнере lab |

Следующий урок: [04. Права rwx](04-permissions.md).
