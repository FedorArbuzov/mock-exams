# 22. Лаба: rsyslog

## Цель лабы

Создать правило **programname → отдельный файл**, проверить доставку через **logger**, увидеть запись в **journal** и осознанно убрать правило. Это тот же паттерн, что для «выделить логи своего демона» на staging.

## Предварительно

- [21. rsyslog](21-rsyslog.md).
- lab, sudo.

```bash
docker compose exec lab bash
systemctl is-active rsyslog
sudo apt install -y rsyslog 2>/dev/null
```

---

## Подготовка стенда

```bash
systemctl status rsyslog --no-pager | head -8
ls -la /var/log/syslog /var/log/auth.log 2>/dev/null | head -3
ls /etc/rsyslog.d/
```

**Если rsyslog inactive:** `sudo systemctl enable --now rsyslog`.

---

## Задание 1. Исходное состояние

**Зачем:** убедиться, что syslog вообще пишется.

```bash
logger "baseline before myapp rule"
sudo tail -2 /var/log/syslog
```

Запишите время последней строки.

---

## Задание 2. Правило myapp

**Зачем:** изолировать логи «приложения» от общего syslog.

```bash
sudo tee /etc/rsyslog.d/50-myapp.conf <<'EOF'
if $programname == "myapp" then /var/log/myapp.log
& stop
EOF
sudo systemctl restart rsyslog
systemctl is-active rsyslog
```

**Проверка синтаксиса (если есть):**

```bash
sudo rsyslogd -N1 2>&1 | tail -5
```

**Если restart failed:** `journalctl -u rsyslog -n 20` — часто опечатка в conf.

---

## Задание 3. Первая запись

```bash
logger -t myapp "rsyslog lab message one"
sleep 1
sudo cat /var/log/myapp.log
```

**Что увидите:** строка с `rsyslog lab message one`, hostname, timestamp.

**Если файл не создался:**

```bash
ls -la /var/log/myapp.log
sudo tail -5 /var/log/syslog | grep myapp
```

- есть в syslog, нет файла → опечатка `programname` или правило не подхватилось;
- нигде нет → logger не дошёл до rsyslog.

---

## Задание 4. journal

```bash
journalctl -t myapp --no-pager -n 8
```

Сообщение может быть **и** в journal — это нормально (journald видит до или параллельно rsyslog).

---

## Задание 5. Второе сообщение и счётчик

```bash
logger -t myapp "message two"
logger -t myapp -p local0.warning "warning level test"
sudo wc -l /var/log/myapp.log
sudo tail -5 /var/log/myapp.log
```

**Зачем:** убедиться, что правило стабильно работает.

---

## Задание 6. Нет дубля в syslog (проверка & stop)

```bash
logger -t myapp "duplicate check"
sudo grep myapp /var/log/syslog | tail -3
```

**Ожидание:** после настройки `& stop` новые строки **не** должны сыпаться в syslog (старые могли остаться до правила).

Если дубли есть — перечитайте [теорию](21-rsyslog.md) про `& stop`.

---

## Задание 7. Чужой programname

```bash
logger -t otherapp "should not go to myapp.log"
sudo tail -1 /var/log/myapp.log
```

**Ожидание:** в myapp.log только свои сообщения.

---

## Уборка

```bash
sudo rm -f /etc/rsyslog.d/50-myapp.conf /var/log/myapp.log
sudo systemctl restart rsyslog
ls /var/log/myapp.log 2>&1
```

---

## Критерии успеха

- [ ] `/var/log/myapp.log` создан и содержит тестовые строки
- [ ] `journalctl -t myapp` видит события
- [ ] Понимаете роль `& stop`
- [ ] Уборка: conf и файл удалены, rsyslog active

## Что унести в работу

- Новый демон без своего файла — добавьте rsyslog rule + logrotate.
- Перед remote logging — сначала стабильный локальный файл.
- Инцидент «логов нет» — journal vs file vs programname.

Следующий урок: [23. sudo](23-sudo.md).
