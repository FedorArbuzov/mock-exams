# 13. Лаба: security audit report

**Стенд:** [`deploy/linux`](../../deploy/linux/README.md).

## Задание 1. Сбор данных с srv1

На lab выполните и сохраните вывод:

```bash
ssh course@172.28.0.11 'hostname; sudo ufw status; sudo ss -tlnp; sudo sshd -T 2>/dev/null | grep -i permitroot' > /tmp/srv1-audit-raw.txt
cat /tmp/srv1-audit-raw.txt
```

## Задание 2. Отчёт

Создайте `/home/course/security-audit-srv1.md`:

```markdown
# Security audit: srv1 (172.28.0.11)
Date: YYYY-MM-DD
Auditor: your name

## Executive summary
One paragraph: overall posture (acceptable / needs work).

## Scope
- Host: srv1, Ubuntu lab container
- In scope: SSH, firewall, users, listening ports
- Out of scope: physical DC, K8s cluster

## Findings

### F-01: [Title]
- Severity: High | Medium | Low
- Evidence: command output or config line
- Impact: what attacker can do
- Recommendation: specific fix
- Status: Open | Fixed

### F-02: ...

## Positive controls
- ufw enabled
- ...

## Next steps
1. ...
```

Минимум **3 findings** (реальные или учебные с честным remediation).

## Задание 3. Peer review

Попросите коллегу (или проверьте сами через 24ч): одно finding закрыто — обновите Status.

## Критерии успеха

- [ ] Отчёт ≥ 3 findings с severity
- [ ] Есть evidence и recommendation
- [ ] raw данные сохранены

Следующий урок: [14. Финальный проект](14-final-project.md).
