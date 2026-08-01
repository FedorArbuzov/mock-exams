# 03. Users, groups, umask

## Why this matters in prod

Every process on Linux runs as a **user** (UID). This determines: which files can be read, whether it can listen on a port <1024, where logs are written. In Kubernetes the same idea appears as `runAsUser` in securityContext. On a bare server you create `deploy`, `nginx`, a dedicated user for the application — and do **not** run everything as root.

## Three account files

| File | Contents | Who can read it |
|------|------------|------------------|
| `/etc/passwd` | login, UID, GID, home, shell | everyone |
| `/etc/group` | groups and member lists | everyone |
| `/etc/shadow` | password hashes, expiry | root only |

In `/etc/passwd` the password field holds **`x`** — "see shadow". Historically it's this way: passwd is read by all programs, secrets live in shadow.

Breakdown of a single line:

```text
course:x:1000:1000:Lab User:/home/course:/bin/bash
│      │  │    │    │          │              └── login shell
│      │  │    │    │          └── home directory ($HOME)
│      │  │    │    └── GECOS (often full name or a comment)
│      │  │    └── GID of the primary group
│      │  └── UID (numeric identifier)
│      └── password in shadow
└── login
```

## UID and GID — not just names

- **UID 0** — always root, full bypass of permission checks (be careful with `sudo` and CI).
- **System** users — low UIDs (`www-data`, `nobody`, `postgres`) — for daemons with no login shell.
- **Regular** users on Ubuntu often have UID ≥ 1000.

```bash
id
id course
groups course
getent passwd course
getent group sudo
```

`getent` goes through NSS (which may be LDAP/SSSD in a company, not just a local file).

## Creating and modifying a user

```bash
sudo useradd -m -s /bin/bash deploy
sudo passwd deploy
sudo usermod -aG sudo deploy
```

| Flag | Meaning |
|------|----------|
| `-m` | create `/home/deploy` |
| `-s /bin/bash` | interactive shell |
| `-aG sudo` | **add** to a group, don't replace all groups |

**Classic mistake:** `usermod -G sudo deploy` **without** `-a` — the user ends up only in `sudo` and drops out of other groups (for example `docker`).

Delete along with the home directory:

```bash
sudo userdel -r deploy
```

## Groups — shared access to files

```bash
sudo groupadd developers
sudo usermod -aG developers deploy
groups deploy
```

Directory permissions `chmod g+rws` + setgid on the directory is the typical "team shared folder" pattern (more in [04](04-permissions.md)).

## sudo — not "a second root forever"

The **sudo** group (Debian/Ubuntu) or **wheel** (RHEL) allows running commands with elevated privileges via `sudo`.

```bash
sudo whoami
sudo -u www-data id
sudo -l    # what this user is allowed to do
```

In prod you configure a **minimal** sudoers: only `systemctl restart myapp`, not a full shell. In intermediate there's a dedicated [sudo](../linux-intermediate/23-sudo.md) lesson.

**Don't do** in prod: `NOPASSWD: ALL` for deploy without a strong reason.

## umask — "default" permissions on creation

When you `touch file` or `mkdir dir`, the kernel applies the **umask** — a mask that **turns off** bits.

```bash
umask
# often 0022
touch demo-file
mkdir demo-dir
ls -l demo-file
ls -ld demo-dir
```

| umask | New file | New directory |
|-------|------------|---------------|
| 0022 | 644 (rw-r--r--) | 755 (rwxr-xr-x) |
| 0002 | 664 | 775 |

Formula: file permissions = `666 & ~umask`, directory = `777 & ~umask`.

Services sometimes set the umask in the unit file (`UMask=0077`) so logs aren't world-readable.

## Relation to security

- Passwords — only in shadow, not in git.
- Service accounts — `/usr/sbin/nologin` or `/bin/false` as the shell if login isn't needed.
- One person — one UID; a "shared admin password" in `/etc/passwd` is a red flag.

## Checklist

- Where is the password hash stored and why not in passwd?
- What's dangerous about `usermod -G` without `-a`?
- What will `id` show for a user in two groups?
- What permissions will `umask 0027` give a new file?

Next lesson: [03. Lab: users](03-lab-users.md).
