# 02. SSH hardening

## Почему SSH — приоритет №1

**sshd** — удалённый shell с правами пользователя. Компрометация ключа или пароля = полный контроль (особенно с sudo).

Большинство инцидентов на публичных VPS начинается с **22/tcp** и brute force.

## Файлы конфигурации

| Путь | Назначение |
|------|------------|
| `/etc/ssh/sshd_config` | главный конфиг |
| `/etc/ssh/sshd_config.d/*.conf` | drop-in (Ubuntu) — **предпочтительно** |
| `~/.ssh/authorized_keys` | ключи пользователя |

После правки:

```bash
sudo sshd -t && sudo systemctl reload ssh
```

**Никогда** не выходите из единственной SSH-сессии до проверки новой.

## Аутентификация

```text
PermitRootLogin no
PasswordAuthentication no
PubkeyAuthentication yes
PermitEmptyPasswords no
MaxAuthTries 3
LoginGraceTime 30
AllowUsers course deploy
```

| Директива | Зачем |
|-----------|-------|
| `PermitRootLogin no` | root только локально / через sudo |
| `PasswordAuthentication no` | только после настройки ключей |
| `AllowUsers` | whitelist логинов |
| `MaxAuthTries 3` | ограничить brute force |

## Match — политика per-user

```text
Match User deploy
    AllowTcpForwarding no
    X11Forwarding no
    PermitTTY no
    ForceCommand /usr/local/bin/deploy-hook.sh
```

`ForceCommand` — только одна разрешённая команда (для CI deploy key).

## Криптография

Современные алгоритмы (пример):

```text
KexAlgorithms curve25519-sha256@libssh.org,diffie-hellman-group16-sha512
Ciphers chacha20-poly1305@openssh.com,aes256-gcm@openssh.com
MACs hmac-sha2-512-etm@openssh.com
```

Проверка клиента:

```bash
ssh -Q kex
ssh -Q cipher
```

## Ключи

| Тип | Рекомендация |
|-----|--------------|
| ed25519 | по умолчанию |
| rsa 4096 | legacy системы |
| dss | **не использовать** |

Права:

```text
~/.ssh           700
authorized_keys  600
private key      600
```

## Дополнительно

- Порт 22 → нестандартный (security through obscurity **дополнение**, не замена firewall).
- `AllowGroups sshusers`
- `Banner /etc/issue.net` — юридическое предупреждение

См. [examples/sshd-hardened.snippet](examples/sshd-hardened.snippet).

## Чек-лист

- Порядок: ключи → отключить пароль → reload?
- Зачем вторая SSH-сессия при правке?
- Чем Match отличается от глобальных директив?

Следующий урок: [03. Лаба: sshd](03-lab-ssh-harden.md).
