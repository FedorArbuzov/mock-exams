# 16. SSH: ключи, config, основы hardening

## Как вы реально работаете с Linux в компании

Почти всегда: ноутбук → **ssh user@jump** → **ssh app@internal**. Пароль — редкость; **ключи** + иногда MFA. Понимание `~/.ssh`, `authorized_keys` и `sshd_config` — база, без которой вы не деплоите и не чините доступ ночью.

## Клиент и сервер

**sshd** слушает порт **22** (или нестандартный). Клиент `ssh` шифрует сессию и согласовывает аутентификацию.

```bash
ssh course@172.28.0.11
ssh -p 2222 user@host
ssh -v course@172.28.0.11    # отладка handshake
```

## Пароль vs ключ

| Метод | Где уместен |
|-------|-------------|
| Пароль | первая настройка, учебный стенд |
| Ключ ed25519 | прод, CI, повседневная работа |

Генерация отдельного ключа под лаб (не смешивайте с личным):

```bash
ssh-keygen -t ed25519 -f ~/.ssh/id_ed25519_lab -C "course@lab"
chmod 700 ~/.ssh
chmod 600 ~/.ssh/id_ed25519_lab
cat ~/.ssh/id_ed25519_lab.pub
```

Установка на сервер:

```bash
ssh-copy-id -i ~/.ssh/id_ed25519_lab.pub course@172.28.0.11
```

Вручную (если copy-id нет):

```bash
cat ~/.ssh/id_ed25519_lab.pub | ssh course@172.28.0.11 \
  'mkdir -p ~/.ssh && chmod 700 ~/.ssh && cat >> ~/.ssh/authorized_keys && chmod 600 ~/.ssh/authorized_keys'
```

Проверка:

```bash
ssh -i ~/.ssh/id_ed25519_lab course@172.28.0.11 hostname
```

## ~/.ssh/config — меньше опечаток

```text
Host srv1
    HostName 172.28.0.11
    User course
    IdentityFile ~/.ssh/id_ed25519_lab
    StrictHostKeyChecking accept-new
```

```bash
ssh srv1
scp srv1:/tmp/file .
```

## Права — sshd откажет, если «слишком открыто»

| Путь | Права |
|------|-------|
| `~/.ssh` | 700 |
| `authorized_keys` | 600 |
| приватный ключ | 600 |
| домашний каталог | не group/world writable |

## Hardening (осторожно в лабе)

В `/etc/ssh/sshd_config` типично:

```text
PermitRootLogin no
PasswordAuthentication no    # только после проверки ключа!
AllowUsers course deploy
```

```bash
sudo sshd -t && sudo systemctl reload ssh
```

**Не отключайте пароль**, пока не убедились, что ключ работает в **второй** сессии. Иначе закроете себе доступ.

Подробнее: [linux-security/02-ssh-hardening](../linux-security/02-ssh-hardening.md).

## scp и sftp

```bash
scp -i ~/.ssh/id_ed25519_lab local.txt course@172.28.0.11:/tmp/
sftp course@172.28.0.11
```

Для больших деревьев — [rsync](15-archives-rsync.md).

## Чек-лист

- Где на **сервере** лежит публичный ключ?
- Почему `chmod 644` на приватный ключ — плохо?
- Что проверить перед `PasswordAuthentication no`?

Следующий урок: [16. Лаба: SSH](16-lab-ssh.md).
