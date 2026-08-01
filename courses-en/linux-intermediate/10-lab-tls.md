# 10. Lab: self-signed HTTPS on web

## Lab goal

Issue a key+cert pair, configure **nginx** on **443**, and dissect **curl -v** and **openssl s_client** — so that in production you read TLS errors as calmly as "connection refused".

## Prerequisites

- [09. TLS](09-tls-openssl.md).
- The **web** container (172.28.0.20) is Up.

```bash
ssh course@172.28.0.20
# or: docker compose exec web bash
sudo apt update
sudo apt install -y nginx openssl
```

---

## Preparing the stand

```bash
systemctl is-active nginx 2>/dev/null || true
ss -tlnp | grep -E ':80|:443' || true
```

---

## Task 1. Issuing the certificate

**Why:** without a key nginx won't bring up ssl.

```bash
sudo mkdir -p /etc/ssl/lab
sudo openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
  -keyout /etc/ssl/lab/key.pem \
  -out /etc/ssl/lab/cert.pem \
  -subj "/CN=web.lab.local"
sudo chmod 600 /etc/ssl/lab/key.pem
openssl x509 -in /etc/ssl/lab/cert.pem -noout -subject -dates
openssl rsa -in /etc/ssl/lab/key.pem -check -noout
```

**What you'll see:** `subject=CN = web.lab.local`, `notAfter` in ~365 days, `RSA key ok`.

**If the key check fails:** recreate the pair, don't mix an old key with a new cert.

---

## Task 2. nginx config

```bash
sudo tee /etc/nginx/sites-available/lab-ssl <<'EOF'
server {
    listen 443 ssl;
    listen [::]:443 ssl;
    server_name web.lab.local _;

    ssl_certificate     /etc/ssl/lab/cert.pem;
    ssl_certificate_key /etc/ssl/lab/key.pem;

    location / {
        return 200 "tls-ok\n";
        add_header Content-Type text/plain;
    }
}
EOF
sudo ln -sf /etc/nginx/sites-available/lab-ssl /etc/nginx/sites-enabled/
sudo rm -f /etc/nginx/sites-enabled/default
sudo nginx -t
sudo systemctl enable --now nginx
sudo systemctl reload nginx
ss -tlnp | grep 443
```

**If `nginx -t` fails:** the paths to the pem files, the `ssl_certificate` syntax; `journalctl -u nginx -n 20`.

---

## Task 3. curl locally on web

```bash
curl -k -s https://127.0.0.1/
curl -v https://127.0.0.1/ 2>&1 | grep -E "SSL certificate|subject:|issuer:|verify"
```

**What you'll see:** the body `tls-ok`; without `-k` — a verify error (self-signed).

---

## Task 4. openssl s_client

```bash
echo | openssl s_client -connect 127.0.0.1:443 -servername web.lab.local 2>/dev/null \
  | openssl x509 -noout -subject -issuer -dates
```

**Why:** the same thing curl does at the cert-verification stage.

---

## Task 5. From lab over the network

On **lab**:

```bash
curl -k -s https://172.28.0.20/
curl -v https://172.28.0.20/ 2>&1 | head -25
openssl s_client -connect 172.28.0.20:443 -servername web.lab.local </dev/null 2>/dev/null \
  | openssl x509 -noout -subject
```

| Problem | Check |
|----------|----------|
| timeout | `ping 172.28.0.20`, ufw (later), `ss -tlnp \| grep 443` on web |
| connection refused | nginx isn't listening on 443 |

---

## Task 6. The error without -k (educational)

```bash
curl -s https://172.28.0.20/ 2>&1 | head -5
```

**Expected:** `SSL certificate problem: self signed certificate` (or similar) — this is **normal** for the lab.

---

## Task 7. Mismatched key/cert pair (optional)

**Only if you're ready to roll back:**

```bash
sudo mv /etc/ssl/lab/key.pem /etc/ssl/lab/key.pem.bak
sudo openssl req -x509 -nodes -days 30 -newkey rsa:2048 \
  -keyout /etc/ssl/lab/key.pem -out /etc/ssl/lab/cert2.pem -subj "/CN=other"
# deliberately point nginx at the old cert and run nginx -t
sudo nginx -t
sudo mv /etc/ssl/lab/key.pem.bak /etc/ssl/lab/key.pem
sudo nginx -t
```

**Why:** to see the key/cert mismatch error before prod.

---

## Cleanup (optional)

```bash
sudo rm -f /etc/nginx/sites-enabled/lab-ssl
sudo ln -sf /etc/nginx/sites-available/default /etc/nginx/sites-enabled/ 2>/dev/null || true
sudo systemctl reload nginx
```

---

## Success criteria

- [ ] `nginx -t` OK, listen 443
- [ ] `curl -k` from lab → tls-ok
- [ ] `openssl x509` shows CN web.lab.local
- [ ] You understand why `-k` is only for the lab

## What to take away

- "TLS is broken" → `openssl s_client`, `nginx -t`, perms 600 on the key.
- Expiry — into monitoring 30 days out.
- Hostname mismatch — check the URL against the SAN.

Next lesson: [11. Network diagnostics](11-network-debug.md).
