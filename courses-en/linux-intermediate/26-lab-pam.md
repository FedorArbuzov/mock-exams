# 26. Lab: PAM (overview, no breakage)

## Lab goal

You **won't break** login on the server. You'll read how **sshd** and **sudo** go through PAM, look at **limits** and **faillock**, and connect it with the lines in **auth.log**. After the lab, the phrase "PAM blocked it" will be something concrete for you, not magic.

## Prerequisites

- The theory [25. PAM](25-pam.md).
- lab or srv1, a regular user + sudo.
- **Don't edit** `/etc/pam.d/*` in this lab.

---

## Environment setup

```bash
whoami
ls /etc/pam.d/ | wc -l
grep '^auth' /etc/pam.d/sshd | head -5
```

---

## Task 1. Map of pam.d

**Why:** understand how many services use PAM.

```bash
ls /etc/pam.d/ | head -25
echo "---"
ls /etc/pam.d/ | wc -l
```

Open **sshd** (the first 30 lines):

```bash
head -30 /etc/pam.d/sshd
```

**What to look for:**

- `auth` — password/key check (the key is handled by sshd, the password via pam_unix)
- `account` — whether login is allowed right now (expired, locked)
- `session` — limits, session logging
- `password` — changing the password

**If it doesn't work:** the file exists on any Ubuntu — are you in a minimal container without sshd? Run this on **srv1**.

---

## Task 2. pam.d for sudo

**Why:** sudo also goes through PAM.

```bash
head -20 /etc/pam.d/sudo
```

Compare with sshd — common modules `pam_unix`, possibly `pam_limits`.

---

## Task 3. limits — ulimit

**Why:** the session PAM applies limits from `/etc/security/limits.conf`.

```bash
ulimit -n
ulimit -u
grep -v '^#' /etc/security/limits.conf | grep -v '^$' | head -15
```

**What you'll see:** soft/hard for nofile, nproc. "Too many open files" in an application is often a ulimit issue.

---

## Task 4. faillock (if present)

**Why:** the connection between an SSH brute-force and a lockout.

```bash
which faillock
faillock --user $(whoami) 2>/dev/null || echo "no records or faillock is not configured"
```

On Ubuntu 22.04+ there may be **pam_faillock** in sshd — then after N failed passwords the user is temporarily locked.

**Don't** intentionally type 50 wrong passwords on prod.

---

## Task 5. auth.log and a failed login

**Why:** see the PAM/ssh trace in the logs.

```bash
sudo grep -i "Failed password" /var/log/auth.log 2>/dev/null | tail -5
sudo journalctl -u ssh --no-pager 2>/dev/null | grep -i "Failed" | tail -5
```

If it's empty — there were no failed attempts on the environment; that's normal.

Optionally (from **another** session, once, for training):

```bash
# NOT on prod — one wrong password for the log
ssh wronguser@127.0.0.1 2>&1 | head -2
```

---

## Task 6. nsswitch (connection with LDAP — theory)

**Why:** PAM checks the password, but "who is this user" may come from LDAP.

```bash
grep '^passwd:' /etc/nsswitch.conf
grep '^auth:' /etc/nsswitch.conf
```

**What you'll see:** `files systemd` or `files ldap` — the order of sources.

---

## Success criteria

- [ ] Read `/etc/pam.d/sshd` (on srv1 or lab)
- [ ] Ran `ulimit -n`
- [ ] You understand: PAM is a chain of modules, not a single file
- [ ] **pam.d was not modified**

## What to take to work

- "Won't let me in with a password" — faillock, expired, not just "forgot the password".
- Edits to pam.d — only with a console/recovery.

Next lesson: [27. ACL and AppArmor](27-acl-apparmor.md).
