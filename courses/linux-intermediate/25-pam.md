# 25. PAM — цепочка аутентификации

## Введение: пароль верный, но login не пускает

Сценарии с работы:

- SSH: «Authentication succeeded» в debug, но сессия сразу обрывается — смотрите **account** и **session** в PAM, не только пароль.
- После пяти неудачных попыток учётка **заблокирована на час** — это часто **pam_faillock**, а не «админ заблокировал в LDAP».
- `su - deploy` работает, `ssh deploy@host` — нет: разные файлы **`/etc/pam.d/su`** и **`pam.d/sshd`**.

За этим стоит **PAM** (Pluggable Authentication Modules): не sshd и не `/etc/shadow` сами по себе решают всё, а **цепочка** подключаемых модулей — unix, ldap, faillock, limits.

## Что вы узнаете

- Что такое `/etc/pam.d/sshd`, `login`, `sudo`.
- Связь PAM с `/etc/shadow` и nsswitch.
- Как работает **pam_faillock** (концепт).
- Типы строк: **auth**, **account**, **password**, **session**.
- Почему не править `pam.d` «наугад» без консоли.

---

## Стек PAM

```mermaid
flowchart TB
  app[sshd / login / sudo]
  pamd[/etc/pam.d/имя-сервиса]
  mods[pam_unix.so / pam_faillock / pam_limits ...]
  shadow[/etc/shadow + nss]
  app --> pamd
  pamd --> mods
  mods --> shadow
```

Приложение вызывает **PAM API** (`pam_authenticate`, `pam_acct_mgmt`, …). PAM читает конфиг сервиса и по очереди вызывает `.so` модули.

```bash
ls /etc/pam.d/
head -25 /etc/pam.d/sshd
head -15 /etc/pam.d/sudo
head -15 /etc/pam.d/common-auth 2>/dev/null
```

На Ubuntu часть логики вынесена в **`common-auth`**, **`common-account`** — их подключают через `@include`.

---

## Типы management (столбец в pam.d)

| Тип | Вопрос, на который отвечает | Пример |
|-----|------------------------------|--------|
| **auth** | Кто вы? Пароль/ключ верен? | pam_unix, pam_sss |
| **account** | Можно ли сейчас? (expired, locked, time) | pam_nologin, pam_unix |
| **password** | Смена пароля при login | pam_unix |
| **session** | Окружение после входа, limits, audit | pam_limits, pam_systemd |

**Порядок строк важен.** Модуль с флагом `required` при fail останавливает цепочку; `sufficient` может завершить успех раньше.

Пример (упрощённо, не копируйте вслепую):

```text
auth    required    pam_unix.so
auth    required    pam_faillock.so preauth
account required    pam_unix.so
session required    pam_limits.so
```

---

## pam_unix и shadow

**pam_unix** сверяет пароль с хэшем в **`/etc/shadow`** (локальный пользователь).

```bash
getent passwd course
sudo grep '^course:' /etc/shadow   # только root
```

LDAP/AD: вместо shadow — **nss** (`getent passwd`) + **pam_sss** / **pam_ldap**. Симптом «пользователь есть в id, пароль не принимается» — смотрите и nss, и pam.

```bash
grep passwd /etc/nsswitch.conf
```

---

## pam_faillock (обзор)

Блокирует учётку после N неудачных попыток (brute-force).

```bash
faillock --user course 2>/dev/null
sudo faillock --user course
sudo faillock --reset --user course
```

Точный синтаксис в `pam.d` зависит от версии Ubuntu (иногда `pam_tally2` в старых системах). В [лабе 26](26-lab-pam.md) — только **чтение** и сброс в учебной среде.

**Риск:** заблокировали root — нужен serial/console или rescue.

---

## pam_limits и /etc/security/limits.conf

Ограничения **nofile**, **nproc**, **maxlogins** при открытии session:

```bash
grep -v '^#' /etc/security/limits.conf | grep -v '^$'
ulimit -n
ulimit -u
```

PAM `pam_limits.so` применяет их при login. В systemd-сервисах лимиты могут задаваться unit'ом (`LimitNOFILE=`) — два механизма, не путать.

---

## sudo и PAM

`sudo` тоже проходит через **`/etc/pam.d/sudo`**. Политика «кто может sudo» — в **sudoers**; PAM — пароль, faillock, limits при вызове.

```bash
grep pam /etc/pam.d/sudo | head -5
```

---

## Типичные ошибки

| Симптом | Вероятная причина | Действие |
|---------|-------------------|----------|
| Все локальные логины fail | синтаксис pam.d, битый include | консоль, `pam-auth-update`, backup |
| Только SSH fail, console OK | pam.d/sshd vs login | diff файлов |
| root locked | faillock | faillock --reset с консоли |
| LDAP user unknown | nss, не pam | `getent passwd` |
| «password correct» но exit | account (expired shell) | `chage -l user` |

**Никогда** не удаляйте все строки `pam_unix` в `common-auth` на удалённом сервере без out-of-band доступа.

---

## В продакшене

LDAP/SSSD + faillock + 2FA на VPN. Изменения pam — change window, **serial/console**, версионирование в Ansible. Аудит: `journalctl`, SIEM по auth.log.

Подробнее lockout и hardening — курс [linux-security](../linux-security/README.md).

---

## Резюме

PAM — посредник между **сервисом** (sshd, sudo) и **политикой** (пароль, lockout, limits). Один пользователь — разные цепочки в разных `pam.d`. Не редактируйте без rescue и `pam-auth-update` / теста на staging.

## Чек-лист

- [ ] Где конфиг PAM для SSH?
- [ ] Чем **auth** отличается от **account**?
- [ ] Чем PAM отличается от `/etc/shadow`?
- [ ] Как сбросить faillock для пользователя?

Следующий урок: [26. Лаба: PAM](26-lab-pam.md).
