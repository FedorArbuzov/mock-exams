# Скрипты linux-shell

Примеры для курса. Запускайте из корня репозитория или копируйте на lab.

## Скрипты

| Скрипт | Назначение | Пример |
|--------|------------|--------|
| `strict-demo.sh` | демо `set -euo pipefail` | `bash strict-demo.sh` |
| `healthcheck.sh` | HTTP + опционально SSH | `bash healthcheck.sh 172.28.0.20` |

## Финальный проект (добавьте сами)

| Скрипт | Назначение |
|--------|------------|
| `check-host.sh` | TCP, disk, load → key=value |
| `deploy-smoke.sh` | getopts, curl, systemctl |
| `log-report.sh` | journal + awk error/warn |

## Проверка качества

```bash
shellcheck courses/linux-shell/examples/bin/*.sh
bash courses/linux-shell/examples/bin/healthcheck.sh 172.28.0.20
echo "exit=$?"
```

## Стенд

[`deploy/linux`](../../../deploy/linux/README.md):

| Хост | IP |
|------|-----|
| lab | 172.28.0.10 |
| srv1 | 172.28.0.11 |
| web | 172.28.0.20 |

SSH: **course** / **course**

## Требования к новым скриптам

```bash
#!/usr/bin/env bash
set -euo pipefail
# functions + local
# usage() on bad args
# shellcheck clean
```

См. [16-final-project.md](../../16-final-project.md).
