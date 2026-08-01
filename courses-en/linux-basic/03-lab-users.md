# 03. Lab: users and groups

You will create a training user the way it's done when preparing a server for deployment: a separate account, home, group, and verification via `id`. Passwords in this lab are simple — **only in the Docker environment**.

## Environment

```bash
cd deploy/linux
docker compose exec lab bash
```

Work as a user who has `sudo` (often **course**), or as root in the container.

---

## Task 1. Inspect your own account

```bash
whoami
id
grep "^$(whoami):" /etc/passwd
groups
```

**What you'll see:** the numeric UID, the primary GID, and the list of groups (including `sudo`, if present).

Write down your UID — it'll be handy if you search for files via `find -user`.

---

## Task 2. Create the labuser user

```bash
sudo useradd -m -s /bin/bash labuser
sudo passwd labuser
# enter: labpass (or your own training password)
```

Verification:

```bash
getent passwd labuser
sudo ls -la /home/labuser
```

**What you'll see:** a line in passwd and a home directory with skeleton files (`.bashrc`, etc.).

---

## Task 3. Group and membership

```bash
sudo groupadd labteam
sudo usermod -aG labteam labuser
groups labuser
grep labteam /etc/group
```

**What you'll see:** `labuser` in the `groups` output; in `/etc/group` — `labteam:x:GID:labuser` (or a comma-separated list).

Confirm that **you** didn't lose your own groups after `usermod` (if you experimented on yourself — use only `-aG`).

---

## Task 4. sudo for labuser (for practice)

```bash
echo 'labuser ALL=(ALL) NOPASSWD: /usr/bin/id, /usr/bin/whoami' | sudo tee /etc/sudoers.d/labuser-lab
sudo chmod 440 /etc/sudoers.d/labuser-lab
sudo visudo -c
```

Switch and check:

```bash
sudo -u labuser sudo -n whoami
sudo -u labuser sudo -n id
```

**What you'll see:** `root` and a full `id` **without a password**, only for the allowed commands.

Try a forbidden one (it should ask for a password or refuse):

```bash
sudo -u labuser sudo -n apt update
```

**Why this matters in prod:** deploy may restart a service but not install packages.

---

## Task 5. umask

```bash
umask
sudo -u labuser bash -c 'umask; touch /home/labuser/from-labuser; ls -l /home/labuser/from-labuser'
```

**What you'll see:** typically `0022` and a `644` file owned by labuser.

---

## Task 6. Cleanup (optional)

If the user is no longer needed:

```bash
sudo userdel -r labuser
sudo groupdel labteam
sudo rm -f /etc/sudoers.d/labuser-lab
```

On srv1 in the final project, do **not** delete the **deploy** user.

---

## Success criteria

- [ ] The `labuser` user exists, `/home/labuser` is present
- [ ] `labuser` is in the `labteam` group
- [ ] `sudo -u labuser sudo -n whoami` prints `root`
- [ ] The created file has the expected permissions (644 with umask 022)

## If something went wrong

| Symptom | Solution |
|---------|---------|
| `useradd: user exists` | `sudo userdel -r labuser` and retry |
| `visudo -c` complains about syntax | fix the file in `/etc/sudoers.d/`, don't leave a broken sudoers |
| You have no sudo | work as root in the lab container |

Next lesson: [04. rwx permissions](04-permissions.md).
