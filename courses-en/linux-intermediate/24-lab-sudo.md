# 24. Lab: sudoers for deploy

## Lab goal

Configure the **deploy** user the way it's done for CI/CD: it can **restart nginx** and **check the config**, but **cannot** install packages or get full root without a password. You'll work with a real `/etc/sudoers.d/` file and see the difference between "allowed" and "denied" in the `sudo` output.

## Prerequisites

- The [`deploy/linux`](../../deploy/linux/README.md) environment, container **srv1** (172.28.0.11).
- You can log in as **course** with sudo, or as root.
- You've read the theory [23. sudo](23-sudo.md).

If the **deploy** user doesn't exist yet:

```bash
ssh course@172.28.0.11
sudo useradd -m -s /bin/bash deploy
sudo passwd deploy   # training password, for example deploy
```

For the lab, do **not** give deploy full NOPASSWD ALL — the whole point is restriction.

---

## Environment setup

On srv1:

```bash
sudo apt install -y nginx
sudo systemctl enable --now nginx
sudo nginx -t
id deploy
```

Write down the full paths (on Ubuntu, commonly):

```bash
which nginx systemctl
# /usr/bin/nginx
# /usr/bin/systemctl
```

In sudoers, **full paths** to the binaries are **mandatory**.

---

## Task 1. Create a sudoers fragment

**Why:** a separate file in `/etc/sudoers.d/` is easier to review in git/Ansible than editing `/etc/sudoers`.

On srv1:

```bash
sudo tee /etc/sudoers.d/deploy-nginx <<'EOF'
# Deploy user: only nginx operations without password
deploy ALL=(ALL) NOPASSWD: /usr/bin/nginx -t, \
                              /usr/bin/systemctl status nginx, \
                              /usr/bin/systemctl restart nginx, \
                              /usr/bin/systemctl reload nginx
EOF
sudo chmod 440 /etc/sudoers.d/deploy-nginx
sudo visudo -c
```

**What you'll see:**

```text
/etc/sudoers.d/deploy-nginx: parsed OK
```

**If you get `syntax error`:** don't continue — fix the file; a broken sudoers can lock you out of sudo.

Breaking down the line:

| Part | Meaning |
|-------|----------|
| `deploy` | who invokes sudo |
| `ALL` | on any host (in LDAP — a host alias) |
| `(ALL)` | can become root for these commands |
| `NOPASSWD:` | without a password for deploy |
| list of paths | **only** these commands |

---

## Task 2. Check the allowed commands

**Why:** confirm the whitelist works.

Session as root or course:

```bash
sudo -u deploy sudo -n nginx -t
sudo -u deploy sudo -n systemctl status nginx --no-pager | head -8
sudo -u deploy sudo -n systemctl reload nginx
```

The **`-n`** flag means non-interactive, without a password. It should **not** ask for a password.

**What you'll see:** `syntax is ok`, nginx status active.

**If you get "password is required":** a typo in the path (`which nginx`), or extra arguments that aren't allowed — a strict sudoers sometimes requires an exact match; for the lab, the listed commands are enough.

---

## Task 3. A forbidden command

**Why:** confirm that deploy is **not** root.

```bash
sudo -u deploy sudo -n apt update 2>&1 | head -5
sudo -u deploy sudo -n whoami 2>&1 | head -3
```

**What you'll see:** something like:

```text
Sorry, user deploy is not allowed to execute '/usr/bin/apt update' as root
```

or a password prompt that you don't fill in for deploy — the effect is the same: **denied**.

---

## Task 4. sudo -l as deploy

**Why:** deploy (or an auditor) can see their own permissions.

```bash
sudo -u deploy sudo -l
```

**What you'll see:** the list of NOPASSWD nginx/systemctl commands.

---

## Task 5. Audit in auth.log

**Why:** in production you investigate "who restarted nginx".

```bash
sudo grep deploy /var/log/auth.log | tail -5
# or
sudo journalctl -t sudo --no-pager | grep deploy | tail -5
```

Run `sudo -u deploy sudo -n systemctl restart nginx` once more and grep again — a new line with a timestamp will appear.

---

## Task 6. (Optional) A dangerous example — don't do this in production

For understanding only, **do not save this**:

```text
deploy ALL=(ALL) NOPASSWD: ALL
```

This is equivalent to root without a password for deploy. Companies don't do this.

---

## Cleanup

```bash
sudo rm -f /etc/sudoers.d/deploy-nginx
sudo visudo -c
```

You can keep the deploy user for the [final project](34-final-project.md).

---

## Success criteria

- [ ] `visudo -c` — parsed OK
- [ ] `sudo -u deploy sudo -n nginx -t` — without a password
- [ ] `sudo -u deploy sudo -n apt update` — denied
- [ ] There's a trace of a sudo call from deploy in auth.log

## What to take to work

- CI user: a **minimal** NOPASSWD whitelist, full paths.
- Before merging into sudoers — always run `visudo -c`.
- Investigation: `grep deploy /var/log/auth.log`.

Next lesson: [25. PAM](25-pam.md).
