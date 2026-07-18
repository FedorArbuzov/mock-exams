# 14. Лаба: fail2ban

## Цель лабы

Установить **fail2ban** на srv1, включить jail **sshd** с **ignoreip** для учебной сети, проверить статус — без намеренного бана своего IP.

## Предварительно

- [13. fail2ban](13-fail2ban.md).
- SSH на srv1 работает.

```bash
ssh course@172.28.0.11
```

---

## Задание 1. Установка

```bash
sudo apt update
sudo apt install -y fail2ban
sudo systemctl enable --now fail2ban
systemctl is-active fail2ban
```

---

## Задание 2. jail.local

**Зачем:** ignoreip защищает lab (172.28.0.0/24) от случайного ban при тестах.

```bash
sudo tee /etc/fail2ban/jail.local <<'EOF'
[DEFAULT]
ignoreip = 127.0.0.1/8 172.28.0.0/24

[sshd]
enabled = true
maxretry = 3
findtime = 600
bantime = 600
EOF
sudo systemctl restart fail2ban
```

---

## Задание 3. Статус

```bash
sudo fail2ban-client status
sudo fail2ban-client status sshd
```

**Что увидите:** `Jail list: sshd`, Currently failed: 0 (или счётчик).

---

## Задание 4. Фильтр и лог (обзор)

```bash
sudo fail2ban-client get sshd logpath
sudo tail -3 /var/log/auth.log
```

---

## Задание 5. Тест ban (опционально, осторожно)

**Только** с IP **вне** ignoreip или в изолированной VM:

```bash
# НЕ с 172.28.0.10 если он в ignoreip
# fail2ban-client status sshd  # смотреть Banned IP list
```

На учебном srv1 **пропустите** реальный brute force — достаточно status.

---

## Критерии успеха

- [ ] fail2ban active
- [ ] jail sshd enabled в status
- [ ] ignoreip содержит 172.28.0.0/24
- [ ] SSH с lab после настройки работает

## Что унести в работу

- Перед тестом ban — проверьте ignoreip.
- Capstone требует fail2ban на srv1.
- При journal-only sshd — настройте backend/logpath под вашу ОС.

Следующий урок: [15. keepalived](15-keepalived.md).
