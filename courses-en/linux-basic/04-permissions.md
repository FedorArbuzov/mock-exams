# 04. rwx permissions, chmod, chown, special bits

## Why "Permission denied" is the most common deploy error

The application can't write to a directory, nginx can't read a certificate, cron won't run a script — almost always **permissions** or **ownership** are to blame. Understanding `ls -l` saves hours: you look at three triplets (owner, group, others) and the special bits, instead of restarting the server "at random".

## Reading `ls -l`

```bash
ls -l /etc/passwd
ls -ld /etc /tmp
```

```text
drwxrwxrwt  10 root root  ... /tmp
- rw- r-- r--   1 root root  ... /etc/passwd
│ └┬┘ └┬┘ └┬┘
│  │   │   └── others (everyone who isn't owner and isn't in the group)
│  │   └────── group
│  └────────── owner
└───────────── type: - file, d directory, l symlink
```

| Permission | On a **file** | On a **directory** |
|-------|--------------|-----------------|
| r (4) | read the contents | **list** names (`ls`) |
| w (2) | write to the file | create/delete **names** in the directory |
| x (1) | execute (if executable) | **enter** (`cd`) and traverse |

**Important:** for a directory, **x** is required for `cd /var/log` to work, even if `r` is only available to root. Without `x` on the parent directories, the path "doesn't exist" for you.

## chmod — numbers and letters

```bash
chmod 644 report.txt
chmod 755 deploy.sh
chmod u+x deploy.sh
chmod g-w secret.txt
chmod -R u+rX /srv/shared    # X = x only for directories
```

| Digit | Bits |
|-------|------|
| 7 | rwx |
| 6 | rw- |
| 5 | r-x |
| 4 | r-- |

Three digits — owner, group, others: `chmod 750` = rwx for the owner, r-x for the group, nothing for the rest.

## chown and chgrp

```bash
sudo chown deploy:developers /srv/shared
sudo chown deploy app.log
sudo chgrp www-data /var/www/html
```

Only root can change the **owner** (exceptions — handing over your own files). In prod, after `rsync` or unpacking an archive, you often need `chown -R appuser:appgroup /var/lib/myapp`.

## Special bits — when you need them

| Bit | On a file | On a directory |
|-----|----------|-------------|
| **setuid** (4xxx) | process runs with the file owner's UID | rarely |
| **setgid** (2xxx) | process runs with the file's GID | new files inherit the **directory's group** |
| **sticky** (1xxx) | — | only the owner can delete a file (`/tmp`) |

```bash
ls -ld /tmp
# ... drwxrwxrwt — the letter t at the end = sticky
chmod 2775 /srv/uploads   # setgid on the directory
chmod +t /srv/sticky-demo
```

**setuid** on random binaries is a security hole (local privilege escalation). Modern systems keep a minimum of setuid programs (`passwd`, `sudo`).

## umask in action

```bash
umask
touch umask-demo-file
mkdir umask-demo-dir
ls -l umask-demo-file
ls -ld umask-demo-dir
```

If a service creates files with "too open" permissions — check the umask in the systemd unit or in the init script.

## ACL — when rwx isn't enough

The classic three triplets aren't enough if you need "user bob may read, group devs may write". Then it's **ACL** — in [linux-intermediate](../linux-intermediate/27-acl-apparmor.md).

## Typical DevOps scenarios

| Symptom | What to check |
|---------|----------------|
| nginx 403 on static | owner/group and `r` for the worker (www-data) |
| cannot create pid file | permissions on `/var/run/...` |
| script works manually, fails in cron | a different user, no `x` on the script, or PATH |

## Checklist

- Why does `chmod 600` on a **directory** not allow `cd`?
- Why sticky on `/tmp`?
- Who can run `chown root:root file`?
- What does setgid give on a shared directory?

Next lesson: [04. Lab: permissions](04-lab-permissions.md).
