# 24. Лаба: sudoers для deploy

## Цель лабы

Настроить пользователя **deploy** так, как это делают для CI/CD: он может **перезапустить nginx** и **проверить конфиг**, но **не** может ставить пакеты или получать полный root без пароля. Вы потрогаете реальный файл `/etc/sudoers.d/` и увидите разницу между «разрешено» и «запрещено» в выводе `sudo`.

## Предварительно

- Стенд [`deploy/linux`](../../deploy/linux/README.md), контейнер **srv1** (172.28.0.11).
- Вы можете зайти как **course** с sudo или root.
- Прочитана теория [23. sudo](23-sudo.md).

Если пользователя **deploy** ещё нет:

```bash
ssh course@172.28.0.11
sudo useradd -m -s /bin/bash deploy
sudo passwd deploy   # учебный пароль, например deploy
```

Для лабы **не** давайте deploy полный NOPASSWD ALL — смысл в ограничении.

---

## Подготовка стенда

На srv1:

```bash
sudo apt install -y nginx
sudo systemctl enable --now nginx
sudo nginx -t
id deploy
```

Запишите полные пути (на Ubuntu часто):

```bash
which nginx systemctl
# /usr/bin/nginx
# /usr/bin/systemctl
```

В sudoers **обязательны полные пути** к бинарникам.

---

## Задание 1. Создать фрагмент sudoers

**Зачем:** отдельный файл в `/etc/sudoers.d/` проще ревьюить в git/Ansible, чем править `/etc/sudoers`.

На srv1:

```bash
sudo tee /etc/sudoers.d/deploy-nginx <<'EOF'
# Deploy user: only nginx operations without password
deploy ALL=(ALL) NOPASSWD: /usr/bin/nginx -t, \
                              /usr/bin/systemctl status nginx, \
                              /usr/bin/systemctl restart nginx, \
                              /usr/bin/systemctl reload nginx
EOF
sudo chmod 440 /etc/sudoers.d/deploy-nginx
sudo visudo -c
```

**Что увидите:**

```text
/etc/sudoers.d/deploy-nginx: parsed OK
```

**Если `syntax error`:** не продолжайте — исправьте файл; битый sudoers может lockout sudo.

Разбор строки:

| Часть | Значение |
|-------|----------|
| `deploy` | кто вызывает sudo |
| `ALL` | на любом хосте (в LDAP — host alias) |
| `(ALL)` | может стать root для этих команд |
| `NOPASSWD:` | без пароля deploy |
| список путей | **только** эти команды |

---

## Задание 2. Проверка разрешённых команд

**Зачем:** убедиться, что whitelist работает.

Сессия от root или course:

```bash
sudo -u deploy sudo -n nginx -t
sudo -u deploy sudo -n systemctl status nginx --no-pager | head -8
sudo -u deploy sudo -n systemctl reload nginx
```

Флаг **`-n`** — non-interactive, без пароля. Должно **не** спрашивать пароль.

**Что увидите:** `syntax is ok`, статус nginx active.

**Если «password is required»:** опечатка в пути (`which nginx`), или лишние аргументы не разрешены — в strict sudoers иногда нужно точное совпадение; для лабы достаточно перечисленных команд.

---

## Задание 3. Запрещённая команда

**Зачем:** убедиться, что deploy **не** root.

```bash
sudo -u deploy sudo -n apt update 2>&1 | head -5
sudo -u deploy sudo -n whoami 2>&1 | head -3
```

**Что увидите:** что-то вроде:

```text
Sorry, user deploy is not allowed to execute '/usr/bin/apt update' as root
```

или запрос пароля, который у deploy вы не вводите — эффект тот же: **отказ**.

---

## Задание 4. sudo -l от имени deploy

**Зачем:** deploy (или аудитор) видит свои права.

```bash
sudo -u deploy sudo -l
```

**Что увидите:** список NOPASSWD команд nginx/systemctl.

---

## Задание 5. Аудит в auth.log

**Зачем:** в проде расследуют «кто рестартнул nginx».

```bash
sudo grep deploy /var/log/auth.log | tail -5
# или
sudo journalctl -t sudo --no-pager | grep deploy | tail -5
```

Выполните ещё раз `sudo -u deploy sudo -n systemctl restart nginx` и снова grep — появится новая строка с timestamp.

---

## Задание 6. (Опционально) Опасный пример — не делайте в проде

Только для понимания, **не сохраняйте**:

```text
deploy ALL=(ALL) NOPASSWD: ALL
```

Это эквивалент root без пароля для deploy. В компании так не делают.

---

## Уборка

```bash
sudo rm -f /etc/sudoers.d/deploy-nginx
sudo visudo -c
```

Пользователя deploy можно оставить для [финального проекта](34-final-project.md).

---

## Критерии успеха

- [ ] `visudo -c` — parsed OK
- [ ] `sudo -u deploy sudo -n nginx -t` — без пароля
- [ ] `sudo -u deploy sudo -n apt update` — отказ
- [ ] В auth.log есть след вызова sudo от deploy

## Что унести в работу

- CI-пользователь: **минимальный** NOPASSWD whitelist, полные пути.
- Перед merge в sudoers — всегда `visudo -c`.
- Расследование: `grep deploy /var/log/auth.log`.

Следующий урок: [25. PAM](25-pam.md).
