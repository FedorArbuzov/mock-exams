# 11. journalctl и журнал systemd

## Зачем journal, если есть /var/log

Раньше каждый демон писал в свой файл, форматы разные, ротация своя. **systemd-journald** собирает сообщения ядра, stdout/stderr сервисов и syslog в **одном** бинарном журнале с метаданными: unit, PID, приоритет, boot id.

На современном Ubuntu вы почти всегда начинаете с:

```bash
journalctl -u nginx -n 50 --no-pager
```

Файлы в `/var/log/nginx/` могут дублировать то же — но при «сервис не стартует» journal покажет stderr процесса сразу после `systemctl start`.

## Где лежит журнал

- Постоянно: `/var/log/journal/` (если включено хранение)
- Volatile: `/run/log/journal/` (пропадёт после reboot)

Размер:

```bash
journalctl --disk-usage
```

## journalctl — шпаргалка

```bash
journalctl -xe              # последние ошибки, подсказки
journalctl -f               # follow
journalctl -u ssh
journalctl -u nginx --since "1 hour ago"
journalctl -p err -b
journalctl -b -1            # предыдущая загрузка
journalctl -n 100 --no-pager
```

| Ключ | Эффект |
|------|--------|
| `-u UNIT` | логи unit (`.service` можно опустить) |
| `-f` | как `tail -f` |
| `-b` | текущая загрузка |
| `--since` / `--until` | окно времени |
| `-p warning` | от warning и «хуже» |
| `--no-pager` | сразу в stdout (скрипты, CI) |

## Приоритеты

| Имя | Число | Когда |
|-----|-------|--------|
| emerg … err | 0–3 | пожар |
| warning, notice | 4–5 | деградация |
| info, debug | 6–7 | шум |

В проде для поиска инцидента: `-p err` или `-p warning`.

## Классические логи — не исчезли

```bash
ls -la /var/log/
tail -20 /var/log/auth.log
tail -20 /var/log/nginx/error.log
```

rsyslog/nginx/apache часто **дублируют**. В intermediate настроите централизацию ([rsyslog](../linux-intermediate/21-rsyslog.md)).

## Ограничить рост journal

`/etc/systemd/journald.conf`:

```ini
[Journal]
SystemMaxUse=500M
RuntimeMaxUse=100M
```

```bash
sudo systemctl restart systemd-journald
```

Иначе полный диск из-за journal — частый сюрприз на маленьких VM.

## Чек-лист

- Как посмотреть логи ssh за последний час?
- Чем `-f` отличается от разового вывода?
- Где проверить, сколько места съел journal?

Следующий урок: [11. Лаба: journal](11-lab-journal.md).
