# 02. Lab: HTTPS on the deploy/nginx stand

## Goal

Enable TLS on the edge, confirm that the API and static are reachable over **https://localhost:8443**, and read the certificate via **openssl** / **curl -v**. Reinforce the material from [09-tls-openssl](../linux-intermediate/09-tls-openssl.md) and [01-tls-termination](01-tls-termination.md).

## Prerequisites

- The stand is running: `cd deploy/nginx && docker compose up -d --build`
- `bash scripts/smoke.sh` — HTTP 200 on :8080
- Chapters 01 and [linux-intermediate/09-tls-openssl](../linux-intermediate/09-tls-openssl.md) have been read

---

## Task 1. Generating certificates

**Why:** without `server.crt`, nginx won't bring up `listen 443 ssl`.

```bash
cd deploy/nginx
bash scripts/gen-certs.sh
ls -la certs/
```

**Expected:** `server.crt`, `server.key`; in the script's output — `OK: certs/server.crt`.

Checking the SAN:

```bash
openssl x509 -in certs/server.crt -noout -ext subjectAltName
```

There should be `localhost`, `lab.local`, `127.0.0.1`.

---

## Task 2. Verifying the TLS configuration

Open `config/conf.d/10-tls.conf` and compare it with [examples/ssl-server-block.conf](examples/ssl-server-block.conf).

```bash
docker compose exec edge nginx -t
docker compose exec edge nginx -s reload
```

**Expected:** `syntax is ok`, `test is successful`.

If there's a certificate error — the path `/etc/nginx/certs/` in the container must match the volume in `docker-compose.yml`.

---

## Task 3. Requests over HTTPS

```bash
curl -sk https://localhost:8443/
curl -sk https://localhost:8443/api/health
curl -sk https://localhost:8443/static/ | head -5
```

| URL | Expected response |
|-----|-----------------|
| `/` | `nginx lab TLS OK` |
| `/api/health` | `ok` |
| `/static/` | HTML index |

Compare with HTTP:

```bash
curl -s http://localhost:8080/api/health
```

Both should return `ok`.

---

## Task 4. Inspecting the handshake

```bash
curl -vk https://localhost:8443/ 2>&1 | head -40
```

Find in the output:

- the TLS version (1.2 or 1.3);
- the cert subject/issuer;
- the `SSL certificate problem` warning (self-signed) — this is normal without `-k` under strict verification.

```bash
echo | openssl s_client -connect localhost:8443 -servername localhost 2>/dev/null \
  | openssl x509 -noout -subject -issuer -dates
```

**issuer** ≈ **subject** — a sign of self-signed.

---

## Task 5. X-Forwarded-Proto (optional)

In `10-tls.conf` for `/api/`, `X-Forwarded-Proto https` is already set. Make sure that in `00-default.conf` on HTTP it's `$scheme`.

**Thought experiment:** if the backend returns a redirect to `http://` for a request made over HTTPS — which header would you check in the api logs?

---

## Task 6. An intentional error (2 min)

Rename the cert and check `nginx -t`:

```bash
mv certs/server.crt certs/server.crt.bak
docker compose exec edge nginx -t
mv certs/server.crt.bak certs/server.crt
```

**Expected:** `cannot load certificate` — remember the text for the runbook.

---

## Success criteria

- [ ] `gen-certs.sh` executed, files in `certs/`
- [ ] `nginx -t` OK, reload without errors
- [ ] `curl -sk https://localhost:8443/api/health` → `ok`
- [ ] `openssl x509` shows the SAN with localhost
- [ ] You can explain in one phrase why `-k` in the lab and why it isn't used in prod

---

## Troubleshooting

| Symptom | Action |
|---------|----------|
| Connection refused :8443 | `docker compose ps`, port 8443 in compose |
| SSL error | cert not generated or not mounted |
| 502 on `/api/` | `docker compose logs api`, healthcheck |

See [deploy/nginx/README.md](../../deploy/nginx/README.md).

---

## What's next

[03. Security headers](03-security-headers.md) — HSTS and browser protection on the same TLS `server`.
