# 05. Rate limiting in nginx

## Intro: one IP and a thousand POST /login

Brute-forcing the login form, scanners, a random DDoS from a bot — a typical threat at the perimeter. The first line of defense is to **limit the request rate** by key (usually IP) **before** the load reaches the application.

nginx does this with the **ngx_http_limit_req_module** (in the standard build). On the stand [`deploy/nginx`](../../deploy/nginx/README.md) the `lab_limit` zone is declared in `config/nginx.conf`, and the `/login` location is in `config/conf.d/00-default.conf`.

In Ingress the analog is the `nginx.ingress.kubernetes.io/limit-rps` annotations or global limits in the [ingress-nginx](../kuber-basic/20-ingress.md) ConfigMap.

## What you'll learn

- `limit_req_zone` — the shared token "bucket".
- `limit_req` in a `location` — applying the zone.
- The `rate`, `burst`, `nodelay` parameters.
- The **429 Too Many Requests** response and what to write in a runbook.

---

## The two-step model

```text
http {
    limit_req_zone $binary_remote_addr zone=lab_limit:10m rate=10r/s;
    ...
    server {
        location /login {
            limit_req zone=lab_limit burst=5 nodelay;
            ...
        }
    }
}
```

| Part | Where | Role |
|-------|-----|------|
| `limit_req_zone` | `http {}` | create a shared memory zone, set the **rate** |
| `limit_req` | `location` | bind the zone to a URI |

The key `$binary_remote_addr` is the client's IPv4/IPv6 in binary form (more compact than `$remote_addr`).

The zone size `10m` holds up to ~160k IP records (estimate from the nginx docs). Enough for the lab.

---

## rate, burst, nodelay

```nginx
limit_req zone=lab_limit burst=5 nodelay;
```

With `rate=10r/s`:

- On average, **10 requests per second** from one IP pass without delay.
- **burst=5** — a "pocket" for short spikes: up to 5 extra requests can be handled at once.
- **nodelay** — extra requests from the burst aren't queued with a delay; they're handled immediately or dropped (depending on how full the burst is).

Without `nodelay` nginx **slows** requests down, smoothing them to the rate — for an API login you usually want a hard cutoff → 429.

The "token bucket" scheme:

```text
rate 10r/s  → replenish 10 tokens/sec
burst 5     → at most 5 tokens in reserve
request     → −1 token; no tokens → 429 (with nodelay, after the burst is exhausted)
```

---

## The /login location on the stand

```nginx
location /login {
    limit_req zone=lab_limit burst=5 nodelay;
    proxy_pass http://api:8080/slow;
    proxy_set_header Host $host;
}
```

The backend `/slow` sleeps ~0.3 s — imitating heavy authorization. Under load you'll see a mix of **200** and **429**.

The full example is [examples/rate-limit.conf](examples/rate-limit.conf).

---

## limit_conn (briefly)

The parallel **limit_conn** module limits the **number of simultaneous connections** from an IP:

```nginx
limit_conn_zone $binary_remote_addr zone=conn_limit:10m;
limit_conn conn_limit 20;
```

Use it to defend against slowloris or to cap long uploads. For a REST login, `limit_req` is usually enough.

---

## Logging 429

In `access.log` the status is **429**. For alerts:

- a 429 / 5m counter in Prometheus (an nginx exporter or log parsing);
- a separate `map` for a custom log format.

Don't confuse an nginx 429 with a 429 from the backend application (an API rate limit).

---

## Behind a proxy and CDN

If a **Cloudflare / ALB** sits in front of nginx, `$remote_addr` is the balancer's IP. You need `set_real_ip_from` + `real_ip_header X-Forwarded-For` and limiting by `$http_x_forwarded_for` or by a trusted CDN header — otherwise it's one key for the whole CDN.

On the learning stand the client talks directly to localhost — `$binary_remote_addr` is correct.

---

## Comparison with the application

| Level | Pro | Con |
|---------|------|--------|
| nginx | cheap, cuts off junk early | doesn't know "user X's login" |
| application | limit per user/account | the load has already entered the process |
| WAF / CDN | global protection | cost, complexity |

Optimal: a coarse limit on the edge + a precise one in the API.

---

## Common mistakes

| Mistake | Symptom |
|--------|---------|
| Forgot `limit_req_zone` | `nginx -t` fail: unknown zone |
| Limit on `/` instead of `/login` | legitimate API traffic gets throttled |
| Too small a burst | 429 under normal CI load |
| No real_ip behind an LB | one balancer IP gets limited |

---

## Summary

Rate limiting in nginx is a zone in `http`, a rule in a `location`. On the stand `/login` is protected by `lab_limit` at 10r/s + burst 5. Verify with `ab` or `hey`, expecting 429.

## Checklist

- [ ] Where is the zone declared, where is it applied?
- [ ] What does `nodelay` do?
- [ ] Why is a 429 on the edge better than overloading the Python API?

Next lesson: [06. Lab: rate limit](06-lab-rate-limit.md).
