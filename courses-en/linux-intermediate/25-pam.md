# 25. PAM — the authentication chain

## Intro: the password is correct, but login won't let you in

Scenarios from work:

- SSH: "Authentication succeeded" in debug, but the session drops immediately — look at **account** and **session** in PAM, not just the password.
- After five failed attempts the account is **locked for an hour** — this is often **pam_faillock**, not "an admin locked it in LDAP".
- `su - deploy` works, `ssh deploy@host` doesn't: different files **`/etc/pam.d/su`** and **`pam.d/sshd`**.

Behind all this is **PAM** (Pluggable Authentication Modules): it's not sshd and not `/etc/shadow` on their own that decide everything, but a **chain** of pluggable modules — unix, ldap, faillock, limits.

## What you'll learn

- What `/etc/pam.d/sshd`, `login`, `sudo` are.
- How PAM relates to `/etc/shadow` and nsswitch.
- How **pam_faillock** works (conceptually).
- Line types: **auth**, **account**, **password**, **session**.
- Why you shouldn't edit `pam.d` "by guessing" without a console.

---

## The PAM stack

```mermaid
flowchart TB
  app[sshd / login / sudo]
  pamd[/etc/pam.d/service-name]
  mods[pam_unix.so / pam_faillock / pam_limits ...]
  shadow[/etc/shadow + nss]
  app --> pamd
  pamd --> mods
  mods --> shadow
```

The application calls the **PAM API** (`pam_authenticate`, `pam_acct_mgmt`, …). PAM reads the service config and calls the `.so` modules one by one.

```bash
ls /etc/pam.d/
head -25 /etc/pam.d/sshd
head -15 /etc/pam.d/sudo
head -15 /etc/pam.d/common-auth 2>/dev/null
```

On Ubuntu, part of the logic is moved into **`common-auth`**, **`common-account`** — they're pulled in via `@include`.

---

## Management types (a column in pam.d)

| Type | The question it answers | Example |
|-----|------------------------------|--------|
| **auth** | Who are you? Is the password/key correct? | pam_unix, pam_sss |
| **account** | Are you allowed right now? (expired, locked, time) | pam_nologin, pam_unix |
| **password** | Changing the password at login | pam_unix |
| **session** | Environment after login, limits, audit | pam_limits, pam_systemd |

**The order of lines matters.** A module with the `required` flag stops the chain on failure; `sufficient` can complete success earlier.

Example (simplified, don't copy blindly):

```text
auth    required    pam_unix.so
auth    required    pam_faillock.so preauth
account required    pam_unix.so
session required    pam_limits.so
```

---

## pam_unix and shadow

**pam_unix** checks the password against the hash in **`/etc/shadow`** (a local user).

```bash
getent passwd course
sudo grep '^course:' /etc/shadow   # root only
```

LDAP/AD: instead of shadow — **nss** (`getent passwd`) + **pam_sss** / **pam_ldap**. The symptom "the user exists in id, the password isn't accepted" — check both nss and pam.

```bash
grep passwd /etc/nsswitch.conf
```

---

## pam_faillock (overview)

Locks an account after N failed attempts (brute-force).

```bash
faillock --user course 2>/dev/null
sudo faillock --user course
sudo faillock --reset --user course
```

The exact syntax in `pam.d` depends on the Ubuntu version (sometimes `pam_tally2` on older systems). In [lab 26](26-lab-pam.md) — only **reading** and resetting in a training environment.

**Risk:** you locked out root — you'll need serial/console or rescue.

---

## pam_limits and /etc/security/limits.conf

Limits on **nofile**, **nproc**, **maxlogins** when a session is opened:

```bash
grep -v '^#' /etc/security/limits.conf | grep -v '^$'
ulimit -n
ulimit -u
```

PAM's `pam_limits.so` applies them at login. In systemd services, limits can be set by the unit (`LimitNOFILE=`) — two mechanisms, don't confuse them.

---

## sudo and PAM

`sudo` also goes through **`/etc/pam.d/sudo`**. The policy of "who can sudo" is in **sudoers**; PAM handles the password, faillock, and limits during the call.

```bash
grep pam /etc/pam.d/sudo | head -5
```

---

## Common mistakes

| Symptom | Likely cause | Action |
|---------|-------------------|----------|
| All local logins fail | pam.d syntax, broken include | console, `pam-auth-update`, backup |
| Only SSH fails, console OK | pam.d/sshd vs login | diff the files |
| root locked | faillock | faillock --reset from the console |
| LDAP user unknown | nss, not pam | `getent passwd` |
| "password correct" but exit | account (expired shell) | `chage -l user` |

**Never** delete all the `pam_unix` lines in `common-auth` on a remote server without out-of-band access.

---

## In production

LDAP/SSSD + faillock + 2FA on VPN. PAM changes go through a change window, **serial/console**, and version control in Ansible. Audit: `journalctl`, SIEM over auth.log.

More on lockout and hardening — the [linux-security](../linux-security/README.md) course.

---

## Summary

PAM is the intermediary between the **service** (sshd, sudo) and the **policy** (password, lockout, limits). One user — different chains in different `pam.d` files. Don't edit it without rescue and `pam-auth-update` / a test on staging.

## Checklist

- [ ] Where is the PAM config for SSH?
- [ ] How does **auth** differ from **account**?
- [ ] How does PAM differ from `/etc/shadow`?
- [ ] How do you reset faillock for a user?

Next lesson: [26. Lab: PAM](26-lab-pam.md).
