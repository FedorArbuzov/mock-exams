# 08. apt и dpkg

## Пакетная система — как вы ставите софт на сервер

В облаке образ AMI/Ubuntu уже содержит базу. Дальше вы **не** качаете `.deb` с сайта руками (если только нет внутреннего mirror), а говорите менеджеру пакетов: «поставь nginx, зависимости подтяни сам». На Debian/Ubuntu это **apt**; внутри — **dpkg**, который реально распаковывает файлы в `/usr`, `/etc`, `/var`.

```text
вы → apt / apt-get  →  репозитории (HTTP)
         │                │
         └── зависимости,  dpkg → файлы на диске
             метаданные
```

В CI тот же принцип: `RUN apt-get update && apt-get install -y curl` в Dockerfile.

## apt — ежедневные команды

```bash
sudo apt update
apt search nginx
apt show nginx
sudo apt install -y tree jq
sudo apt remove tree
sudo apt purge nginx-common    # пакет + конфиги (осторожно)
sudo apt autoremove -y
sudo apt upgrade -y
```

| Команда | Когда использовать |
|---------|-------------------|
| `update` | обновить **индекс** (список версий), не ставит пакеты |
| `install` | установить и зависимости |
| `remove` | убрать бинарники, конфиги часто остаются |
| `purge` | удалить пакет и конфиги в `/etc` |
| `upgrade` | обновить уже установленные пакеты |
| `dist-upgrade` | может менять зависимости (major upgrades) |

**Типичная ошибка:** `apt install` без предшествующего `update` в свежем контейнере — «Unable to locate package».

## dpkg — когда apt уже не спасает

```bash
dpkg -l | grep nginx
dpkg -L nginx | head
dpkg -S /usr/sbin/nginx
```

Установка скачанного `.deb`:

```bash
sudo dpkg -i ./package.deb
sudo apt install -f    # дотянуть зависимости
```

Состояние `iU` / broken — почти всегда лечится `apt install -f`.

## Репозитории

Источники: `/etc/apt/sources.list` и `/etc/apt/sources.list.d/*.list`. После добавления PPA или internal mirror — снова `apt update`.

Проверка версий:

```bash
apt policy nginx
apt list --installed | grep nginx
```

Заморозка версии (осторожно с security):

```bash
sudo apt-mark hold nginx
sudo apt-mark unhold nginx
```

## RHEL-семейство — шпаргалка

| Debian/Ubuntu | RHEL/Rocky |
|---------------|------------|
| `apt install pkg` | `dnf install pkg` |
| `apt update` | `dnf makecache` |
| `dpkg -l` | `rpm -qa` |
| `dpkg -S file` | `rpm -qf file` |

Идея одна; в enterprise часто свой mirror и approval на обновления.

## Безопасность и эксплуатация

- Патчи безопасности — регулярный `upgrade` или unattended-upgrades.
- Не смешивайте ручную установку из tarball и пакеты в один путь без документации.
- Перед `purge` production-пакета — бэкап `/etc`.

## Чек-лист

- Зачем `apt update` не то же самое, что `upgrade`?
- Чем `remove` отличается от `purge`?
- Как узнать, какому пакету принадлежит `/usr/bin/curl`?

Следующий урок: [08. Лаба: apt](08-lab-packages.md).
