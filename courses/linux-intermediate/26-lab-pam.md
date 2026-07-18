# 26. Лаба: PAM (обзор, без поломок)

## Цель лабы

Вы **не сломаете** вход на сервер. Вы прочитаете, как **sshd** и **sudo** проходят через PAM, посмотрите **limits** и **faillock**, свяжете это с строками в **auth.log**. После лабы фраза «PAM заблокировал» будет для вас конкретной, а не магией.

## Предварительно

- Теория [25. PAM](25-pam.md).
- lab или srv1, обычный пользователь + sudo.
- **Не редактируйте** `/etc/pam.d/*` в этой лабе.

---

## Подготовка стенда

```bash
whoami
ls /etc/pam.d/ | wc -l
grep '^auth' /etc/pam.d/sshd | head -5
```

---

## Задание 1. Карта pam.d

**Зачем:** понять, сколько сервисов используют PAM.

```bash
ls /etc/pam.d/ | head -25
echo "---"
ls /etc/pam.d/ | wc -l
```

Откройте **sshd** (первые 30 строк):

```bash
head -30 /etc/pam.d/sshd
```

**Что искать:**

- `auth` — проверка пароля/ключа (ключ обрабатывается sshd, пароль — через pam_unix)
- `account` — можно ли входить сейчас (expired, locked)
- `session` — лимиты, логирование сессии
- `password` — смена пароля

**Если не работает:** файл есть на любой Ubuntu — вы в минимальном контейнере без sshd? Выполните на **srv1**.

---

## Задание 2. pam.d для sudo

**Зачем:** sudo тоже идёт через PAM.

```bash
head -20 /etc/pam.d/sudo
```

Сравните с sshd — общие модули `pam_unix`, возможно `pam_limits`.

---

## Задание 3. limits — ulimit

**Зачем:** session PAM применяет лимиты из `/etc/security/limits.conf`.

```bash
ulimit -n
ulimit -u
grep -v '^#' /etc/security/limits.conf | grep -v '^$' | head -15
```

**Что увидите:** soft/hard для nofile, nproc. «Too many open files» в приложении — часто ulimit.

---

## Задание 4. faillock (если есть)

**Зачем:** связь bruteforce SSH с блокировкой.

```bash
which faillock
faillock --user $(whoami) 2>/dev/null || echo "нет записей или faillock не настроен"
```

На Ubuntu 22.04+ может быть **pam_faillock** в sshd — тогда после N неудачных паролей user временно locked.

**Не** набирайте нарочно 50 неверных паролей на prod.

---

## Задание 5. auth.log и неудачный вход

**Зачем:** увидеть след PAM/ssh в логах.

```bash
sudo grep -i "Failed password" /var/log/auth.log 2>/dev/null | tail -5
sudo journalctl -u ssh --no-pager 2>/dev/null | grep -i "Failed" | tail -5
```

Если пусто — в стенде не было неудачных попыток; это нормально.

Опционально (с **другой** сессии, один раз, учебно):

```bash
# НЕ на prod — один неверный пароль для лога
ssh wronguser@127.0.0.1 2>&1 | head -2
```

---

## Задание 6. nsswitch (связь с LDAP — теория)

**Зачем:** PAM проверяет пароль, но «кто такой user» может прийти из LDAP.

```bash
grep '^passwd:' /etc/nsswitch.conf
grep '^auth:' /etc/nsswitch.conf
```

**Что увидите:** `files systemd` или `files ldap` — порядок источников.

---

## Критерии успеха

- [ ] Прочитан `/etc/pam.d/sshd` (на srv1 или lab)
- [ ] Выполнен `ulimit -n`
- [ ] Понимаете: PAM — цепочка модулей, не один файл
- [ ] **pam.d не изменяли**

## Что унести в работу

- «Не пускает по паролю» — faillock, expired, не только «забыл пароль».
- Правки pam.d — только с консолью/recovery.

Следующий урок: [27. ACL и AppArmor](27-acl-apparmor.md).
