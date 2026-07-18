# 14. Финальный проект: hardened srv1

## Цель

Применить **весь** курс `linux-security` на **srv1** и сдать отчёт + демонстрацию.

## Обязательные контроли

| # | Контроль | Проверка |
|---|----------|----------|
| 1 | SSH: PermitRootLogin no, MaxAuthTries 3 | `sshd -T` |
| 2 | SSH: вход по ключу с lab | `ssh -i key deploy@...` |
| 3 | ufw: deny in, allow 22,80,(443) | `ufw status` |
| 4 | fail2ban jail sshd | `fail2ban-client status sshd` |
| 5 | auditd на sudoers или sshd_config | `ausearch` |
| 6 | Секреты: нет 644 .env в /home | `find` |
| 7 | PKI: self-signed HTTPS **или** документ почему нет | `curl -k` |
| 8 | Отчёт `security-audit-srv1.md` | ≥ 5 findings |

## Демонстрация (с lab)

```bash
# 1. порты
nmap -p 22,80,443,3306,5432 172.28.0.11 2>/dev/null || ss -tln | grep 172.28

# 2. http
curl -s -o /dev/null -w '%{http_code}\n' http://172.28.0.11/

# 3. ssh hardening
ssh course@172.28.0.11 'sudo sshd -T | grep -Ei "permitroot|passwordauth"'

# 4. fail2ban
ssh course@172.28.0.11 'sudo fail2ban-client status sshd 2>/dev/null | head -5'
```

## HANDOFF.md

На srv1 `/home/deploy/HANDOFF.md`:

- IP, роли пользователей;
- как ротировать ключ CI;
- контакты on-call (учебные);
- ссылка на runbook disk-full из [linux-advanced](../linux-advanced/24-runbook-lab.md).

## Критерии сдачи

- [ ] Все 8 контролов выполнены или задокументировано исключение
- [ ] Отчёт приложен
- [ ] HANDOFF.md создан

## Дальше

- [kuber-advanced](../kuber-advanced/README.md) — CKS-lite
- [gitlab-advanced](../gitlab-advanced/README.md) — SAST, container scanning
