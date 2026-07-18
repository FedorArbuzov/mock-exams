# 23. sudo и sudoers

## Введение: «дай root на сервер» — нет

В компании запрос «нужен пароль root для деплоя» заменяют **sudo**: выполнить **одну** (или whitelist) команд с повышением прав, с записью в аудит. Политика в `/etc/sudoers` и `/etc/sudoers.d/` — **кто**, **от чьего имени**, **какие** бинарники.

Одна синтаксическая ошибка в sudoers может лишить **всех** sudo на хосте — чинят через serial console или rescue volume.

## Что вы узнаете

- Базовые команды `sudo`, `sudo -l`, `sudo -u`.
- Синтаксис строки sudoers и **NOPASSWD**.
- **visudo** — единственный безопасный способ правки.
- Где аудит: **auth.log** / journal.
- **sudo** vs **su -** vs SSH под root.

---

## Базовое использование

```bash
sudo whoami
sudo -u www-data id
sudo -l
sudo -v    # продлить timestamp
sudo -k    # сбросить cached credentials
```

| Команда | Смысл |
|---------|--------|
| `sudo cmd` | cmd от root (по умолчанию) |
| `sudo -u www-data cmd` | cmd от имени www-data |
| `sudo -l` | что разрешено **вам** |
| `sudo -i` | login shell root — **редко**, осознанно |

`-i` = полноценная root-сессия; в проде предпочтительнее whitelist команд.

---

## visudo — только так

```bash
sudo visudo
sudo visudo -f /etc/sudoers.d/deploy-nginx
sudo visudo -c
sudo visudo -cf /etc/sudoers.d/
```

**Почему не `vim /etc/sudoers`:** visudo блокирует одновременное редактирование и **проверяет синтаксис** перед сохранением.

Фрагменты в `/etc/sudoers.d/`:

- права файла **0440** (`-r--r-----`);
- имя **без** `.` и спецсимволов (некоторые версии игнорируют такие файлы).

---

## Разбор строки sudoers

```text
deploy  ALL=(ALL) NOPASSWD: /usr/bin/systemctl restart nginx, /usr/bin/nginx -t
```

| Поле | Значение |
|------|----------|
| `deploy` | пользователь (или `%group` для группы) |
| `ALL` | на любых хостах (в LDAP sudo — Host_Alias) |
| `(ALL)` | от любого target user (часто root) |
| `NOPASSWD:` | не спрашивать пароль — **только** для перечисленных команд |
| команды | **полные пути** к бинарникам |

Группа sudo на Ubuntu (Debian):

```text
%sudo   ALL=(ALL:ALL) ALL
```

**NOPASSWD: ALL** — только break-glass или учебная VM; в проде = компрометация одного ключа = полный root.

### Алиасы (обзор)

```text
Cmnd_Alias NGINX = /usr/bin/nginx -t, /usr/bin/systemctl restart nginx
deploy ALL=(root) NOPASSWD: NGINX
```

---

## Аудит

```bash
grep sudo /var/log/auth.log | tail -10
journalctl -t sudo --no-pager -n 15
```

В расследовании: «кто в 03:14 делал `systemctl restart nginx`».

Строки вида:

```text
sudo: course : TTY=pts/0 ; PWD=/home/course ; USER=root ; COMMAND=/usr/bin/systemctl restart nginx
```

---

## sudo vs su

| | sudo | su - |
|---|------|------|
| Аудит команд | да, по строке COMMAND | слабее |
| Гранулярность | одна команда / whitelist | полный shell |
| Нужен пароль root | нет (свой пароль) | часто да |
| Рекомендация | эксплуатация | legacy |

`sudo -i` ≈ `su -` с вашим паролем — оба дают полный root.

---

## Типичные ошибки

| Симптом | Причина |
|---------|---------|
| `sorry, you must have a tty to run sudo` | requiretty; cron/ansible без PTY |
| `user is not in the sudoers file` | нет в группе / файле |
| `visudo: syntax error` | битый sudoers — repair через console |
| NOPASSWD не работает | другая строка перекрывает; порядок include |
| разрешили `EDITOR=vim` без ограничений | privilege escalation через sudoedit |

**Никогда** не давайте `ALL=(ALL) NOPASSWD: ALL` deploy-пользователю в prod.

---

## В продакшене

sudoers из **Ansible/Terraform**, code review. CI/CD — отдельный technical user с **минимальным** whitelist. Роли: deploy, dba, oncall — разные файлы в `sudoers.d/`. Централизованный сбор auth.log.

В [лабе 24](24-lab-sudo.md) создадите фрагмент `deploy-nginx` и проверите `visudo -c`.

---

## Резюме

sudo — контролируемое повышение прав с аудитом. Правьте только через **visudo**. Whitelist команд вместо ALL. Читайте auth.log при инцидентах.

## Чек-лист

- [ ] Зачем visudo, а не vim?
- [ ] Как разрешить только `nginx -t` и `systemctl restart nginx`?
- [ ] Где смотреть, кто что выполнял?

Следующий урок: [24. Лаба: sudo](24-lab-sudo.md).
