# 14. Lab: fail2ban

## Lab goal

Install **fail2ban** on srv1, enable the **sshd** jail with **ignoreip** for the training network, and check the status — without deliberately banning your own IP.

## Prerequisites

- [13. fail2ban](13-fail2ban.md).
- SSH to srv1 works.

```bash
ssh course@172.28.0.11
```

---

## Task 1. Installation

```bash
sudo apt update
sudo apt install -y fail2ban
sudo systemctl enable --now fail2ban
systemctl is-active fail2ban
```

---

## Task 2. jail.local

**Why:** ignoreip protects lab (172.28.0.0/24) from an accidental ban during tests.

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

## Task 3. Status

```bash
sudo fail2ban-client status
sudo fail2ban-client status sshd
```

**What you'll see:** `Jail list: sshd`, Currently failed: 0 (or a counter).

---

## Task 4. Filter and log (overview)

```bash
sudo fail2ban-client get sshd logpath
sudo tail -3 /var/log/auth.log
```

---

## Task 5. Ban test (optional, careful)

**Only** from an IP **outside** ignoreip or in an isolated VM:

```bash
# NOT from 172.28.0.10 if it is in ignoreip
# fail2ban-client status sshd  # look at Banned IP list
```

On the training srv1, **skip** a real brute force — status is enough.

---

## Success criteria

- [ ] fail2ban active
- [ ] jail sshd enabled in status
- [ ] ignoreip contains 172.28.0.0/24
- [ ] SSH from lab works after configuration

## What to take to work

- Before a ban test — check ignoreip.
- The capstone requires fail2ban on srv1.
- With journal-only sshd — configure the backend/logpath for your OS.

Next lesson: [15. keepalived](15-keepalived.md).
