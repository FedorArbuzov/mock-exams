# Linux — Basic

Базовый курс Linux для DevOps: shell, пользователи, права, пакеты, **systemd**, диски, **LVM**, **SSH**, cron.

> Старт DevOps-маршрута: [`devops-path.md`](../devops-path.md). Дальше — [`linux-intermediate`](../linux-intermediate/README.md), параллельно [`gitlab-basic`](../gitlab-basic/README.md). Перед Kubernetes: [`containers-basic`](../containers-basic/README.md) (Dockerfile, compose, registry).

**Локально:** [`deploy/linux`](../../deploy/linux/README.md) — `docker compose up -d`.

## Программа

### Среда и основы

| # | Урок |
|---|------|
| 00 | [Окружение Docker-лаб](00-docker-lab-environment.md) |
| 01 | [Дистрибутивы и FHS](01-linux-landscape.md) |
| 02 | [Shell и перенаправление](02-shell-redirection.md) |
| 02 | [Лаба: shell](02-lab-shell.md) |
| 03 | [Пользователи и группы](03-users-groups.md) |
| 03 | [Лаба: пользователи](03-lab-users.md) |
| 04 | [Права rwx](04-permissions.md) |
| 04 | [Лаба: права](04-lab-permissions.md) |

### Файлы и пакеты

| 05–05 | find · лаба |
| 06–06 | grep/awk · лаба |
| 07–07 | vim · лаба |
| 08–08 | apt · лаба |

### Процессы и systemd

| 09–12 | processes, systemd, journal, cron (+ лабы) |

### Диски и доступ

| 13–16 | mount, LVM, tar/rsync, SSH (+ лабы) |

### Эксплуатация

| 17–17 | troubleshooting (+ лаба) |
| 18 | [Финальный проект](18-final-project.md) |

Файлы уроков: `00` … `18` в каталоге `courses/linux-basic/`.

## Что должно получиться

- Работаете в shell, управляете пользователями и правами
- Создаёте systemd unit, cron, читаете journal
- Монтируете тома, LVM на loop, копируете по SSH/rsync
- Собираете «мини-сервер» на srv1 (финал)

## Связь с курсами

| Курс | Связь |
|------|-------|
| `bare-metal` | RAID/BMC — теория после basic |
| `gitlab-basic` | shell для CI |
| `kuber-basic` | контейнеры поверх Linux |
| `linux-shell` | спец. после basic |
