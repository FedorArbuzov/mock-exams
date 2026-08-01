# 07. Lab: an intentional 502 and log analysis

## Lab goal

Get a **502** on `/api/health` while the edge is alive, find the cause in the **error.log**, restore the api, and confirm a **200**. The skill carries over to Ingress and any API gateway.

## Prerequisites

- Theory: [06. Logs and 502](06-logs-502.md).
- The `deploy/nginx` stand is working.

---

## Task 1. Baseline

```bash
cd deploy/nginx
curl -s -o /dev/null -w "api via edge: %{http_code}\n" http://localhost:8080/api/health
curl -s -o /dev/null -w "edge root: %{http_code}\n" http://localhost:8080/
```

**What you'll see:** both **200**.

---

## Task 2. Stop the upstream

```bash
docker compose stop api
curl -s -o /dev/null -w "api via edge: %{http_code}\n" http://localhost:8080/api/health
curl -s -o /dev/null -w "static: %{http_code}\n" http://localhost:8080/static/
```

**What you'll see:** api → **502**; static → **200** (the edge is alive, only the upstream is broken).

---

## Task 3. error.log

In a separate terminal:

```bash
tail -f logs/error.log
```

Repeat the `curl` on `/api/health`.

**What you'll see:** a line like `connect() failed ... Connection refused` and `upstream: "http://api:8080/health"` (the exact text may differ slightly).

Copy one line into your answer to the question "why the 502?".

---

## Task 4. access.log

```bash
tail -3 logs/access.log
```

**What you'll see:** the request to `/api/health` with status **502**.

---

## Task 5. Check from the edge

```bash
docker compose exec mock-nginx-edge wget -qO- http://api:8080/health
```

**What you'll see:** a connection error (the api is stopped) — it confirms that the **backend** is what needs fixing, not an edge reload.

---

## Task 6. Recovery

```bash
docker compose start api
sleep 3
docker compose ps api
curl -s http://localhost:8080/api/health
```

**What you'll see:** `ok` again.

---

## Task 7. Wrong upstream (optional)

In `00-default.conf` temporarily replace `http://api:8080/` with `http://api:9999/`, `nginx -t`, reload, curl `/api/health`.

**What you'll see:** a 502 again, and in the error.log — refused on port 9999.

Put back `8080`, `-t`, reload.

---

## Success criteria

- [ ] With the api stopped — 502 only on `/api/`, not on `/static/`
- [ ] The connection refused cause is found in the error.log
- [ ] After `compose start api` — 200
- [ ] You can explain "edge vs backend" to a colleague in 30 seconds

## Comparison with linux-intermediate

In [lab 14](../linux-intermediate/14-lab-nginx.md) the 502 was obtained by stopping nginx on **srv1**. Here — by stopping the **api container**. The error.log logic is the same.

Next lesson: [08. upstream](08-upstream.md).
