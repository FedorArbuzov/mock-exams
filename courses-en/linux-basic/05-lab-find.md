# 05. Lab: find, stat, locate

Learn to search for files **safely**: first look at the list, then act. In prod, one typo in `find ... -delete` means a restore from backup.

## Environment

`docker compose exec lab bash`

---

## Task 1. find by name and type

```bash
find /etc -name "hosts" -type f 2>/dev/null
find /etc -name "*.conf" -type f 2>/dev/null | wc -l
```

**What you'll see:** the exact path to `hosts` and a large count of `.conf` (the number depends on the image).

Narrow the search:

```bash
find /etc/nginx -name "*.conf" -type f 2>/dev/null
```

If nginx isn't installed — the directory is empty or find returns nothing; install `sudo apt install -y nginx` or search in `/etc/ssh`.

---

## Task 2. By time and size

```bash
find /var/log -type f -mtime -1 2>/dev/null | head
find /var/log -type f -size +1M 2>/dev/null | head
```

**What you'll see:** recent and "heavy" logs — candidates for rotation when "disk full".

---

## Task 3. stat

```bash
stat /etc/passwd
stat -c 'mode=%a owner=%U group=%G file=%n' /etc/passwd
```

Create a file and compare the timestamps:

```bash
touch /tmp/find-lab-demo
sleep 1
echo x >> /tmp/find-lab-demo
stat /tmp/find-lab-demo
```

**What you'll see:** mtime changed after writing to the file.

---

## Task 4. -exec without deleting

```bash
find /tmp -maxdepth 1 -name "find-lab-*" -type f 2>/dev/null
find /tmp -maxdepth 1 -name "find-lab-*" -type f -exec ls -lh {} \;
```

Create a couple of files for the demo:

```bash
touch /tmp/find-lab-{a,b,c}
find /tmp -maxdepth 1 -name "find-lab-*" -exec ls -lh {} \;
```

---

## Task 5. locate (if plocate is installed)

```bash
sudo apt install -y plocate
sudo updatedb
locate passwd | head
locate -i sshd_config
```

**What you'll see:** many paths containing `passwd` — the index searches by name **substring**.

Compare with find:

```bash
find /etc -name "sshd_config" 2>/dev/null
```

---

## Task 6. "Dry run" before delete

```bash
touch /tmp/find-lab-old
find /tmp -maxdepth 1 -name "find-lab-old" -print
# only when you're sure:
find /tmp -maxdepth 1 -name "find-lab-old" -delete
find /tmp -maxdepth 1 -name "find-lab-old"
```

---

## Cleanup

```bash
rm -f /tmp/find-lab-* /tmp/find-lab-demo
```

---

## Success criteria

- [ ] find over `/etc` with `2>/dev/null` worked
- [ ] stat showed permissions and owner
- [ ] `-exec ls` printed the list of created files
- [ ] You understand why `-print` first, then `-delete`

Next lesson: [06. grep and awk](06-text-tools.md).
