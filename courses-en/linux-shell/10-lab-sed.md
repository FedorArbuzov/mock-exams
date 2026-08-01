# 10. Lab: sed for configs

## Lab goal

Practice **substitution**, **deleting** lines and **in-place with a backup** on a copy of `/etc/hosts` and (optionally) `nginx.conf` — without breaking prod files.

## Prerequisites

- [09. sed](09-sed.md).
- lab.

```bash
docker compose exec lab bash
```

---

## Preparation

```bash
cp /etc/hosts /tmp/hosts.lab
wc -l /tmp/hosts.lab
```

---

## Task 1. Uncomment a line (if present)

```bash
grep -n 'srv1\|lab' /tmp/hosts.lab || echo "add test line:"
echo "172.28.0.11 srv1.lab.local srv1" >> /tmp/hosts.lab
sed 's/^#\(.*srv1.lab.local\)/\1/' /tmp/hosts.lab > /tmp/hosts.lab2
mv /tmp/hosts.lab2 /tmp/hosts.lab
grep srv1 /tmp/hosts.lab
```

---

## Task 2. Delete empty lines

```bash
sed '/^$/d' /tmp/hosts.lab | wc -l
```

---

## Task 3. Delete comments (except the localhost block — be careful)

```bash
sed '/^#/d' /tmp/hosts.lab | head -15
```

**Why:** to see the "bare" entries; don't do this on prod without review.

---

## Task 4. nginx worker_processes (with a backup)

```bash
sudo apt install -y nginx 2>/dev/null || true
grep worker_processes /etc/nginx/nginx.conf
sudo cp /etc/nginx/nginx.conf /tmp/nginx.conf.bak
sudo sed -i 's/worker_processes auto/worker_processes 2/' /etc/nginx/nginx.conf
grep worker_processes /etc/nginx/nginx.conf
sudo nginx -t
sudo cp /tmp/nginx.conf.bak /etc/nginx/nginx.conf
sudo nginx -t
```

---

## Task 5. Multiple -e

```bash
echo -e "debug\ninfo\nerror\n" | sed -e 's/debug/DEBUG/' -e 's/error/ERROR/'
```

---

## Task 6. diff before/after (discipline)

```bash
cp /etc/hosts /tmp/hosts.before
sed 's/localhost/localhost.localdomain/' /tmp/hosts.before > /tmp/hosts.after
diff -u /tmp/hosts.before /tmp/hosts.after | head -20
```

---

## Success criteria

- [ ] sed changed the copy of hosts
- [ ] nginx.conf restored from .bak
- [ ] You understand -e, -i, diff
- [ ] Multiple expressions in a single sed

## What to take into your work

- Any `sed -i` on a server → backup + `nginx -t` / reload only after OK.

Next lesson: [11. awk](11-awk.md).
