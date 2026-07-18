# 12. cron, at, systemd timers

## Зачем планировщик на сервере

Бэкапы, ротация логов, отчёты, очистка `/tmp` — всё это **по расписанию**. В Linux три привычных механизма: **cron** (классика), **at** (один раз «потом»), **systemd timer** (интеграция с unit, зависимости, jitter).

В финальном проекте basic вы уже положите cron на srv1; в intermediate сравните с timer для тех же задач.

## cron — пять полей и команда

```bash
crontab -l
crontab -e
sudo crontab -u root -l
```

Формат:

```text
# мин  час  день_мес  месяц  день_нед  команда
*/5  *    *         *       *         /usr/local/bin/check.sh
```

| Поле | Диапазон |
|------|----------|
| минута | 0–59 |
| час | 0–23 |
| день месяца | 1–31 |
| месяц | 1–12 |
| день недели | 0–7 (0 и 7 = воскресенье) |

Примеры:

```text
0 2 * * *       ежедневно в 02:00
0 */6 * * *     каждые 6 часов
30 4 * * 1      понедельник 04:30
```

Системные файлы: `/etc/crontab`, `/etc/cron.d/*`, `/etc/cron.{hourly,daily,...}/`.

**Важно:** в crontab **минимальное окружение** — нет вашего `.bashrc`. Пишите полные пути (`/usr/bin/tar`) и при необходимости `PATH=` в начале файла.

Логи:

```bash
grep CRON /var/log/syslog 2>/dev/null
journalctl -u cron --no-pager -n 20
```

## at — однократно

```bash
echo "echo done > /tmp/at-demo" | at now + 5 minutes
atq
atrm 1    # номер из atq
```

Удобно отложить тяжёлую задачу «когда ночь», без правки crontab.

## systemd timers

```bash
systemctl list-timers --all | head
systemctl status apt-daily.timer
```

Timer активирует **service** unit. Плюсы: `OnCalendar`, `RandomizedDelaySec` (не все job в 00:00), зависимости `After=network-online.target`, логи в journal.

## Что выбрать

| Сценарий | Инструмент |
|----------|------------|
| Простой shell-скрипт раз в ночь | cron |
| «Запусти через час один раз» | at |
| Задача рядом с systemd-сервисом | timer |

## Чек-лист

- Расшифруйте `0 */6 * * *`
- Почему cron-скрипт «не находит python»?
- Где лежит crontab пользователя course?

Следующий урок: [12. Лаба: cron](12-lab-cron.md).
