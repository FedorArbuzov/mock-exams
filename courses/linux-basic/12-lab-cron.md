# 12. Лаба: cron

## Стенд

`docker compose exec lab bash`

---

## Задание 1. Crontab пользователя

```bash
crontab -l 2>/dev/null || echo "(empty)"
( crontab -l 2>/dev/null; echo "* * * * * date >> /tmp/cron-lab.log" ) | crontab -
```

Подождите 2 минуты:

```bash
cat /tmp/cron-lab.log
```

**Что увидите:** несколько строк с датой.

---

## Задание 2. Системный cron.d

```bash
echo '* * * * * root echo system-cron >> /tmp/cron-system.log' | sudo tee /etc/cron.d/lab-demo
sudo chmod 644 /etc/cron.d/lab-demo
```

Через 1–2 минуты:

```bash
cat /tmp/cron-system.log
```

---

## Задание 3. Логи cron

```bash
grep CRON /var/log/syslog 2>/dev/null | tail -5
journalctl -u cron --no-pager -n 10 2>/dev/null
```

---

## Задание 4. Уборка

```bash
crontab -r
sudo rm -f /etc/cron.d/lab-demo
rm -f /tmp/cron-lab.log /tmp/cron-system.log
```

Верните интервал `* * * * *` на нормальный в проде — не оставляйте «каждую минуту» без нужды.

---

## Критерии успеха

- [ ] `/tmp/cron-lab.log` пополняется
- [ ] `/tmp/cron-system.log` создан через cron.d
- [ ] Crontab удалён после лабы

Следующий урок: [13. mount](13-storage-mount.md).
