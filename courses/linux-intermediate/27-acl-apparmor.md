# 27. ACL и AppArmor (обзор)

## Введение: «chmod 777, а всё равно Permission denied»

Представьте каталог `/srv/uploads`, куда должны писать три команды: **deploy** (CI), **www-data** (nginx) и группа **content**. Классические права Unix — только **один владелец** и **одна группа** плюс «все остальные». Варианты:

- сделать всех членами одной группы — работает, но ломается при увольнении человека из группы;
- `chmod 777` — «все пишут» — **плохая идея** в проде;
- **ACL** — отдельная запись «пользователь bob: rwx» без смены владельца.

Вторая история: права вроде бы есть (`rwx` для www-data), а nginx не читает файл в `/var/www/secret`. В логе — **Permission denied**, в `dmesg` — **apparmor="DENIED"**. Это уже **AppArmor** — профиль безопасности, который говорит: «процесс nginx **не имеет права** читать этот путь», даже если UID позволяет.

Эта глава — про оба механизма на Ubuntu. Глубже MAC — в [linux-security](../linux-security/README.md).

## Что вы узнаете

- Когда **chmod/chown** достаточно, а когда нужны ACL.
- Как читать вывод **getfacl** построчно.
- Зачем **default ACL** на каталоге для «наследования» прав новых файлов.
- Что такое **AppArmor** и как отличить от обычных прав.
- Куда смотреть при отказе: **dmesg**, **aa-status**.

## Класические права — напоминание

```bash
ls -l /srv/shared
# drwxrws--- root developers ...
```

| Бит | На каталоге |
|-----|-------------|
| r | можно `ls` (видеть имена) |
| w | можно создавать/удалять **имена** файлов |
| x | можно `cd` внутрь |
| s (setgid) | новые файлы наследуют **группу** каталога |

ACL **не заменяют** owner/group — они **добавляют** записи поверх.

## ACL — установка и чтение

```bash
sudo apt install -y acl
getfacl /srv/shared
```

Пример вывода **getfacl** (разбор):

```text
# file: srv/shared
# owner: root
# group: developers
user::rwx          ← права ВЛАДЕЛЬЦА (как в ls)
group::r-x         ← права ГРУППЫ
other::---         ← остальные
user:deploy:rwx    ← ДОПОЛНИТЕЛЬНО: пользователь deploy
default:user:deploy:rwx   ← для НОВЫХ файлов в каталоге (если есть default ACL)
```

Символ `+` в `ls -l` (`drwxrws---+`) значит: «есть ACL, смотри getfacl».

## Добавление ACL

```bash
# deploy может всё в этом каталоге
sudo setfacl -m u:deploy:rwx /srv/shared

# группа auditors — только чтение
sudo setfacl -m g:auditors:rx /srv/shared

# ВСЕ новые файлы в каталоге — deploy rwx по умолчанию
sudo setfacl -d -m u:deploy:rwx /srv/shared
```

| Команда | Смысл |
|---------|--------|
| `setfacl -m u:USER:perms` | modify ACL для пользователя |
| `setfacl -m g:GROUP:perms` | для группы |
| `setfacl -d -m ...` | **default** ACL (только на **каталоге**) |
| `setfacl -b PATH` | снести все ACL |
| `setfacl -x u:deploy` | удалить одну запись |

Проверка после создания файла от deploy:

```bash
sudo -u deploy touch /srv/shared/new.txt
getfacl /srv/shared/new.txt
```

Если на каталоге был **default ACL**, новый файл унаследует записи.

## ACL vs новая группа — когда что

| Ситуация | Решение |
|----------|---------|
| Одна команда, один shared каталог | группа + setgid на каталоге |
| Два-три «особых» пользователя вне группы | ACL |
| NFS с разными uid на клиентах | ACL + idmap, осторожно |
| Временный доступ аудитору на неделю | ACL, потом `setfacl -x` |

## AppArmor — «песочница» для программ

**Mandatory Access Control (MAC):** политика задаёт **разрешённые пути и capabilities**, а не только UID.

```bash
sudo aa-status
```

Типичный фрагмент:

```text
apparmor module is loaded.
XX profiles are loaded.
XX profiles are in enforce mode.
   /usr/sbin/nginx
   ...
```

Режимы:

| Режим | Смысл |
|-------|--------|
| **enforce** | отказ реальный |
| **complain** | только лог, не блок (отладка) |
| disabled | профиль выключен |

При отказе:

```bash
sudo dmesg | tail -30 | grep -i apparmor
# apparmor="DENIED" operation="open" profile="/usr/sbin/nginx" name="/etc/ssl/private/..."
```

**Не** отключайте AppArmor на сервере (`apparmor=0` в kernel cmdline) как «быстрый фикс» — найдите профиль в `/etc/apparmor.d/` или local override.

## SELinux на RHEL

На Rocky/Alma/RHEL вместо AppArmor — **SELinux**. Команды другие (`getenforce`, `ausearch`), идея та же: MAC поверх DAC. См. [linux-security/11-selinux](../linux-security/11-selinux.md).

## На стенде deploy/linux

Лаба [28](28-lab-acl.md) — `/srv/aclshare` на **lab**. AppArmor в контейнере может быть частично отключён — `aa-status` всё равно запустите для привычки.

## Типичные ошибки

| Симптом | Вероятная причина | Что сделать |
|---------|-------------------|-------------|
| `setfacl: Operation not supported` | ФС без ACL | ext4/xfs OK; проверьте `tune2fs -l` |
| После `cp` ACL пропали | cp без `-a` | `cp -a` или `rsync -A` |
| 777, всё равно denied | AppArmor | dmesg, профиль nginx |
| NFS, «чужой» uid | idmap, all_squash | согласовать uid/gid |
| default ACL не сработал | не каталог / нет `-d` | setfacl на каталоге |

## В продакшене

- ACL на **NFS** — документируйте uid/gid mapping.
- AppArmor **enforce** для nginx, php-fpm — стандарт на Ubuntu.
- Изменения профилей — через `aa-complain`, тест, потом enforce.
- Аудит: кто добавил ACL на production share.

## Резюме

**DAC** (chmod/chown) — база. **ACL** — тонкая настройка «ещё этот пользователь». **AppArmor** — ограничивает программу независимо от chmod. При «странном» отказе смотрите **getfacl** и **dmesg APPARMOR DENIED**. Default ACL на каталоге экономит нервы при CI, создающем тысячи файлов в upload.

## Чек-лист

- Что означает `user:deploy:rwx` в getfacl?
- Зачем `setfacl -d` только на каталоге?
- Как отличить AppArmor от chmod?
- Почему `chmod 777` не лечит DENIED в dmesg?

Следующий урок: [28. Лаба: ACL](28-lab-acl.md).
