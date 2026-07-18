# 03. Пользователи, группы, umask

## Зачем это в проде

Каждый процесс на Linux работает от имени **пользователя** (UID). От этого зависят: какие файлы можно читать, можно ли слушать порт <1024, куда пишут логи. В Kubernetes та же идея — `runAsUser` в securityContext. На «голом» сервере вы создаёте `deploy`, `nginx`, отдельного пользователя для приложения — и **не** запускаете всё от root.

## Три файла учётных записей

| Файл | Содержимое | Кто может читать |
|------|------------|------------------|
| `/etc/passwd` | логин, UID, GID, home, shell | все |
| `/etc/group` | группы и список членов | все |
| `/etc/shadow` | хэши паролей, срок действия | только root |

В `/etc/passwd` в поле пароля стоит **`x`** — «смотри shadow». Так исторически: passwd читают все программы, секреты — в shadow.

Разбор одной строки:

```text
course:x:1000:1000:Lab User:/home/course:/bin/bash
│      │  │    │    │          │              └── shell при входе
│      │  │    │    │          └── домашний каталог ($HOME)
│      │  │    │    └── GECOS (часто ФИО или комментарий)
│      │  │    └── GID основной группы
│      │  └── UID (числовой идентификатор)
│      └── пароль в shadow
└── логин
```

## UID и GID — не только имена

- **UID 0** — всегда root, полный обход проверок прав (осторожно с `sudo` и CI).
- **Системные** пользователи — низкие UID (`www-data`, `nobody`, `postgres`) — для демонов без login shell.
- **Обычные** пользователи на Ubuntu часто с UID ≥ 1000.

```bash
id
id course
groups course
getent passwd course
getent group sudo
```

`getent` ходит в NSS (может быть LDAP/SSSD в компании, не только локальный файл).

## Создание и изменение пользователя

```bash
sudo useradd -m -s /bin/bash deploy
sudo passwd deploy
sudo usermod -aG sudo deploy
```

| Ключ | Значение |
|------|----------|
| `-m` | создать `/home/deploy` |
| `-s /bin/bash` | интерактивный shell |
| `-aG sudo` | **добавить** в группу, не заменить все группы |

**Классическая ошибка:** `usermod -G sudo deploy` **без** `-a` — пользователь останется только в `sudo` и выпадет из других групп (например `docker`).

Удаление с home:

```bash
sudo userdel -r deploy
```

## Группы — общий доступ к файлам

```bash
sudo groupadd developers
sudo usermod -aG developers deploy
groups deploy
```

Права на каталог `chmod g+rws` + setgid на каталоге — типичный паттерн «общая папка команды» (подробнее в [04](04-permissions.md)).

## sudo — не «второй root навсегда»

Группа **sudo** (Debian/Ubuntu) или **wheel** (RHEL) разрешает выполнять команды с повышением прав через `sudo`.

```bash
sudo whoami
sudo -u www-data id
sudo -l    # что разрешено этому пользователю
```

В проде настраивают **минимальный** sudoers: только `systemctl restart myapp`, не полный shell. В intermediate — отдельный урок [sudo](../linux-intermediate/23-sudo.md).

**Не делайте** в учебной среде на проде: `NOPASSWD: ALL` для deploy без крайней необходимости.

## umask — права «по умолчанию» при создании

Когда вы `touch file` или `mkdir dir`, ядро применяет **umask** — маску, которая **отключает** биты.

```bash
umask
# часто 0022
touch demo-file
mkdir demo-dir
ls -l demo-file
ls -ld demo-dir
```

| umask | Новый файл | Новый каталог |
|-------|------------|---------------|
| 0022 | 644 (rw-r--r--) | 755 (rwxr-xr-x) |
| 0002 | 664 | 775 |

Формула: права файла = `666 & ~umask`, каталога = `777 & ~umask`.

Сервисы иногда задают umask в unit-файле (`UMask=0077`), чтобы логи не были world-readable.

## Связь с безопасностью

- Пароли — только в shadow, не в git.
- Служебные учётки — `/usr/sbin/nologin` или `/bin/false` как shell, если login не нужен.
- Один человек — один UID; «общий пароль admin» в `/etc/passwd` — красный флаг.

## Чек-лист

- Где хранится хэш пароля и почему не в passwd?
- Чем опасен `usermod -G` без `-a`?
- Что покажет `id` для пользователя в двух группах?
- Какие права даст `umask 0027` на новый файл?

Следующий урок: [03. Лаба: пользователи](03-lab-users.md).
