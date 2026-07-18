# 10. Лаба: свой systemd unit

Создадите **oneshot**-сервис, который пишет строку в лог — зачаток `lab-app` из финального проекта.

## Стенд

`docker compose exec lab bash`, нужен sudo.

---

## Задание 1. Скрипт

```bash
sudo tee /usr/local/bin/lab-hello.sh <<'EOF'
#!/bin/bash
echo "$(date -Is) lab-hello executed" >> /var/log/lab-hello.log
EOF
sudo chmod +x /usr/local/bin/lab-hello.sh
```

---

## Задание 2. Unit-файл

```bash
sudo tee /etc/systemd/system/lab-hello.service <<'EOF'
[Unit]
Description=Lab hello oneshot
After=network.target

[Service]
Type=oneshot
ExecStart=/usr/local/bin/lab-hello.sh
RemainAfterExit=yes

[Install]
WantedBy=multi-user.target
EOF
```

---

## Задание 3. Запуск

```bash
sudo systemctl daemon-reload
sudo systemctl enable --now lab-hello.service
systemctl status lab-hello --no-pager
cat /var/log/lab-hello.log
```

**Что увидите:** `active (exited)` для oneshot и строка с датой в логе.

---

## Задание 4. Повторный запуск

```bash
sudo systemctl start lab-hello.service
tail -2 /var/log/lab-hello.log
```

---

## Задание 5. journal

```bash
journalctl -u lab-hello --no-pager -n 10
```

---

## Уборка (опционально)

```bash
sudo systemctl disable --now lab-hello.service
sudo rm /etc/systemd/system/lab-hello.service /usr/local/bin/lab-hello.sh
sudo systemctl daemon-reload
```

---

## Критерии успеха

- [ ] Unit в состоянии active/exited
- [ ] В `/var/log/lab-hello.log` минимум одна строка
- [ ] После `daemon-reload` ошибок нет

Следующий урок: [11. journal](11-journald.md).
