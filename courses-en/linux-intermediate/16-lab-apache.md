# 16. Lab: Apache on srv2

## Lab goal

Bring up a **second** web stack in the lab network — **Apache** on **srv2** (172.28.0.12) — and verify access from **lab**. This way you'll confirm that L3 networking works not just to srv1, and get hands-on with `apache2ctl configtest` and access.log.

## Prerequisites

- `ping 172.28.0.12` from lab — OK.
- SSH: **course** / **course**.

```bash
docker compose exec lab bash
ping -c2 172.28.0.12
```

---

## Preparing the stand

Log in to srv2:

```bash
ssh course@172.28.0.12
```

---

## Task 1. Installing Apache

**Why:** the basic cycle install → enable → configtest.

```bash
sudo apt update
sudo apt install -y apache2
systemctl is-active apache2
sudo apache2ctl configtest
```

**What you'll see:**

```text
Syntax OK
```

**If AH00558 bind 80:** the port is taken — `sudo ss -tlnp | grep :80`; on the stand's srv2 it's usually free.

---

## Task 2. The default page

```bash
curl -s http://127.0.0.1/ | head -10
curl -sI http://127.0.0.1/ | head -5
```

**What you'll see:** the Ubuntu/Apache default HTML, `HTTP/1.1 200 OK`.

---

## Task 3. Your own content

**Why:** to confirm you're serving the right DocumentRoot.

```bash
echo '<h1>srv2 Apache — linux-intermediate lab 16</h1>' | sudo tee /var/www/html/index.html
curl -s http://127.0.0.1/ | grep srv2
```

---

## Task 4. Checking from lab

**Go back** to lab (a new session or `exit`):

```bash
curl -s http://172.28.0.12/ | head -8
curl -s -o /dev/null -w "HTTP code: %{http_code}\n" http://172.28.0.12/
```

**What you'll see:** your srv2 header, code **200**.

**If timeout:** srv2 down, firewall (rare), wrong IP.

**If connection refused:** apache isn't listening on 80 — go back to srv2, `systemctl start apache2`.

---

## Task 5. access.log

On srv2:

```bash
sudo tail -3 /var/log/apache2/access.log
```

From lab, `curl http://172.28.0.12/` again. On srv2:

```bash
sudo tail -1 /var/log/apache2/access.log
```

**What you'll see:** a line with the IP **172.28.0.10** (lab) and `GET / HTTP/1.1" 200`.

---

## Task 6. Comparison with srv1 (optional)

From lab:

```bash
echo "=== srv1 ==="
curl -s -o /dev/null -w "%{http_code}\n" http://172.28.0.11/ 2>/dev/null || echo "no server"
echo "=== srv2 ==="
curl -s -o /dev/null -w "%{http_code}\n" http://172.28.0.12/
```

srv1 may have nginx — a different Server header. The point: **two HTTP servers in one network**.

---

## Success criteria

- [ ] `apache2ctl configtest` — Syntax OK
- [ ] curl from lab — HTML with "srv2", HTTP 200
- [ ] access.log shows a request from the lab IP

## What to take away

- A second host in the stand — to compare nginx (srv1) vs Apache (srv2).
- Always configtest before reload.

Next lesson: [17. NFS](17-nfs.md).
