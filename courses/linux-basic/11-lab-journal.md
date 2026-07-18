# 11. Лаба: journalctl

## Стенд

`docker compose exec lab bash`

---

## Задание 1. Общий обзор

```bash
journalctl --disk-usage
journalctl -n 20 --no-pager
journalctl -p warning -b --no-pager | tail -15
```

---

## Задание 2. Unit ssh (или cron)

```bash
journalctl -u ssh --no-pager -n 30
```

Если пусто — возьмите `systemd-journald` или unit из прошлой лабы `lab-hello`.

---

## Задание 3. Окно времени

```bash
journalctl --since "10 min ago" --no-pager | tail -20
```

---

## Задание 4. Follow (5 секунд)

В одном терминале:

```bash
journalctl -f
```

В другом (или после Ctrl+C) сгенерируйте событие:

```bash
logger "linux-basic journal lab test"
```

**Что увидите:** строку с вашим сообщением.

---

## Задание 5. Сравнение с файлом

```bash
ls -la /var/log/syslog 2>/dev/null || ls -la /var/log/
```

---

## Критерии успеха

- [ ] `journalctl --disk-usage` выполнен
- [ ] Фильтр по unit или приоритету показал строки
- [ ] `logger` виден в journal

Следующий урок: [12. cron](12-scheduling.md).
