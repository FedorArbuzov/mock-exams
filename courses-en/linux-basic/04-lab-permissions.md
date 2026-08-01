# 04. Lab: permissions and owners

Practice for "how to fix a broken directory": create files as different users, change permissions, and check access via `sudo -u`.

## Environment

`docker compose exec lab bash`, `sudo` required.

---

## Task 1. Basic chmod

```bash
cd /tmp
rm -f perm-demo.txt
echo secret > perm-demo.txt
ls -l perm-demo.txt
chmod 600 perm-demo.txt
ls -l perm-demo.txt
```

**What you'll see:** `-rw-------` — only the owner can read.

Check as another user (if `nobody` or `www-data` exists):

```bash
sudo -u www-data cat /tmp/perm-demo.txt
```

**Permission denied** is expected.

---

## Task 2. Directory and the x bit

```bash
mkdir -p /tmp/permdir/sub
chmod 644 /tmp/permdir      # remove x for everyone
ls -ld /tmp/permdir
cd /tmp/permdir
```

**What you'll see:** `cd` won't work — "Permission denied", even though `ls` on the parent could show the name.

Restore entry:

```bash
chmod 755 /tmp/permdir
cd /tmp/permdir && pwd
```

---

## Task 3. Group access

```bash
sudo groupadd permgrp
sudo useradd -m -s /bin/bash perma
sudo usermod -aG permgrp perma
sudo mkdir /srv/permshare
sudo chown root:permgrp /srv/permshare
sudo chmod 2770 /srv/permshare
ls -ld /srv/permshare
```

Create a file as perma:

```bash
sudo -u perma touch /srv/permshare/from-perma.txt
ls -l /srv/permshare/
```

**What you'll see:** the file's group is `permgrp` (setgid on the directory), permissions depend on perma's umask.

Check that a user **not** in `permgrp` can't write:

```bash
sudo -u www-data touch /srv/permshare/hack.txt
```

---

## Task 4. Sticky bit (like /tmp)

```bash
mkdir /tmp/sticky-demo
chmod 1777 /tmp/sticky-demo
ls -ld /tmp/sticky-demo
```

Create a file as user A, then try to delete it as user B:

```bash
sudo -u perma touch /tmp/sticky-demo/a-file
sudo -u www-data rm /tmp/sticky-demo/a-file
```

**What you'll see:** deleting someone else's file is forbidden when sticky is set.

---

## Task 5. chown

```bash
sudo chown perma:permgrp /srv/permshare/from-perma.txt
ls -l /srv/permshare/from-perma.txt
```

---

## Cleanup

```bash
sudo rm -rf /srv/permshare /tmp/sticky-demo /tmp/permdir
sudo userdel -r perma 2>/dev/null
sudo groupdel permgrp 2>/dev/null
```

---

## Success criteria

- [ ] The `600` file is inaccessible to `www-data`
- [ ] You showed that without `x` on a directory you can't `cd`
- [ ] In `/srv/permshare`, setgid and group write work
- [ ] Sticky prevents deleting someone else's file

Next lesson: [05. find and locate](05-files-find.md).
