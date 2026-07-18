# 04. Права rwx, chmod, chown, special bits

## Почему «Permission denied» — самая частая ошибка деплоя

Приложение не пишет в каталог, nginx не читает сертификат, cron не запускает скрипт — почти всегда виноваты **права** или **владелец**. Понимание `ls -l` экономит часы: вы смотрите три triplet'а (owner, group, others) и special bits, а не перезапускаете сервер «наугад».

## Разбор `ls -l`

```bash
ls -l /etc/passwd
ls -ld /etc /tmp
```

```text
drwxrwxrwt  10 root root  ... /tmp
- rw- r-- r--   1 root root  ... /etc/passwd
│ └┬┘ └┬┘ └┬┘
│  │   │   └── others (все, кто не owner и не в группе)
│  │   └────── group
│  └────────── owner
└───────────── тип: - файл, d каталог, l symlink
```

| Право | На **файле** | На **каталоге** |
|-------|--------------|-----------------|
| r (4) | читать содержимое | **листинг** имён (`ls`) |
| w (2) | писать в файл | создавать/удалять **имена** в каталоге |
| x (1) | запускать (если исполняемый) | **вход** (`cd`) и обход |

**Важно:** для каталога **x** обязателен, чтобы `cd /var/log` работал, даже если `r` есть только у root. Без `x` на родительских каталогах путь «не существует» для вас.

## chmod — числа и буквы

```bash
chmod 644 report.txt
chmod 755 deploy.sh
chmod u+x deploy.sh
chmod g-w secret.txt
chmod -R u+rX /srv/shared    # X = x только для каталогов
```

| Цифра | Биты |
|-------|------|
| 7 | rwx |
| 6 | rw- |
| 5 | r-x |
| 4 | r-- |

Три цифры — owner, group, others: `chmod 750` = rwx для владельца, r-x для группы, ничего для остальных.

## chown и chgrp

```bash
sudo chown deploy:developers /srv/shared
sudo chown deploy app.log
sudo chgrp www-data /var/www/html
```

Менять **владельца** может только root (исключения — передача своих файлов). В проде после `rsync` или распаковки архива часто нужен `chown -R appuser:appgroup /var/lib/myapp`.

## Special bits — когда они нужны

| Бит | На файле | На каталоге |
|-----|----------|-------------|
| **setuid** (4xxx) | процесс с UID владельца файла | редко |
| **setgid** (2xxx) | процесс с GID файла | новые файлы наследуют **группу каталога** |
| **sticky** (1xxx) | — | удалить файл может только владелец (`/tmp`) |

```bash
ls -ld /tmp
# ... drwxrwxrwt — буква t в конце = sticky
chmod 2775 /srv/uploads   # setgid на каталоге
chmod +t /srv/sticky-demo
```

**setuid** на случайных бинарниках — дыра в безопасности (локальное повышение привилегий). В современных системах минимум setuid-программ (`passwd`, `sudo`).

## umask в действии

```bash
umask
touch umask-demo-file
mkdir umask-demo-dir
ls -l umask-demo-file
ls -ld umask-demo-dir
```

Если сервис создаёт файлы с «слишком открытыми» правами — проверьте umask в systemd unit или в init-скрипте.

## ACL — когда rwx не хватает

Классических трёх triplet'ов мало, если нужно «user bob may read, group devs may write». Тогда **ACL** — в [linux-intermediate](../linux-intermediate/27-acl-apparmor.md).

## Типичные сценарии DevOps

| Симптом | Что проверить |
|---------|----------------|
| nginx 403 на static | owner/group и `r` для worker (www-data) |
| cannot create pid file | права на `/var/run/...` |
| script works manually, fails in cron | другой user, нет `x` на скрипте или PATH |

## Чек-лист

- Почему `chmod 600` на **каталоге** не даёт `cd`?
- Зачем sticky на `/tmp`?
- Кто может выполнить `chown root:root file`?
- Что даёт setgid на shared-каталоге?

Следующий урок: [04. Лаба: права](04-lab-permissions.md).
