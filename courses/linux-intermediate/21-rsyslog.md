# 21. rsyslog и централизация логов

## Введение: логи в десяти файлах и ноль в Loki

На сервере одновременно:

- **journalctl** — всё, что пишут unit'ы systemd;
- `/var/log/nginx/access.log` — веб;
- `/var/log/auth.log` — SSH и sudo;
- приложение пишет в `/opt/app/app.log` мимо syslog.

В инциденте вы теряете время, если не знаете **маршрут** сообщения: кто принял, куда положил, как долго хранится.

**rsyslog** — классический демон маршрутизации **syslog**: фильтры по facility/priority/programname → файл, remote host, discard.

На Ubuntu **systemd-journald** часть трафика **дублирует** в syslog (`ForwardToSyslog=yes`) — вы видите и `journalctl`, и `/var/log/syslog`.

## Что вы узнаете

- Разница **journal** vs **файлы** vs **rsyslog**.
- Структура `/etc/rsyslog.conf` и `/etc/rsyslog.d/`.
- Правило «programname → файл» и зачем `& stop`.
- Тест через **logger**.
- Концепт **centralized logging** (без открытия 514 в интернет).

---

## journal vs rsyslog vs файлы приложения

| Источник | Где смотреть | Когда удобно |
|----------|--------------|--------------|
| systemd units | `journalctl -u nginx` | статус сервиса, crash |
| классический syslog | `/var/log/syslog` | общий поток |
| auth | `/var/log/auth.log` | SSH, sudo |
| кастом по programname | `/var/log/myapp.log` | изоляция шума |

```bash
systemctl status rsyslog
ls -la /etc/rsyslog.d/
head -30 /etc/rsyslog.conf
```

**journalctl** хранит в бинарном journal (обычно `/var/log/journal`). **rsyslog** пишет текстовые файлы и умеет **forward** на collector.

```bash
journalctl -u ssh -n 5 --no-pager
grep -i ForwardToSyslog /etc/systemd/journald.conf 2>/dev/null
```

---

## Facility и priority (кратко)

Сообщение syslog несёт:

- **facility** — подсистема (auth, daemon, local0…);
- **priority** — severity (debug … emerg).

В правилах rsyslog: `auth.*`, `*.info`, `mail.err`.

`logger` позволяет подставить тег **programname**:

```bash
logger -t myapp -p local0.info "hello from lesson"
```

---

## Локальное правило (пример)

Файл `/etc/rsyslog.d/50-myapp.conf`:

```text
if $programname == 'myapp' then /var/log/myapp.log
& stop
```

| Часть | Смысл |
|-------|--------|
| `$programname == 'myapp'` | только сообщения с тегом `-t myapp` |
| `then /var/log/...` | записать в отдельный файл |
| `& stop` | **не** продолжать правила ниже (не дублировать в syslog) |

Применение:

```bash
sudo systemctl restart rsyslog
logger -t myapp "Test from lesson 21"
sleep 1
sudo tail -3 /var/log/myapp.log
sudo tail -3 /var/log/syslog | grep myapp || echo "no duplicate in syslog if stop works"
```

**Если файл пуст:** опечатка в имени (`myapp` vs `MyApp`), не сделали `restart rsyslog`, нет прав на `/var/log/myapp.log`.

---

## logrotate

Файлы растут. Пакеты кладут конфиги в `/etc/logrotate.d/`:

```bash
ls /etc/logrotate.d/nginx 2>/dev/null
cat /etc/logrotate.d/rsyslog 2>/dev/null | head -15
```

Без rotation диск заполняется — отдельный класс инцидентов.

---

## Remote logging (теория)

**Приёмник** (не включайте так в lab без TLS/VPN):

```text
module(load="imtcp")
input(type="imtcp" port="514")
```

**Отправитель:**

```text
*.* @@collector.example.com:514
```

`@@` — TCP, `@` — UDP. В проде: TLS, VPN, или агент (Vector, Fluent Bit) вместо голого 514.

Целевые системы: **Loki**, ELK, Splunk, CloudWatch — идея одна: **центральный поиск + retention**.

---

## Связь с DevOps

| Среда | Поток |
|-------|--------|
| VM | app → syslog/journal → rsyslog → file/remote |
| Docker | stdout/stderr → runtime → collector |
| K8s | container log → node agent → Loki/Elastic |

Структурированные логи (JSON), **correlation id**, маскирование PII — поверх транспорта.

---

## Типичные ошибки

| Симптом | Причина |
|---------|---------|
| Пустой myapp.log | programname, не restart |
| Дубли в syslog | забыли `& stop` |
| Диск полон | logrotate, огромный debug |
| «Логов нет» | смотрят файл, а пишут только в journal |
| Открыли 514 в интернет | спам, утечки |

---

## В продакшене

JSON logging, retention policy, доступ по RBAC. PII и секреты не в открытых логах. Алерт на **рост размера** `/var/log` и failed log shipping.

---

## Резюме

rsyslog **маршрутизирует** syslog. **logger -t** — быстрый тест. journal — для unit'ов. Централизация — отдельный pipeline с безопасным транспортом.

## Чек-лист

- [ ] Чем journal отличается от `/var/log/syslog`?
- [ ] Зачем `& stop` в правиле?
- [ ] Как проверить правило одной командой?

Следующий урок: [22. Лаба: rsyslog](22-lab-rsyslog.md).
