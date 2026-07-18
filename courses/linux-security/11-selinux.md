# 11. SELinux и AppArmor (MAC)

## DAC vs MAC

| Модель | Пример | Ограничение |
|--------|--------|-------------|
| **DAC** | chmod, chown | root обходит всё |
| **MAC** | SELinux, AppArmor | политика ядра, даже для root |

## SELinux (RHEL, CentOS, Fedora)

Режимы:

```bash
getenforce
# Enforcing | Permissive | Disabled
```

Контекст файла:

```bash
ls -Z /etc/nginx/nginx.conf
ps -eZ | grep nginx
```

Типичная проблема: nginx не читает файл — **wrong context**. Временно:

```bash
ausearch -m avc -ts recent
# fix: semanage fcontext + restorecon
```

Не отключайте SELinux в проде (`setenforce 0`) без RCA.

## AppArmor (Ubuntu)

```bash
sudo aa-status
sudo aa-complain /usr/sbin/nginx
sudo journalctl -k | grep apparmor
```

Профили: `/etc/apparmor.d/`

| Режим | Поведение |
|-------|-----------|
| enforce | блокировать |
| complain | логировать |
| disable | выключен |

## В Docker-лабе

Полноценный SELinux enforcing на хосте; в контейнере — **aa-status** и понимание концепции.

## Чек-лист

- Почему root не всесилен при SELinux enforcing?
- Где смотреть AVC denial?
- Чем AppArmor профиль отличается от chmod?

Следующий урок: [12. Audit review](12-audit-review.md).
