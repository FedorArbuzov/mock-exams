# 13. fail2ban

## Введение: тысячи Failed password в auth.log

Сканеры брутфорсят SSH 24/7. Пароли отключены — хорошо, но нагрузка на sshd и шум в логах остаются. **fail2ban** читает логи (sshd, nginx), считает неудачи и добавляет **DROP** в firewall на IP нарушителя.

Это не замена **ключей** и не защита от **распределённого** брутфорса с 10 000 IP — дополнительный слой для single-server и lab.

## Что вы узнаете

- Архитектура: filter → jail → action (iptables/nft).
- Конфиг **jail.local** для sshd.
- Проверка ban/unban.
- Ограничения и связь с **ufw**.

---

## Как работает

```mermaid
flowchart LR
  logs[/var/log/auth.log]
  f2b[fail2ban]
  fw[iptables/nft f2b-sshd]
  logs --> f2b
  f2b --> fw
```

1. **filter** — regex на Failed password / Invalid user.
2. **jail** — maxretry, findtime, bantime.
3. **action** — вставить правило firewall.

```bash
sudo systemctl status fail2ban
sudo fail2ban-client status
sudo fail2ban-client status sshd
```

---

## Конфиг sshd

`/etc/fail2ban/jail.local`:

```ini
[sshd]
enabled = true
port = ssh
filter = sshd
logpath = /var/log/auth.log
maxretry = 3
findtime = 600
bantime = 3600
```

```bash
sudo systemctl restart fail2ban
sudo fail2ban-client status sshd
```

| Параметр | Смысл |
|----------|--------|
| maxretry | попыток до ban |
| findtime | окно (сек) |
| bantime | длительность ban (сек), -1 = permanent |

---

## Проверка ban

```bash
sudo fail2ban-client status sshd
sudo iptables -L f2b-sshd -n 2>/dev/null | head
sudo nft list ruleset 2>/dev/null | grep f2b | head
```

Разбан:

```bash
sudo fail2ban-client set sshd unbanip 1.2.3.4
```

---

## Типичные ошибки

| Симптом | Причина |
|---------|---------|
| jail не срабатывает | неверный logpath (journal only) |
| ban себя | тест с lab IP, whitelist ignoreip |
| конфликт ufw | backend nftables/iptables |
| только IPv6 | отдельный jail sshd-ipv6 |

**ignoreip** в jail:

```ini
ignoreip = 127.0.0.1/8 172.28.0.0/24
```

---

## Ограничения

- Distributed brute force — нужен **rate limit** на LB, WAF, geo block.
- **PasswordAuthentication no** важнее fail2ban.
- Не ban корпоративный NAT без ignoreip.

---

## В продакшене

Централизованный auth, 2FA на bastion, CrowdSec как альтернатива. fail2ban — на edge VM и legacy.

---

## Резюме

fail2ban — автоматический ban по логам. Настройте **jail.local**, **ignoreip**, проверьте **status sshd**. Ключи SSH важнее.

## Чек-лист

- [ ] Откуда fail2ban узнаёт о failed login?
- [ ] Как разбанить IP?
- [ ] Зачем ignoreip для lab сети?

Следующий урок: [14. Лаба: fail2ban](14-lab-fail2ban.md).
