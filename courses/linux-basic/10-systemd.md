# 10. systemd: units, targets, зависимости

## Почему это центр современного Linux

Раньше сервисы поднимались скриптами в `/etc/init.d`. Сейчас **systemd** — и init (PID 1 в контейнере/VM), и менеджер сервисов, и таймеры, и часть сети. Вы будете постоянно делать:

```bash
systemctl status nginx
systemctl restart myapp
journalctl -u myapp
```

Если сервис «не стартует» — смотрите `status` и `journalctl`, а не перезагружайте машину по привычке.

## Базовые команды

```bash
systemctl status ssh
systemctl is-active ssh
systemctl is-enabled ssh
sudo systemctl start nginx
sudo systemctl stop nginx
sudo systemctl restart nginx
sudo systemctl reload nginx      # если поддерживает (перечитать конфиг)
sudo systemctl enable nginx      # автозапуск
sudo systemctl disable nginx
sudo systemctl daemon-reload     # после правки unit-файлов
```

| Команда | Смысл |
|---------|--------|
| `start` / `stop` | разовый запуск/остановка |
| `restart` | stop + start |
| `reload` | мягко перечитать конфиг (не все сервисы) |
| `enable` | symlink в target при boot |
| `daemon-reload` | перечитать unit-файлы с диска |

## Типы unit

| Суффикс | Пример | Назначение |
|---------|--------|------------|
| `.service` | nginx.service | демон или приложение |
| `.socket` | docker.socket | активация по сокету |
| `.timer` | apt-daily.timer | расписание (аналог cron) |
| `.target` | multi-user.target | группа units (уровень загрузки) |
| `.mount` | mnt-data.mount | точка монтирования |

```bash
systemctl list-units --type=service --state=running | head
systemctl get-default
```

## Где лежат unit-файлы

| Каталог | Кто пишет |
|---------|---------|
| `/usr/lib/systemd/system/` | пакеты (apt) |
| `/etc/systemd/system/` | админ, override |

**Свой** unit кладите в `/etc/systemd/system/`, чтобы обновление пакета не затёрло файл.

Пример простого сервиса:

```ini
[Unit]
Description=Lab demo app
After=network.target

[Service]
Type=simple
ExecStart=/usr/local/bin/lab-app.sh
Restart=on-failure
User=course

[Install]
WantedBy=multi-user.target
```

| Секция | Важные поля |
|--------|-------------|
| Unit | `Description`, `After`, `Requires`, `Wants` |
| Service | `ExecStart`, `Type`, `User`, `Restart`, `Environment` |
| Install | `WantedBy` — в какой target включать |

**Type=oneshot** — команда выполнилась и завершилась (скрипт миграции). **Type=simple** — долгоживущий процесс (по умолчанию для многих демонов).

После правки:

```bash
sudo systemctl daemon-reload
sudo systemctl enable --now lab-app.service
```

## Targets — «уровни загрузки»

| Target | Обычно |
|--------|--------|
| multi-user.target | сервер без GUI |
| graphical.target | рабочая станция с GUI |

`systemctl isolate multi-user.target` — осторожно на desktop.

## Зависимости — не путать After и Requires

- `After=network.target` — запускать **позже** (порядок), сеть может быть ещё «не готова».
- `Requires=network-online.target` — жёсткая зависимость; падение зависимости остановит unit.
- `Wants=` — мягкая зависимость.

В Docker-лабе сеть «есть» быстро; на железе `network-online` важен для NFS и кластеров.

## Пример в репозитории

[examples/systemd/lab-hello.service](examples/systemd/lab-hello.service) — oneshot для лабы 10.

## Чек-лист

- Зачем `daemon-reload` после правки unit?
- Чем `reload` nginx отличается от `restart`?
- Куда положить свой unit, чтобы apt его не перезаписал?

Следующий урок: [10. Лаба: systemd](10-lab-systemd.md).
