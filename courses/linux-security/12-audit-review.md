# 12. Security audit review

## Цель review

Перед сдачей srv1 в «псевдо-прод» — пройти **чеклист** и зафиксировать findings.

## Чеклист SSH

```bash
sshd -T | grep -E 'permitroot|passwordauth|pubkey|maxauth'
grep -r PermitRootLogin /etc/ssh/sshd_config.d/ /etc/ssh/sshd_config
```

## Чеклист пользователей

```bash
awk -F: '($2==""){print "empty password:", $1}' /etc/shadow
awk -F: '($3==0){print "uid0:", $1}' /etc/passwd
last -a | head
```

## Чеклист сети

```bash
ss -tlnp
sudo ufw status verbose
```

Закрыты ли лишние 0.0.0.0:* ?

## Чеклист SUID

```bash
find /usr -perm -4000 -type f 2>/dev/null
```

Каждый setuid — обоснование.

## Чеклист обновлений

```bash
apt list --upgradable 2>/dev/null | head
```

## Чеклист логов

```bash
sudo ausearch -ts today 2>/dev/null | tail
journalctl -p err -b --no-pager | tail
```

## Severity

| Уровень | Пример |
|---------|--------|
| Critical | root SSH, open Docker API |
| High | password auth on |
| Medium | no fail2ban |
| Low | missing banner |

## Шаблон finding

```markdown
### FINDING-01: PasswordAuthentication yes
- Severity: High
- Evidence: sshd -T
- Remediation: set to no after keys
- Status: open
```

Следующий урок: [13. Лаба: отчёт](13-lab-audit-report.md).
