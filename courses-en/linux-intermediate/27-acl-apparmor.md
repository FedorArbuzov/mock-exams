# 27. ACL and AppArmor (overview)

## Intro: "chmod 777, and still Permission denied"

Imagine a directory `/srv/uploads` that three teams need to write to: **deploy** (CI), **www-data** (nginx), and the **content** group. Classic Unix permissions have only **one owner** and **one group** plus "everyone else". Options:

- make everyone a member of one group — it works, but breaks when someone is removed from the group;
- `chmod 777` — "everyone writes" — a **bad idea** in production;
- **ACL** — a separate entry "user bob: rwx" without changing the owner.

A second story: the permissions seem to be there (`rwx` for www-data), but nginx can't read a file in `/var/www/secret`. In the log — **Permission denied**, in `dmesg` — **apparmor="DENIED"**. This is already **AppArmor** — a security profile that says: "the nginx process **is not allowed** to read this path", even if the UID permits it.

This chapter is about both mechanisms on Ubuntu. Deeper MAC — in [linux-security](../linux-security/README.md).

## What you'll learn

- When **chmod/chown** is enough, and when you need ACL.
- How to read **getfacl** output line by line.
- Why you need a **default ACL** on a directory for "inheriting" permissions to new files.
- What **AppArmor** is and how to distinguish it from ordinary permissions.
- Where to look on a denial: **dmesg**, **aa-status**.

## Classic permissions — a reminder

```bash
ls -l /srv/shared
# drwxrws--- root developers ...
```

| Bit | On a directory |
|-----|-------------|
| r | you can `ls` (see the names) |
| w | you can create/delete file **names** |
| x | you can `cd` inside |
| s (setgid) | new files inherit the directory's **group** |

ACL **do not replace** owner/group — they **add** entries on top.

## ACL — installing and reading

```bash
sudo apt install -y acl
getfacl /srv/shared
```

Example **getfacl** output (breakdown):

```text
# file: srv/shared
# owner: root
# group: developers
user::rwx          ← the OWNER's permissions (as in ls)
group::r-x         ← the GROUP's permissions
other::---         ← everyone else
user:deploy:rwx    ← ADDITIONALLY: user deploy
default:user:deploy:rwx   ← for NEW files in the directory (if a default ACL exists)
```

A `+` symbol in `ls -l` (`drwxrws---+`) means: "there's an ACL, look at getfacl".

## Adding an ACL

```bash
# deploy can do everything in this directory
sudo setfacl -m u:deploy:rwx /srv/shared

# the auditors group — read only
sudo setfacl -m g:auditors:rx /srv/shared

# ALL new files in the directory — deploy rwx by default
sudo setfacl -d -m u:deploy:rwx /srv/shared
```

| Command | Meaning |
|---------|--------|
| `setfacl -m u:USER:perms` | modify the ACL for a user |
| `setfacl -m g:GROUP:perms` | for a group |
| `setfacl -d -m ...` | **default** ACL (only on a **directory**) |
| `setfacl -b PATH` | remove all ACLs |
| `setfacl -x u:deploy` | remove one entry |

Check after creating a file as deploy:

```bash
sudo -u deploy touch /srv/shared/new.txt
getfacl /srv/shared/new.txt
```

If the directory had a **default ACL**, the new file will inherit the entries.

## ACL vs a new group — when to use which

| Situation | Solution |
|----------|---------|
| One team, one shared directory | group + setgid on the directory |
| Two or three "special" users outside the group | ACL |
| NFS with different uids on the clients | ACL + idmap, carefully |
| Temporary access for an auditor for a week | ACL, then `setfacl -x` |

## AppArmor — a "sandbox" for programs

**Mandatory Access Control (MAC):** the policy defines the **allowed paths and capabilities**, not just the UID.

```bash
sudo aa-status
```

A typical fragment:

```text
apparmor module is loaded.
XX profiles are loaded.
XX profiles are in enforce mode.
   /usr/sbin/nginx
   ...
```

Modes:

| Mode | Meaning |
|-------|--------|
| **enforce** | denial is real |
| **complain** | log only, no blocking (debugging) |
| disabled | the profile is off |

On a denial:

```bash
sudo dmesg | tail -30 | grep -i apparmor
# apparmor="DENIED" operation="open" profile="/usr/sbin/nginx" name="/etc/ssl/private/..."
```

**Don't** disable AppArmor on a server (`apparmor=0` in the kernel cmdline) as a "quick fix" — find the profile in `/etc/apparmor.d/` or a local override.

## SELinux on RHEL

On Rocky/Alma/RHEL, instead of AppArmor there's **SELinux**. The commands are different (`getenforce`, `ausearch`), the idea is the same: MAC on top of DAC. See [linux-security/11-selinux](../linux-security/11-selinux.md).

## On the deploy/linux environment

Lab [28](28-lab-acl.md) — `/srv/aclshare` on **lab**. AppArmor in a container may be partially disabled — run `aa-status` anyway to build the habit.

## Common mistakes

| Symptom | Likely cause | What to do |
|---------|-------------------|-------------|
| `setfacl: Operation not supported` | filesystem without ACL | ext4/xfs are OK; check `tune2fs -l` |
| After `cp` the ACLs disappeared | cp without `-a` | `cp -a` or `rsync -A` |
| 777, still denied | AppArmor | dmesg, the nginx profile |
| NFS, "foreign" uid | idmap, all_squash | align uid/gid |
| default ACL didn't take effect | not a directory / no `-d` | setfacl on the directory |

## In production

- ACL on **NFS** — document the uid/gid mapping.
- AppArmor **enforce** for nginx, php-fpm — the standard on Ubuntu.
- Profile changes go through `aa-complain`, a test, then enforce.
- Audit: who added an ACL on a production share.

## Summary

**DAC** (chmod/chown) is the base. **ACL** is fine-tuning for "also this one user". **AppArmor** restricts a program independently of chmod. On a "strange" denial, look at **getfacl** and **dmesg APPARMOR DENIED**. A default ACL on a directory saves your nerves with CI that creates thousands of files in upload.

## Checklist

- What does `user:deploy:rwx` mean in getfacl?
- Why `setfacl -d` only on a directory?
- How do you tell AppArmor apart from chmod?
- Why doesn't `chmod 777` fix a DENIED in dmesg?

Next lesson: [28. Lab: ACL](28-lab-acl.md).
