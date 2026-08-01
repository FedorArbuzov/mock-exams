# 13. fail2ban

## Intro: thousands of Failed password entries in auth.log

Scanners brute-force SSH 24/7. Passwords are disabled — good, but the load on sshd and the log noise remain. **fail2ban** reads logs (sshd, nginx), counts failures and adds a **DROP** to the firewall for the offending IP.

It is not a replacement for **keys** and not protection against a **distributed** brute force from 10,000 IPs — it's an additional layer for single-server and lab setups.

## What you'll learn

- Architecture: filter → jail → action (iptables/nft).
- The **jail.local** config for sshd.
- Checking ban/unban.
- Limitations and the link to **ufw**.

---

## How it works

```mermaid
flowchart LR
  logs[/var/log/auth.log]
  f2b[fail2ban]
  fw[iptables/nft f2b-sshd]
  logs --> f2b
  f2b --> fw
```

1. **filter** — regex on Failed password / Invalid user.
2. **jail** — maxretry, findtime, bantime.
3. **action** — insert a firewall rule.

```bash
sudo systemctl status fail2ban
sudo fail2ban-client status
sudo fail2ban-client status sshd
```

---

## sshd config

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

| Parameter | Meaning |
|----------|--------|
| maxretry | attempts before ban |
| findtime | window (sec) |
| bantime | ban duration (sec), -1 = permanent |

---

## Checking a ban

```bash
sudo fail2ban-client status sshd
sudo iptables -L f2b-sshd -n 2>/dev/null | head
sudo nft list ruleset 2>/dev/null | grep f2b | head
```

Unban:

```bash
sudo fail2ban-client set sshd unbanip 1.2.3.4
```

---

## Common mistakes

| Symptom | Cause |
|---------|---------|
| jail doesn't trigger | wrong logpath (journal only) |
| banning yourself | testing from a lab IP, whitelist ignoreip |
| conflict with ufw | nftables/iptables backend |
| IPv6 only | separate jail sshd-ipv6 |

**ignoreip** in a jail:

```ini
ignoreip = 127.0.0.1/8 172.28.0.0/24
```

---

## Limitations

- Distributed brute force — needs a **rate limit** on the LB, WAF, geo block.
- **PasswordAuthentication no** matters more than fail2ban.
- Don't ban a corporate NAT without ignoreip.

---

## In production

Centralized auth, 2FA on the bastion, CrowdSec as an alternative. fail2ban — on edge VMs and legacy.

---

## Summary

fail2ban — automatic banning based on logs. Configure **jail.local**, **ignoreip**, check **status sshd**. SSH keys matter more.

## Checklist

- [ ] How does fail2ban learn about failed logins?
- [ ] How do you unban an IP?
- [ ] Why ignoreip for the lab network?

Next lesson: [14. Lab: fail2ban](14-lab-fail2ban.md).
