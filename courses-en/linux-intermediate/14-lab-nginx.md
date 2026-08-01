# 14. Lab: reverse proxy lab → srv1

## Lab goal

Assemble a production-like scheme: **client** (you on lab) → **reverse proxy** (nginx on lab:8080) → **backend** (nginx on srv1:80). You'll see a **200**, then a deliberate **502**, and read the **error.log** — a skill that carries over to Ingress and any API gateway.

## Prerequisites

- [13. nginx](13-nginx.md) has been read.
- srv1 responds: `curl http://172.28.0.11/` → 200 (if not — install nginx on srv1).
- lab with sudo.

```bash
docker compose exec lab bash
sudo apt install -y nginx curl
curl -s -o /dev/null -w "srv1=%{http_code}\n" http://172.28.0.11/
```

---

## Preparing the stand

```bash
sudo systemctl enable --now nginx
ss -tlnp | grep nginx
```

---

## Task 1. Checking the backend directly

**Why:** to separate "the backend is broken" from "the proxy is broken".

```bash
curl -s http://172.28.0.11/ | head -5
curl -s -o /dev/null -w "direct srv1: %{http_code}\n" http://172.28.0.11/
```

Write down: **direct = 200** (expected).

---

## Task 2. Proxy config on lab

**Why:** a single entry point :8080.

```bash
sudo tee /etc/nginx/sites-available/srv1-proxy <<'EOF'
server {
    listen 8080;
    listen [::]:8080;
    server_name _;

    access_log /var/log/nginx/proxy-access.log;
    error_log  /var/log/nginx/proxy-error.log warn;

    location / {
        proxy_pass http://172.28.0.11;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_connect_timeout 5s;
        proxy_read_timeout 30s;
    }
}
EOF
sudo rm -f /etc/nginx/sites-enabled/default
sudo ln -sf /etc/nginx/sites-available/srv1-proxy /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
ss -tlnp | grep 8080
```

**What you'll see:** `syntax is ok`, LISTEN on **8080**.

**If nginx -t fails:** check the log path, the braces in server {}.

---

## Task 3. A successful request through the proxy

```bash
curl -s http://127.0.0.1:8080/ | head -8
curl -s -o /dev/null -w "via proxy: %{http_code}\n" http://127.0.0.1:8080/
curl -v http://127.0.0.1:8080/ 2>&1 | grep -E "Connected|HTTP/"
```

**What you'll see:** the same HTML as from srv1 directly; **HTTP/1.1 200**.

```bash
sudo tail -2 /var/log/nginx/proxy-access.log
```

---

## Task 4. The 502 scenario — backend turned off

**Why:** to learn to read error.log.

On srv1 (in another session):

```bash
ssh course@172.28.0.11 'sudo systemctl stop nginx'
```

On lab:

```bash
curl -s -o /dev/null -w "via proxy: %{http_code}\n" http://127.0.0.1:8080/
sudo tail -5 /var/log/nginx/proxy-error.log
```

**What you'll see:** code **502** and a line like `connect() failed (111: Connection refused)`.

Restore the backend:

```bash
ssh course@172.28.0.11 'sudo systemctl start nginx'
curl -s -o /dev/null -w "via proxy: %{http_code}\n" http://127.0.0.1:8080/
```

---

## Task 5. Host header (optional)

```bash
curl -s http://127.0.0.1:8080/ -H 'Host: test.lab.local' -o /dev/null -w "%{http_code}\n"
```

The backend srv1 with a default server usually serves the page anyway — for an API the exact Host sometimes matters.

---

## Cleanup (optional)

```bash
sudo rm -f /etc/nginx/sites-enabled/srv1-proxy
sudo ln -sf /etc/nginx/sites-available/default /etc/nginx/sites-enabled/ 2>/dev/null || true
sudo systemctl reload nginx
```

Keep the proxy config if you're doing the [final project](34-final-project.md).

---

## Success criteria

- [ ] direct srv1 → 200
- [ ] via :8080 → 200 with a live backend
- [ ] on stopping nginx on srv1 → 502 + an entry in proxy-error.log
- [ ] backend restored → 200 again

## What to take away

- 502 — always the backend/upstream, not "the internet".
- Check: curl the backend from the **same machine** where the nginx proxy runs.

Next lesson: [15. Apache](15-apache.md).
