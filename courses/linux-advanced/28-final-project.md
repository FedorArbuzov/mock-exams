# 28. Capstone: production-like хост

## Введение: собрать srv1 «как перед сдачей в эксплуатацию»

Финал **linux-advanced** — не новая тема, а **интеграция** всех лаб: hardening, audit, fail2ban, nginx, deploy user, runbook, проверка node prep. Результат — хост, который вы можете **передать** коллеге по `HANDOFF.md`.

**Время:** 3–5 часов.

## Цель

Подготовить **srv1** (172.28.0.11) как production-like application server с документацией и проверяемыми критериями.

---

## Требования

| # | Требование | Уроки |
|---|------------|--------|
| 1 | Hardening SSH + **ufw** (allow 22, 80) | 11–12 |
| 2 | **auditd** правило на `/etc/sudoers.d/` | 09–10 |
| 3 | **fail2ban** jail sshd + ignoreip 172.28.0.0/24 | 13–14 |
| 4 | **nginx** active + тестовая страница или default | intermediate 13 |
| 5 | `verify-node.sh` без критичных fail | 07–08 |
| 6 | Runbook **disk-full** в `/home/course/runbooks/` | 24 |
| 7 | Пользователь **deploy** + sudo whitelist nginx | 26 |
| 8 | **`HANDOFF.md`** на srv1 или в repo: IP, порты, health check | — |

---

## Пошаговый план

### 1. Baseline и hardening

```bash
ssh course@172.28.0.11
# чеклист из 12-lab-hardening
sudo ufw status
grep PermitRootLogin /etc/ssh/sshd_config
```

### 2. auditd на sudoers.d

```bash
echo '-w /etc/sudoers.d/ -p wa -k sudoers_d' | sudo tee /etc/audit/rules.d/99-capstone.rules
sudo augenrules --load 2>/dev/null
sudo touch /etc/sudoers.d/capstone-test
sudo ausearch -k sudoers_d | tail -5
```

### 3. fail2ban

Проверьте [14-lab-fail2ban](14-lab-fail2ban.md).

### 4. deploy user

```bash
sudo useradd -m deploy 2>/dev/null || true
sudo install -d -m 700 -o deploy -g deploy /home/deploy/.ssh
# добавьте public key CI или lab
sudo visudo -f /etc/sudoers.d/deploy-nginx
# deploy ALL=(root) NOPASSWD: /usr/bin/systemctl reload nginx, /usr/bin/systemctl restart nginx, /usr/bin/nginx -t
```

### 5. nginx и health

```bash
curl -s -o /dev/null -w '%{http_code}\n' http://127.0.0.1/
```

### 6. Runbook

Скопируйте или создайте `/home/course/runbooks/disk-full.md` по [24-runbook-lab](24-runbook-lab.md).

### 7. HANDOFF.md

Пример структуры:

```markdown
# srv1 handoff

- IP: 172.28.0.11
- SSH: course@ / deploy@ (key only)
- HTTP: :80 nginx
- Firewall: ufw deny incoming except 22,80
- Health: curl -f http://172.28.0.11/
- audit: key sudoers_d
- fail2ban: sshd, ignore 172.28.0.0/24
- On-call runbook: /home/course/runbooks/disk-full.md
- Last hardened: DATE
```

---

## Проверка (acceptance)

С **lab**:

```bash
bash courses/linux-advanced/examples/verify-node.sh
ssh -o BatchMode=yes course@172.28.0.11 'systemctl is-active nginx fail2ban auditd'
curl -s -o /dev/null -w 'http=%{http_code}\n' http://172.28.0.11/
ssh deploy@172.28.0.11 'sudo nginx -t'   # если ключ настроен
test -f /home/course/runbooks/disk-full.md && echo runbook OK
```

| Проверка | Ожидание |
|----------|----------|
| verify-node | OK / swap off |
| curl :80 | 200 |
| auditd | active, ausearch работает |
| ufw | active |
| HANDOFF | существует, актуален |

---

## Опционально (+)

- keepalived VIP с [16-lab](16-lab-keepalived.md)
- LimitNOFILE nginx [20-lab](20-lab-limits.md)
- Ansible playbook вместо ручных шагов [18](18-ansible-hooks.md)

---

## Самопроверка (чеклист)

- [ ] Могу объяснить, зачем каждый из 8 пунктов требований
- [ ] Есть второй способ зайти на srv1 (console), если SSH сломан
- [ ] Секреты не в git
- [ ] `/root/hardening-done.txt` или HANDOFF с датой

---

## Дальше

- [kuber-intermediate](../kuber-intermediate/README.md) — workload на mockctl
- [linux-security](../linux-security/README.md) — AIDE, SELinux, углубление
- [mock-ckad](../mock-ckad/README.md) — экзаменный формат

---

## Резюме

Capstone — **сборка** advanced навыков на одном хосте с **документацией**. Качество = проверяемые команды + HANDOFF, не «вроде настроил».
