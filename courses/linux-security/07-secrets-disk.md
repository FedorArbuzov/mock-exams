# 07. Секреты на диске

## Где утекают секреты

| Место | Пример |
|-------|--------|
| `.env` в git | API_KEY=... |
| `/tmp` world-readable | dump токена |
| бэкапы | pg_dump с паролями |
| swap | ключи в памяти на диске |
| history | `export TOKEN=...` |

## Права на файлы

```bash
umask 077
install -m 600 -o app app /etc/myapp/secret.env
find /etc/myapp -type f -perm /o+r -ls
```

| Права | Кто читает |
|-------|------------|
| 644 | все пользователи системы |
| 600 | только владелец |
| 640 | владелец + группа |

## /tmp и /dev/shm

Монтирование в `/etc/fstab`:

```text
tmpfs /tmp tmpfs defaults,noexec,nosuid,nodev,size=2G 0 0
```

- `noexec` — нельзя запустить бинарник из /tmp
- `nosuid` — игнор setuid
- `nodev` — нет device files

## Память и swap

Для sensitive hosts:

- encrypted swap или `swapoff`;
- **mlock** для секретов в приложениях (редко в лабе).

## Vault и менеджеры секретов

Секреты **не** в репозитории:

- HashiCorp Vault, OpenBao — курс [secrets-basic](../secrets-basic/README.md) / [advanced](../secrets-advanced/README.md), стенд [`deploy/vault`](../../deploy/vault/README.md);
- AWS Secrets Manager ([`aws-intermediate/11-secrets-kms`](../aws-intermediate/11-secrets-kms.md));
- GitLab CI variables (masked) — [gitlab-basic/07](../gitlab-basic/07-variables-secrets.md).

Приложение получает секрет при старте через agent/sidecar.

## git-secrets

Pre-commit hook — блокировать commit с `AKIA`, private keys.

## Чек-лист

- Как найти world-readable файлы в /etc?
- Зачем noexec на /tmp?
- Где хранить DB password в K8s? (preview: Secret)

Следующий урок: [08. Лаба: права секретов](08-lab-tmp.md).
