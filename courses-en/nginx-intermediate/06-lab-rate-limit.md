# 06. Lab: rate limit on /login

## Goal

See `limit_req` in action on **http://localhost:8080/login**: on a spike of requests — **429 Too Many Requests** responses; analyze the zone and location config.

## Prerequisites

- The stand is running, [05-rate-limiting](05-rate-limiting.md) has been read
- `ab` (ApacheBench) is installed, or use a `curl` loop

---

## Task 1. Study the config

```bash
grep -n limit deploy/nginx/config/nginx.conf
grep -n -A5 '/login' deploy/nginx/config/conf.d/00-default.conf
```

Match it against [examples/rate-limit.conf](examples/rate-limit.conf):

- zone: `lab_limit`, `rate=10r/s`, memory `10m`;
- location: `burst=5 nodelay`, `proxy_pass` to `/slow`.

---

## Task 2. A single request

```bash
curl -s -o /dev/null -w "%{http_code}\n" http://localhost:8080/login
curl -s http://localhost:8080/login
```

**Expected:** `200`, body `slow ok`.

---

## Task 3. A spike (ApacheBench)

```bash
ab -n 50 -c 10 http://localhost:8080/login
```

In the summary, find:

- **Non-2xx responses** (should be 429);
- **Complete requests** = 50.

Example interpretation: some requests 200, some 429 — the limit kicked in.

If there's no `ab` (Windows):

```powershell
1..30 | ForEach-Object -Parallel {
  try { (Invoke-WebRequest -Uri http://localhost:8080/login -UseBasicParsing).StatusCode } catch { $_.Exception.Response.StatusCode.value__ }
} -ThrottleLimit 15
```

Or bash:

```bash
for i in $(seq 1 30); do
  curl -s -o /dev/null -w "%{http_code}\n" http://localhost:8080/login &
done
wait
```

---

## Task 4. Logs

```bash
docker compose exec edge tail -20 /var/log/nginx/access.log
```

Find the lines with status **429** and URI `/login`.

---

## Task 5. Change the rate (experiment)

In `config/nginx.conf`, temporarily set `rate=2r/s`, reload, and repeat `ab -n 20 -c 5`.

**Expected:** more 429s. Restore `10r/s` after the experiment.

```bash
docker compose exec edge nginx -t
docker compose exec edge nginx -s reload
```

---

## Task 6. Control: /api/health without a limit

```bash
ab -n 100 -c 20 http://localhost:8080/api/health
```

**Expected:** almost all **200** (the limit isn't on this location).

---

## Success criteria

- [ ] You can explain the purpose of `limit_req_zone` and `limit_req`
- [ ] With `ab -n 50 -c 10` on `/login` there are 429s
- [ ] `/api/health` under the same load isn't throttled
- [ ] 429s are visible in access.log

---

## Troubleshooting

| Symptom | Action |
|---------|----------|
| All 200 with ab | rate too high; increase `-n` and `-c` |
| All 502 | api isn't running |
| 404 | URI without trailing slash — use `/login` as in the config |

---

## What's next

[07. Cache and gzip](07-caching-gzip.md) — compressing and caching responses on the edge.
