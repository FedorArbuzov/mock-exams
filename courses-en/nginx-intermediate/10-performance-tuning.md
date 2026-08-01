# 10. nginx performance tuning

## Intro: "nginx can't handle the load"

More often the bottleneck isn't a "weak nginx" but **too few workers**, a **low `worker_connections`**, a short **keepalive**, a blocking backend, or the disk for logs. This chapter covers the basic knobs on the stand [`deploy/nginx/config/nginx.conf`](../../deploy/nginx/config/nginx.conf) without going into kernel tuning (`somaxconn`, `epoll` — a linux-advanced topic).

Link to [nginx-basic](../nginx-basic/README.md): the master/worker model is already familiar; here we cover the **numbers**.

## What you'll learn

- `worker_processes` and `worker_connections`.
- Estimating "how many simultaneous clients".
- `keepalive_timeout` and keepalive to the upstream.
- `sendfile`, `tcp_nopush`, the access log.

---

## The process model

```nginx
user  nginx;
worker_processes auto;
```

| Directive | Recommendation |
|-----------|----------------|
| `worker_processes auto` | by the number of CPUs on bare metal / VM |
| in a container | often `1`–`2` due to the CPU cgroup limit — `auto` is fine |

Each worker is a separate process, not a thread. If one worker crashes, the master restarts it.

---

## worker_connections

```nginx
events {
    worker_connections 1024;
}
```

A rough upper estimate of simultaneous **client** connections:

```text
max_clients ≈ worker_processes × worker_connections
```

In practice it's lower: one browser connection + an **upstream** connection + internal redirects. For a reverse proxy, a **×2** factor is sometimes accounted for.

Example: `auto` → 4 workers, `1024` → theoretically ~4096 client sockets. In a Docker lab with `worker_processes 1` and `1024` — enough for `ab` and learning tests.

Increasing it without need:

- more RAM per connection;
- you hit `ulimit -n` — see `worker_rlimit_nofile` in prod.

```nginx
events {
    worker_connections 4096;
}
# worker_rlimit_nofile 8192;  # in the main context, prod
```

---

## keepalive_timeout (client ↔ nginx)

On the stand:

```nginx
keepalive_timeout 65;
```

| Effect | Meaning |
|--------|----------|
| Higher (75–120s) | fewer new TCP/TLS handshakes for "roaming" clients |
| Lower (5–15s) | worker_connections slots freed up faster |

For an API with short requests it's sometimes lowered. For an SPA with constant requests — kept higher.

**keepalive_requests** — how many requests over one keep-alive connection before it closes (1000 by default).

---

## keepalive to the upstream (nginx ↔ backend)

Without keepalive, nginx opens a new TCP to the backend for **every** client request:

```nginx
upstream api_backend {
    server api:8080;
    keepalive 32;
}

location /api/ {
    proxy_pass http://api_backend;
    proxy_http_version 1.1;
    proxy_set_header Connection "";
    ...
}
```

| Directive | Why |
|-----------|--------|
| `keepalive 32` in the upstream | a connection pool to the backend |
| `proxy_http_version 1.1` | required for keepalive to the upstream |
| `Connection ""` | reset the hop-by-hop Connection |

On the learning stand with little traffic the benefit is small; in prod with thousands of RPS — substantial.

---

## sendfile and tcp

```nginx
sendfile on;
tcp_nopush on;
tcp_nodelay on;
```

`sendfile` — serving static without an extra copy into userspace (if nginx serves files from disk). For `proxy_pass` it's less critical.

---

## Logging under load

`access_log` on every request is disk I/O. High-load edges:

- buffer: `access_log /var/log/nginx/access.log main buffer=32k flush=5s`;
- sampling or disabling healthcheck paths via `map` + `access_log off`;
- a separate format without heavy fields.

On the stand, leave the logs enabled for learning.

---

## TLS performance (briefly)

- TLS 1.3 has fewer round-trips.
- Session tickets / cache — faster repeat handshakes.
- Termination is CPU-bound — then 2+ workers and hardware acceleration (in the cloud — on the LB).

Cipher details — mozilla ssl-config-generator; in the lab `TLSv1.2 TLSv1.3` from `10-tls.conf` is enough.

---

## Container vs bare metal

| Factor | Container edge |
|--------|----------------|
| CPU limit | fewer workers effective |
| Network | bridge, not a 10 Gbps NIC |
| Cache disk | a volume is slower than tmpfs |

"Prod-like" tuning is done on a VM/bare metal or on a managed LB; in the course you understand the **meaning** of the parameters and check `nginx -T` (a full config dump).

---

## Verification on the stand

```bash
docker compose exec edge nginx -T | grep -E 'worker_processes|worker_connections|keepalive'
ab -n 2000 -c 50 http://localhost:8080/api/health
docker compose exec edge sh -c 'ps aux | grep nginx'
```

Compare the load before/after lowering `worker_connections` to 256 with `ab -c 100` — when there aren't enough slots, `worker_connections are not enough` will appear in error.log.

---

## Link to Ingress

The Ingress Controller — the same workers, plus **horizontal scaling** of Pod replicas. HPA by CPU/latency in [kuber-intermediate](../kuber-intermediate/README.md) complements the vertical tuning of a single nginx.

---

## Summary

Edge nginx performance: enough workers, `worker_connections` with headroom, a reasonable keepalive, keepalive to the upstream, careful logs. On the stand, change the parameters deliberately and watch `error.log`.

## Checklist

- [ ] The max_clients formula?
- [ ] Why keepalive in the `upstream`?
- [ ] Why does WS require a large `proxy_read_timeout`?

Next lesson: [11. Final project](11-final-project.md).
