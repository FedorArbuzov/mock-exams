# 09. auditd

## Intro: "who changed sshd_config — nothing in syslog"

After an incident, they ask: who edited `/etc/ssh/sshd_config` at 02:00? **rsyslog** may have rotated, the application didn't log it, and root won't admit it. **auditd** writes events to a **separate** log per rules of the **Linux kernel audit** — harder to "cover your tracks" than simply deleting a line in a text log.

It's not a SIEM replacement and not antivirus — it's an **additional** layer for critical paths: passwd, sudoers, sshd, kernel modules.

## What you'll learn

- How **auditd** differs from journal/rsyslog.
- **auditctl** rules and `/etc/audit/rules.d/`.
- The **-w**, **-p**, **-k** keys and searching with **ausearch**.
- Persistent rules via **augenrules**.
- Limitations and disk load.

---

## auditd vs journal

| | journald | auditd |
|---|----------|--------|
| Source | systemd, services | **kernel audit** |
| Typically | unit logs, sshd | file changes, syscalls (per rule) |
| Tampering | deleting journal files | needs root + disabling audit |
| Config | unit, rsyslog | `/etc/audit/`, rules.d |

```bash
sudo systemctl status auditd
sudo auditctl -l
```

---

## A file rule (watch)

```bash
sudo auditctl -w /etc/ssh/sshd_config -p wa -k sshd_config_change
```

| Key | Meaning |
|------|--------|
| `-w PATH` | watch a path |
| `-p wa` | **w**rite, **a**ttribute change (permissions, owner) |
| `-k KEY` | a label in the log for searching |

Other masks: `r` read, `x` execute, `a` append.

**Persistent** (survives reboot):

```bash
echo '-w /etc/ssh/sshd_config -p wa -k sshd_cfg' | sudo tee /etc/audit/rules.d/99-lab.rules
sudo augenrules --load
# or on older systems:
sudo auditctl -R /etc/audit/rules.d/99-lab.rules
sudo auditctl -l | grep sshd
```

---

## Searching events

```bash
sudo ausearch -k sshd_cfg -ts recent
sudo ausearch -f /etc/ssh/sshd_config
sudo aureport -ts today
sudo aureport -f
```

Typical fields: `type=PATH`, `name=`, `pid=`, `uid=`, `comm=`.

---

## What else is audited in prod

| Path / event | Why |
|----------------|--------|
| `/etc/passwd`, `/etc/shadow` | accounts |
| `/etc/sudoers`, `/etc/sudoers.d/` | privilege |
| `insmod` / module load | rootkit |
| `execve` for `/usr/bin/passwd` | password change |

Rules are a balance: too broad an audit → a **full disk** and CPU.

---

## Common mistakes

| Symptom | Cause |
|---------|---------|
| ausearch empty | rule not loaded, wrong key |
| auditd won't start | broken rules.d |
| disk 100% | `/var/log/audit` without rotation |
| duplicates with syslog | normal; different targets |

**rotation:** `/etc/audit/auditd.conf` — `max_log_file`, `num_logs`.

---

## In production

Ship to a SIEM (Splunk, Elastic) via an agent. Immutable audit on compliance hosts. Test rules on staging before a mass rollout.

Related: [linux-security](../linux-security/README.md).

---

## Summary

**auditd** — a kernel policy for critical files and events. **ausearch -k** — a fast search. Rules in **rules.d**, loading via **augenrules**. Plan for rotation and volume.

## Checklist

- [ ] How does auditd differ from journal?
- [ ] What does `-p wa` mean?
- [ ] Where do you search events by key?
- [ ] How do you make a rule persistent?

Next lesson: [10. Lab: audit](10-lab-auditd.md).
