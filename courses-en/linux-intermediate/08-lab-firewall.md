# 08. Lab: ufw on srv1

## Lab goal

You'll enable **default deny** on the lab server **srv1** without losing SSH, and verify HTTP from **lab**. This is the same procedure you need on any VM in the cloud — only instead of the AWS console, you can roll back the container with `docker compose restart srv1`.

## Prerequisites

- The [`deploy/linux`](../../deploy/linux/README.md) stand is running: `docker compose up -d`.
- Lessons [01–06](01-tcp-ip.md) are done — you can ping 172.28.0.11 from lab.
- Account: **course** / **course**.
- **Two terminals:** one stays on lab for checks, the second SSHes into srv1.

## Preparing the stand

**Terminal 1 (lab):**

```bash
docker compose exec lab bash
ping -c2 172.28.0.11
ssh course@172.28.0.11 'hostname; sudo ufw status'
```

If SSH asks for the fingerprint — answer `yes`. If `Connection refused` — wait a minute after `compose up` and check `docker compose ps`.

**Terminal 2 (srv1):** from lab run:

```bash
ssh course@172.28.0.11
```

The following steps prefixed with "on srv1" are in this session.

Install nginx if it's not there yet:

```bash
sudo apt update
sudo apt install -y nginx
sudo systemctl enable --now nginx
curl -s -o /dev/null -w "%{http_code}\n" http://127.0.0.1/
```

Expected **200**.

---

## Task 1. Look at ufw before changes

**Why:** capture the baseline — inactive or rules already present.

On srv1:

```bash
sudo ufw status verbose
```

**What you'll see:** most often `Status: inactive` on a fresh container.

**If it doesn't work:** `sudo: ufw: command not found` — `sudo apt install -y ufw`.

---

## Task 2. Policies and rules (still before enable)

**Why:** assemble the rules **before** turning on the filter — that way you don't block your own SSH.

```bash
sudo ufw default deny incoming
sudo ufw default allow outgoing
sudo ufw allow OpenSSH
sudo ufw allow 80/tcp
sudo ufw allow from 172.28.0.0/24 to any port 22 proto tcp comment 'lab network ssh'
sudo ufw status numbered
```

**What you'll see:** a list of rules with numbers `[ 1]`, `[ 2]`, … — SSH and 80/tcp in the list, status still `inactive` until enable.

**If it doesn't work:** a typo in the CIDR — check `172.28.0.0/24`, not `/32`.

---

## Task 3. Checking SSH from the second session

**Why:** to confirm you'll be able to log in from lab after enable.

**Without closing** terminal 2 on srv1, in **terminal 1 (lab)**:

```bash
ssh course@172.28.0.11 'echo SSH before enable OK'
```

It should go through without a password if a key is set up; otherwise — the password course.

---

## Task 4. Enable ufw

**Why:** apply the rules to incoming traffic.

On srv1:

```bash
sudo ufw enable
# answer y to the Proceed prompt
sudo ufw status verbose
```

**What you'll see:**

```text
Status: active
Default: deny (incoming), allow (outgoing), ...
```

In terminal 1 again:

```bash
ssh course@172.28.0.11 'echo SSH after enable OK'
```

**If SSH hangs / times out:** see the "Emergency rollback" section below. **Don't** panic — the lab container can be restarted.

---

## Task 5. HTTP from lab

**Why:** verify that not only SSH but also the service is allowed.

On lab:

```bash
curl -s -o /dev/null -w "HTTP code: %{http_code}\n" http://172.28.0.11/
curl -s http://172.28.0.11/ | head -5
```

**What you'll see:** `HTTP code: 200` and the nginx welcome HTML.

**If 000 or timeout:** on srv1 `sudo ufw allow 80/tcp` and `sudo systemctl status nginx`.

---

## Task 6. Closed port (confirm deny works)

**Why:** confirm that disallowed ports are actually filtered.

On lab:

```bash
nc -zv -w2 172.28.0.11 8080 2>&1 || true
```

Expected: refusal or timeout — you **didn't** open 8080.

For comparison:

```bash
nc -zv -w2 172.28.0.11 80 2>&1
```

**What you'll see:** 80 — succeeded (if nginx is listening), 8080 — no.

---

## Task 7. Under the hood (optional)

On srv1:

```bash
sudo nft list ruleset 2>/dev/null | head -40
```

**What you'll see:** ufw-* chains — connecting theory to practice.

---

## Cleanup

If srv1 needs to be "clean" for other labs:

```bash
sudo ufw disable
sudo ufw reset
```

`reset` removes all ufw rules — only on the lab stand.

---

## Emergency rollback

| Situation | Action |
|----------|----------|
| Lost SSH after enable | from the host: `cd deploy/linux && docker compose restart srv1` |
| Need to urgently open 22 | via `docker compose exec srv1 bash` as root: `ufw allow 22/tcp` |
| Full stand reset | `docker compose down -v && docker compose up -d` |

---

## Success criteria

- [ ] `ufw status` — **active**, default deny incoming
- [ ] SSH from lab works **after** enable
- [ ] `curl http://172.28.0.11/` — HTTP 200
- [ ] Port 8080 from lab is not accepted
- [ ] You kept two sessions during enable

## What to take away

- The rule **OpenSSH before enable** — not up for debate.
- Always a **second session** when changing the firewall.
- Verify the service — `curl`/`nc` from the client, not just `localhost` on the server.

Next lesson: [09. TLS and OpenSSL](09-tls-openssl.md).
