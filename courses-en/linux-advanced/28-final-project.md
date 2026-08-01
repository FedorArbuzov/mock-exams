# 28. Capstone: a production-like host

## Intro: build srv1 "as if ready to go live"

The finale of **linux-advanced** is not a new topic but the **integration** of all the labs: hardening, audit, fail2ban, nginx, deploy user, runbook, node prep check. The result is a host you can **hand off** to a colleague via `HANDOFF.md`.

**Time:** 3–5 hours.

## Goal

Prepare **srv1** (172.28.0.11) as a production-like application server with documentation and verifiable criteria.

---

## Requirements

| # | Requirement | Lessons |
|---|------------|--------|
| 1 | Hardening SSH + **ufw** (allow 22, 80) | 11–12 |
| 2 | **auditd** rule on `/etc/sudoers.d/` | 09–10 |
| 3 | **fail2ban** jail sshd + ignoreip 172.28.0.0/24 | 13–14 |
| 4 | **nginx** active + a test page or default | intermediate 13 |
| 5 | `verify-node.sh` without critical failures | 07–08 |
| 6 | The **disk-full** runbook in `/home/course/runbooks/` | 24 |
| 7 | A **deploy** user + nginx sudo whitelist | 26 |
| 8 | **`HANDOFF.md`** on srv1 or in the repo: IP, ports, health check | — |

---

## Step-by-step plan

### 1. Baseline and hardening

```bash
ssh course@172.28.0.11
# checklist from 12-lab-hardening
sudo ufw status
grep PermitRootLogin /etc/ssh/sshd_config
```

### 2. auditd on sudoers.d

```bash
echo '-w /etc/sudoers.d/ -p wa -k sudoers_d' | sudo tee /etc/audit/rules.d/99-capstone.rules
sudo augenrules --load 2>/dev/null
sudo touch /etc/sudoers.d/capstone-test
sudo ausearch -k sudoers_d | tail -5
```

### 3. fail2ban

Check [14-lab-fail2ban](14-lab-fail2ban.md).

### 4. deploy user

```bash
sudo useradd -m deploy 2>/dev/null || true
sudo install -d -m 700 -o deploy -g deploy /home/deploy/.ssh
# add the CI or lab public key
sudo visudo -f /etc/sudoers.d/deploy-nginx
# deploy ALL=(root) NOPASSWD: /usr/bin/systemctl reload nginx, /usr/bin/systemctl restart nginx, /usr/bin/nginx -t
```

### 5. nginx and health

```bash
curl -s -o /dev/null -w '%{http_code}\n' http://127.0.0.1/
```

### 6. Runbook

Copy or create `/home/course/runbooks/disk-full.md` per [24-runbook-lab](24-runbook-lab.md).

### 7. HANDOFF.md

Example structure:

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

## Verification (acceptance)

From **lab**:

```bash
bash courses/linux-advanced/examples/verify-node.sh
ssh -o BatchMode=yes course@172.28.0.11 'systemctl is-active nginx fail2ban auditd'
curl -s -o /dev/null -w 'http=%{http_code}\n' http://172.28.0.11/
ssh deploy@172.28.0.11 'sudo nginx -t'   # if the key is configured
test -f /home/course/runbooks/disk-full.md && echo runbook OK
```

| Check | Expectation |
|----------|----------|
| verify-node | OK / swap off |
| curl :80 | 200 |
| auditd | active, ausearch works |
| ufw | active |
| HANDOFF | exists, up to date |

---

## Optional (+)

- keepalived VIP from [16-lab](16-lab-keepalived.md)
- LimitNOFILE nginx [20-lab](20-lab-limits.md)
- An Ansible playbook instead of manual steps [18](18-ansible-hooks.md)

---

## Self-check (checklist)

- [ ] I can explain why each of the 8 requirements exists
- [ ] There's a second way to get into srv1 (console) if SSH is broken
- [ ] Secrets are not in git
- [ ] `/root/hardening-done.txt` or a HANDOFF with a date

---

## Next

- [kuber-intermediate](../kuber-intermediate/README.md) — workloads on mockctl
- [linux-security](../linux-security/README.md) — AIDE, SELinux, deeper dive
- [mock-ckad](../mock-ckad/README.md) — the exam format

---

## Summary

The capstone is the **assembly** of advanced skills on a single host with **documentation**. Quality = verifiable commands + HANDOFF, not "seems configured".
