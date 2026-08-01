# 11. Hardening CIS-lite

## Intro: "the scanner found 200 critical" — where to start

A pentest or CIS benchmark produces a long list. Not everything applies to your host class (build agent vs bastion vs DB). **Hardening** is a deliberate **reduction of the attack surface**: fewer services, fewer open ports, stronger SSH, auditing, patches.

This chapter is **CIS-lite**: a practical baseline for the training **srv1**, not a full CIS Level 2.

## What you'll learn

- Principles: minimal services, least privilege, patch, audit.
- **SSH**: keys, disabling root, AllowUsers.
- Host-level **firewall**.
- The **filesystem** and permissions.
- **sysctl** hardening (overview).
- The link to lab 12 and the capstone.

---

## Baseline principles

| Principle | Practice |
|---------|----------|
| Minimal surface | only the needed packages (`apt`, images) |
| Least privilege | separate users, sudo whitelist |
| Defense in depth | cloud SG **and** ufw on the host |
| Audit | auditd, auth.log → SIEM |
| Patches | staging → prod, reboot window |

Document the **exceptions** ("port 8080 is open for legacy") — otherwise in a year no one remembers why.

---

## SSH

A fragment of `/etc/ssh/sshd_config` (check compatibility with your OpenSSH version):

```text
PermitRootLogin no
PasswordAuthentication no
PubkeyAuthentication yes
AllowUsers course deploy
MaxAuthTries 3
X11Forwarding no
AllowTcpForwarding no
```

After editing:

```bash
sudo sshd -t
sudo systemctl reload sshd
```

**Important:** keep a **second** SSH session until you've verified key-based login.

See [linux-intermediate: SSH](../linux-intermediate/README.md), [24-lab-sudo](../linux-intermediate/24-lab-sudo.md).

---

## Network and firewall

```bash
sudo ufw default deny incoming
sudo ufw default allow outgoing
sudo ufw allow OpenSSH
sudo ufw allow 80/tcp
sudo ufw enable
sudo ufw status verbose
```

See [linux-intermediate: firewall](../linux-intermediate/07-firewall.md).

---

## Accounts

```bash
sudo awk -F: '($2==""){print "EMPTY PASSWORD:", $0}' /etc/shadow
getent passwd | awk -F: '$3==0 {print}'
```

There should be no extra UID 0. Empty passwords are a critical fail.

---

## Filesystem

Where possible (careful with legacy apps):

```text
/tmp  nodev,nosuid,noexec
```

Permissions: configs **644**, scripts not world-writable, **no 777** on a share without ACL.

---

## sysctl (selective)

`/etc/sysctl.d/99-harden.conf`:

```text
net.ipv4.conf.all.rp_filter = 1
net.ipv4.conf.default.rp_filter = 1
kernel.kptr_restrict = 1
kernel.dmesg_restrict = 1
```

```bash
sudo sysctl -p /etc/sysctl.d/99-harden.conf
```

The full list — the CIS benchmark or your security team.

---

## Automatic updates

`unattended-upgrades` on Ubuntu — only after testing in staging. Reboot required — plan for it.

---

## Common mistakes

| Mistake | Risk |
|--------|------|
| ufw enable without allow 22 | lockout |
| PasswordAuthentication no without a key | lockout |
| hardening without documentation | breaks CI/deploy |
| scanner only, no remediation | a false sense of security |

---

## In production

An Ansible role `hardening` + exceptions via group_vars. Immutable infrastructure (AMI rebuild) vs drift on long-lived VMs. Alignment with compliance (PCI, SOC2).

---

## Summary

Hardening — **baseline + documented exceptions**. SSH + ufw + users + audit is the core for srv1. Verify it in [lab 12](12-lab-hardening.md) and the [capstone](28-final-project.md).

## Checklist

- [ ] The 5 items of your baseline for srv1?
- [ ] Why is root login over SSH disabled?
- [ ] What to check before `ufw enable`?
- [ ] Where to keep the list of open ports and why?

Next lesson: [12. Lab: baseline](12-lab-hardening.md).
