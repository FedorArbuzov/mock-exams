# 04. Lab: HSTS and security headers on the edge

## Goal

Add a set of security headers to the stand's HTTPS `server`, verify them with `curl -I`, and make sure `nginx -t` / `reload` pass without errors.

## Prerequisites

- [02-lab-https](02-lab-https.md) is done: TLS works on :8443
- [03-security-headers](03-security-headers.md) has been read

---

## Task 1. Config backup

```bash
cd deploy/nginx
cp config/conf.d/10-tls.conf config/conf.d/10-tls.conf.bak
```

---

## Task 2. Add headers to 10-tls.conf

Inside `server { listen 443 ssl; ... }`, **after** the `ssl_*` directives and **before** `location`, add:

```nginx
    add_header Strict-Transport-Security "max-age=86400" always;
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header Referrer-Policy "strict-origin-when-cross-origin" always;
```

Use **86400** (1 day) for the lab, not a year.

```bash
docker compose exec edge nginx -t
docker compose exec edge nginx -s reload
```

---

## Task 3. Verifying the headers

```bash
curl -skI https://localhost:8443/ | grep -iE 'strict-transport|x-frame|x-content|referrer'
curl -skI https://localhost:8443/static/ | grep -i strict-transport
curl -skI https://localhost:8443/api/health | grep -i x-content
```

**Expected:** all four headers are present on the root and on `/static/`, `/api/health`.

Write down the full value of `Strict-Transport-Security`.

---

## Task 4. Behavior without always (demo)

Temporarily remove `always` from one header and force an artificial 502 (stop api: `docker compose stop api`), then:

```bash
curl -skI https://localhost:8443/api/health
docker compose start api
```

Discuss: did `X-Content-Type-Options` appear on the 502 response? Restore `always` and repeat — the headers should remain.

---

## Task 5. HTTP must not send HSTS (control)

```bash
curl -sI http://localhost:8080/ | grep -i strict-transport
```

**Expected:** empty (HSTS only on the HTTPS server).

---

## Success criteria

- [ ] Four headers on `https://localhost:8443/`
- [ ] `max-age=86400` in HSTS
- [ ] No `Strict-Transport-Security` on HTTP :8080
- [ ] You can explain why `always` is needed

---

## Rollback

```bash
mv config/conf.d/10-tls.conf.bak config/conf.d/10-tls.conf
docker compose exec edge nginx -s reload
```

---

## What's next

[05. Rate limiting](05-rate-limiting.md) — protecting `/login` and the `lab_limit` zone.
