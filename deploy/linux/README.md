# Linux lab stack (Docker)

Стенд для курсов `linux-basic`, `linux-intermediate`, `linux-advanced`, `linux-shell`, `linux-security`.

## Требования

- Docker Desktop или Docker Engine **4+ ГБ RAM** свободно
- Windows: WSL2 backend для Docker рекомендуется

## Запуск

```bash
cd deploy/linux
docker compose build
docker compose up -d
```

Проверка (подождите ~30–60 с после первого `up`):

```bash
docker compose ps
docker compose exec lab systemctl is-system-running || true
docker compose exec lab ping -c1 172.28.0.11
```

## Точка входа

```bash
docker compose exec lab bash
```

Внутри стенда:

| Хост | IP | Пользователь |
|------|-----|--------------|
| lab | 172.28.0.10 | course / course |
| srv1 | 172.28.0.11 | course / course |
| srv2 | 172.28.0.12 | course / course |
| web | 172.28.0.20 | course / course |
| dns | 172.28.0.53 | course / course |

SSH с `lab`:

```bash
ssh course@172.28.0.11
```

## Advanced overlay (keepalived)

```bash
docker compose -f docker-compose.yml -f docker-compose.advanced.yml up -d
```

## Сброс данных лаб

```bash
docker compose down -v
docker compose build --no-cache
docker compose up -d
```

## Ограничения Docker

| Тема | В стенде | Не в стенде |
|------|----------|-------------|
| systemd, ssh, cron, nginx | Да | — |
| LVM | loop-устройства в privileged-контейнере | Аппаратный RAID |
| Firewall | nftables/ufw в контейнере | Полный аналог ЦОД |
| RAID, PXE, BMC | Теория | [`bare-metal`](../../courses/bare-metal/README.md) |

## Troubleshooting

| Симптом | Решение |
|---------|---------|
| `systemd` в состоянии `degraded` | Нормально в контейнере; проверяйте конкретный unit: `systemctl status ssh` |
| SSH `Connection refused` | `docker compose exec srv1 systemctl start ssh` |
| Нет ping между контейнерами | `docker compose down && docker compose up -d` |
| Медленный первый build | Образ ~800 МБ пакетов; кэшируется |

Курсы: [`courses/linux-basic`](../../courses/linux-basic/README.md).
