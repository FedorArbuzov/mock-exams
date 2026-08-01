# 23. sudo and sudoers

## Intro: "give me root on the server" — no

At a company the request "I need the root password for a deploy" is replaced by **sudo**: run **one** (or a whitelist of) command with elevated privileges, with an audit record. The policy is in `/etc/sudoers` and `/etc/sudoers.d/` — **who**, **as whom**, **which** binaries.

A single syntax error in sudoers can deprive **everyone** of sudo on the host — fixed via a serial console or a rescue volume.

## What you'll learn

- The basic commands `sudo`, `sudo -l`, `sudo -u`.
- The syntax of a sudoers line and **NOPASSWD**.
- **visudo** — the only safe way to edit.
- Where the audit is: **auth.log** / journal.
- **sudo** vs **su -** vs SSH as root.

---

## Basic usage

```bash
sudo whoami
sudo -u www-data id
sudo -l
sudo -v    # extend the timestamp
sudo -k    # reset cached credentials
```

| Command | Meaning |
|---------|--------|
| `sudo cmd` | cmd as root (by default) |
| `sudo -u www-data cmd` | cmd as www-data |
| `sudo -l` | what's allowed for **you** |
| `sudo -i` | a login shell as root — **rarely**, deliberately |

`-i` = a full root session; in prod a command whitelist is preferable.

---

## visudo — the only way

```bash
sudo visudo
sudo visudo -f /etc/sudoers.d/deploy-nginx
sudo visudo -c
sudo visudo -cf /etc/sudoers.d/
```

**Why not `vim /etc/sudoers`:** visudo prevents simultaneous editing and **checks the syntax** before saving.

Fragments in `/etc/sudoers.d/`:

- file permissions **0440** (`-r--r-----`);
- a name **without** `.` and special characters (some versions ignore such files).

---

## Breakdown of a sudoers line

```text
deploy  ALL=(ALL) NOPASSWD: /usr/bin/systemctl restart nginx, /usr/bin/nginx -t
```

| Field | Value |
|------|----------|
| `deploy` | the user (or `%group` for a group) |
| `ALL` | on any hosts (in LDAP sudo — a Host_Alias) |
| `(ALL)` | as any target user (often root) |
| `NOPASSWD:` | don't ask for a password — **only** for the listed commands |
| commands | **full paths** to the binaries |

The sudo group on Ubuntu (Debian):

```text
%sudo   ALL=(ALL:ALL) ALL
```

**NOPASSWD: ALL** — only break-glass or a lab VM; in prod = compromising one key = full root.

### Aliases (overview)

```text
Cmnd_Alias NGINX = /usr/bin/nginx -t, /usr/bin/systemctl restart nginx
deploy ALL=(root) NOPASSWD: NGINX
```

---

## Audit

```bash
grep sudo /var/log/auth.log | tail -10
journalctl -t sudo --no-pager -n 15
```

In an investigation: "who ran `systemctl restart nginx` at 03:14".

Lines like:

```text
sudo: course : TTY=pts/0 ; PWD=/home/course ; USER=root ; COMMAND=/usr/bin/systemctl restart nginx
```

---

## sudo vs su

| | sudo | su - |
|---|------|------|
| Command audit | yes, via the COMMAND line | weaker |
| Granularity | one command / whitelist | a full shell |
| Needs the root password | no (your own password) | often yes |
| Recommendation | operations | legacy |

`sudo -i` ≈ `su -` with your password — both give full root.

---

## Common mistakes

| Symptom | Cause |
|---------|---------|
| `sorry, you must have a tty to run sudo` | requiretty; cron/ansible without a PTY |
| `user is not in the sudoers file` | not in the group / file |
| `visudo: syntax error` | a broken sudoers — repair via the console |
| NOPASSWD doesn't work | another line overrides it; include order |
| allowed `EDITOR=vim` without restrictions | privilege escalation via sudoedit |

**Never** give `ALL=(ALL) NOPASSWD: ALL` to a deploy user in prod.

---

## In production

sudoers from **Ansible/Terraform**, code review. CI/CD — a separate technical user with a **minimal** whitelist. Roles: deploy, dba, oncall — different files in `sudoers.d/`. Centralized collection of auth.log.

In [lab 24](24-lab-sudo.md) you'll create a `deploy-nginx` fragment and check `visudo -c`.

---

## Summary

sudo — controlled privilege elevation with an audit. Edit only via **visudo**. A command whitelist instead of ALL. Read auth.log during incidents.

## Checklist

- [ ] Why visudo, not vim?
- [ ] How do you allow only `nginx -t` and `systemctl restart nginx`?
- [ ] Where do you look at who ran what?

Next lesson: [24. Lab: sudo](24-lab-sudo.md).
