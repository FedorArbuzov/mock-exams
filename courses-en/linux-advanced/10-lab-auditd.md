# 10. Lab: auditd

## Lab goal

Enable **auditd**, add a rule for **sshd_config**, trigger an event and find it via **ausearch** — a minimal forensic workflow on srv1.

## Prerequisites

- [09. auditd](09-auditd.md).
- srv1 reachable over SSH.

```bash
ssh course@172.28.0.11
sudo apt install -y auditd audispd-plugins 2>/dev/null
```

---

## Preparing the stand

```bash
sudo systemctl enable --now auditd
systemctl is-active auditd
sudo auditctl -l
```

**If inactive:** `journalctl -u auditd -n 20`.

---

## Task 1. Temporary rule (optional)

```bash
sudo auditctl -w /etc/ssh/sshd_config -p wa -k sshd_cfg_test
sudo auditctl -l | grep sshd
```

---

## Task 2. Persistent rule

```bash
echo '-w /etc/ssh/sshd_config -p wa -k sshd_cfg' | sudo tee /etc/audit/rules.d/99-lab.rules
sudo augenrules --load 2>/dev/null || sudo auditctl -R /etc/audit/rules.d/99-lab.rules
sudo auditctl -l | grep sshd
```

**What you'll see:** a watch line on sshd_config.

---

## Task 3. Trigger an event

```bash
sudo touch /etc/ssh/sshd_config
sleep 1
sudo ausearch -k sshd_cfg --interpret 2>/dev/null | tail -15
```

**What you'll see:** records with `type=PATH` or `type=SYSCALL`, uid, comm.

**If empty:**

```bash
sudo ausearch -f /etc/ssh/sshd_config | tail -10
sudo tail -5 /var/log/audit/audit.log
```

---

## Task 4. aureport

```bash
sudo aureport -ts today 2>/dev/null | head -20
sudo aureport -f 2>/dev/null | tail -10
```

---

## Task 5. Cleanup (optional)

```bash
sudo rm -f /etc/audit/rules.d/99-lab.rules
sudo augenrules --load 2>/dev/null
```

On the training srv1 you can keep the rule for the capstone.

---

## Success criteria

- [ ] auditd active
- [ ] `auditctl -l` shows the watch
- [ ] `ausearch` found the event after touch
- [ ] You understand the difference between rules.d and auditctl -w

## What to take to work

- Incident "who changed the config" → audit + git/Ansible backup.
- Before mass rules — test on one host and check the size of `/var/log/audit`.
- In the capstone — a rule on `/etc/sudoers.d/`.

Next lesson: [11. Hardening](11-hardening.md).
