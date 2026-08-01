# 03. Lab: vhost and static content through the edge

## Lab goal

Bring up the `deploy/nginx` stand, verify **routing by path**, make sure **static content** goes through the edge to the **static** backend, and practice the **edit conf → nginx -t → reload** cycle.

## Prerequisites

- Ports **8080** and **8443** are free.
- Theory: [01](01-why-nginx.md), [02](02-architecture.md).
- Docker Compose v2 (`docker compose`).

---

## Task 1. Start the stand

```bash
cd deploy/nginx
docker compose up -d --build
docker compose ps
```

**What you'll see:** `mock-nginx-api`, `mock-nginx-static`, `mock-nginx-edge` — State **running**; the api becomes **healthy** after a while.

---

## Task 2. Edge health and server_name

```bash
curl -s http://localhost:8080/
curl -s http://localhost:8080/ -H 'Host: lab.local'
```

**What you'll see:** the body `nginx lab edge OK` — `location /` in `00-default.conf`.

---

## Task 3. Static content through the proxy

```bash
curl -s http://localhost:8080/static/ | head -5
bash scripts/smoke.sh
```

**What you'll see:** the HTML `<h1>Static backend</h1>`; smoke — `OK: nginx smoke passed`.

**Why:** the request does not read files from the edge's disk — the edge **proxies** to `static:80`.

---

## Task 4. Direct access to static (from the compose network)

```bash
docker compose exec mock-nginx-edge wget -qO- http://static/
```

**What you'll see:** the same HTML without the `/static/` prefix on the backend (static's root is `/usr/share/nginx/html`).

---

## Task 5. Change the static page

Edit [`backends/static/html/index.html`](../../deploy/nginx/backends/static/html/index.html) — add a line, for example `<p>Lab 03</p>`.

```bash
curl -s http://localhost:8080/static/ | grep Lab
```

**What you'll see:** the new text **without** rebuilding the edge (the volume is only on static).

---

## Task 6. Check and reload the edge

Simulate a "safe config deploy":

```bash
docker compose exec mock-nginx-edge nginx -t
docker compose exec mock-nginx-edge nginx -s reload
```

Add a header to `location /` in `config/conf.d/00-default.conf`:

```nginx
add_header X-Lab nginx-basic-03;
```

Repeat `-t` and `reload`, then:

```bash
curl -sI http://localhost:8080/ | grep -i X-Lab
```

**What you'll see:** `X-Lab: nginx-basic-03`.

**If `nginx -t` fails:** fix the syntax; do **not** reload until it is ok.

---

## Task 7. Comparison with containers-basic

Open [`deploy/containers/stack/web/nginx.conf`](../../deploy/containers/stack/web/nginx.conf).

**Questions (write down the answers):**

1. How is static content served there — `root` or `proxy_pass`?
2. Where does `/api/` go?

---

## Success criteria

- [ ] `curl localhost:8080/` → edge OK
- [ ] `curl localhost:8080/static/` → Static backend
- [ ] `nginx -t` in `mock-nginx-edge` without errors
- [ ] After the reload the `X-Lab` header is visible
- [ ] You understand why static is a separate container

## If something went wrong

| Symptom | Action |
|---------|----------|
| Connection refused :8080 | `docker compose ps`, is the edge running? |
| 404 on `/static/` | compare `location /static/` and `proxy_pass` with [`00-default.conf`](../../deploy/nginx/config/conf.d/00-default.conf) |
| 502 on `/static/` | `docker compose logs static` |

Next lesson: [04. Reverse proxy](04-reverse-proxy.md).
