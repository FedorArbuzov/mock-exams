# 28. Lab: ACL on a shared directory

## Lab goal

Build a typical **shared directory** for a team: an owner group, **setgid** on the directory (new files inherit the group), and an **ACL** for a specific user without chmod 777. Verify both writing and denial for an outside user.

Related to the [ACL and AppArmor theory](27-acl-apparmor.md).

## Prerequisites

- lab, sudo.
- The acl package.

```bash
docker compose exec lab bash
sudo apt install -y acl
```

---

## Setup: why setgid + ACL

| Mechanism | Purpose |
|----------|--------|
| `chown root:acldev` + `chmod 2770` | only the acldev group in the directory; setgid → new files get the acldev group |
| `setfacl -m u:acluser:rwx` | access for a user **outside** the primary group |
| `setfacl -d -m ...` | default ACL for **new** files in the directory |

---

## Task 1. Users and directory

```bash
sudo groupadd acldev 2>/dev/null || true
sudo useradd -m -s /bin/bash acluser 2>/dev/null || true
sudo usermod -aG acldev acluser
sudo mkdir -p /srv/aclshare
sudo chown root:acldev /srv/aclshare
sudo chmod 2770 /srv/aclshare
ls -ld /srv/aclshare
```

**What you'll see:** `drwxrws---` — the letter **`s`** in the group = setgid.

**Without setgid:** a file created by acluser may get the group `acluser`, and colleagues in acldev won't see it.

---

## Task 2. ACL on the directory

```bash
sudo setfacl -m u:acluser:rwx /srv/aclshare
sudo setfacl -d -m u:acluser:rwx /srv/aclshare
getfacl /srv/aclshare
```

**How to read getfacl (fragment):**

```text
# group: acldev
user::rwx
group::rwx
other::---
user:acluser:rwx
default:user:acluser:rwx
```

The **`mask::`** line limits the effective ACL permissions — if something "doesn't work", look at the mask.

---

## Task 3. Writing as acluser

```bash
sudo -u acluser touch /srv/aclshare/from-acluser.txt
sudo -u acluser bash -c 'echo hello > /srv/aclshare/from-acluser.txt'
ls -l /srv/aclshare/
getfacl /srv/aclshare/from-acluser.txt
```

**What you'll see:** the file is created; the file's group is often **acldev** (thanks to setgid on the directory).

---

## Task 4. A member of the acldev group (optional)

```bash
sudo useradd -m -G acldev dev2 2>/dev/null || true
sudo -u dev2 touch /srv/aclshare/from-dev2.txt
ls -l /srv/aclshare/
```

Should work via **group::rwx** without a personal ACL.

---

## Task 5. Denial for an outsider

```bash
sudo -u www-data touch /srv/aclshare/hack.txt 2>&1
echo exit_code=$?
```

**Expected:** `Permission denied`, a non-zero exit.

**If you managed to create the file:** check whether www-data is in the acldev group (`groups www-data`).

---

## Task 6. Removing the ACL (verification)

```bash
sudo setfacl -x u:acluser /srv/aclshare
sudo -u acluser touch /srv/aclshare/should-fail.txt 2>&1
```

**Expected:** denial (if acluser is not in the acldev group).

Restore the ACL for the criteria:

```bash
sudo setfacl -m u:acluser:rwx /srv/aclshare
```

---

## Task 7. AppArmor (overview)

```bash
sudo aa-status 2>/dev/null | head -15
```

**Why:** to remember that **Unix permissions** and **MAC (AppArmor)** are different layers. The ACL allows it, but the nginx profile may forbid a path.

---

## Cleanup

```bash
sudo setfacl -b /srv/aclshare
sudo rm -rf /srv/aclshare
sudo userdel -r acluser 2>/dev/null
sudo userdel -r dev2 2>/dev/null
sudo groupdel acldev 2>/dev/null
```

---

## Success criteria

- [ ] `ls -ld` shows setgid on the directory
- [ ] acluser creates files in `/srv/aclshare`
- [ ] www-data gets Permission denied
- [ ] `getfacl` shows `user:acluser:rwx`

## What to take to work

- Shared dir: **setgid + a group**, not `chmod 777`.
- For a "guest" user — ACL, not changing everyone's primary group.
- After `setfacl`, look at the **mask** and the **default ACL**.

Next lesson: [29. Performance](29-performance.md).
