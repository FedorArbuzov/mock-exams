# 02. Stand architecture: processes, config, compose

## Intro: three containers — one entry point

The [`deploy/nginx`](../../deploy/nginx/README.md) stand models a production layout: only the **edge** is reachable from the host (`localhost:8080` and `8443`), while the backends live in the **internal** network. You edit configs on disk, mount them into `mock-nginx-edge`, run **`nginx -t`**, and do a **reload** — without rebuilding the edge image.

This chapter is a map of the directories, nginx processes, and the connection to Docker DNS. The practice for vhost and static content is in [lab 03](03-lab-vhost-static.md).

## What you'll learn

- The **edge → static / api** scheme.
- **master / worker** inside the container.
- The `nginx.conf` and `conf.d/*.conf` files.
- Compose service names as upstreams.

## Topology

```text
Host :8080, :8443
        │
   mock-nginx-edge (nginx:1.27-alpine)
        ├── /static/  → proxy_pass → mock-nginx-static:80
        ├── /api/     → proxy_pass → mock-nginx-api:8080
        └── /         → return 200 'edge OK'
```

| Container | hostname | Port inside the network | Role |
|-----------|----------|------------------|------|
| mock-nginx-edge | edge | 80, 443 | reverse proxy |
| mock-nginx-static | static | 80 | HTML from a volume |
| mock-nginx-api | api | 8080 | `/health`, `/hits` |

Full compose: [`docker-compose.yml`](../../deploy/nginx/docker-compose.yml). Edge logs are written to `deploy/nginx/logs/` on the host (bind mount).

## The master and worker processes

Inside the edge container:

```bash
docker compose exec mock-nginx-edge ps aux
```

As expected: one **master** (root) and several **workers** (user `nginx`). The master reads the config and opens the ports; the workers handle connections. That is why after editing the config a **reload** is enough — the workers re-read the config on a signal, and old connections finish being served.

| Action | Command |
|----------|---------|
| Syntax check | `docker compose exec mock-nginx-edge nginx -t` |
| Pick up the config | `docker compose exec mock-nginx-edge nginx -s reload` |
| Logs | `docker compose logs -f edge` or `tail -f logs/error.log` |

On a VM the same commands go through `systemctl reload nginx` — see [linux-intermediate/13](../linux-intermediate/13-nginx.md).

## Configuration files

```text
deploy/nginx/
├── config/
│   ├── nginx.conf          # http {}, log_format, include conf.d
│   └── conf.d/
│       ├── 00-default.conf # HTTP :80 — main locations
│       ├── 10-tls.conf     # HTTPS :443 (certs required)
│       └── 20-rate-limit.conf  # intermediate
├── certs/                  # server.crt after gen-certs.sh
├── logs/                   # access.log, error.log on the host
└── backends/
    ├── static/html/
    └── api/
```

The main file [`nginx.conf`](../../deploy/nginx/config/nginx.conf):

- `worker_processes auto;`
- `include /etc/nginx/mime.types;`
- `access_log` / `error_log`
- `include /etc/nginx/conf.d/*.conf;`

The HTTP edge fragment — [`00-default.conf`](../../deploy/nginx/config/conf.d/00-default.conf). The load order is **by file name** (`00` before `10`).

## The server and location blocks

```nginx
server {
    listen 80;
    server_name localhost lab.local;

    location /static/ {
        proxy_pass http://static:80/;
        # ...
    }
}
```

| Directive | Purpose |
|-----------|------------|
| `listen 80` | port inside the container (8080→80 on the host) |
| `server_name` | vhost selection by the Host header |
| `location /static/` | URI prefix |
| `proxy_pass http://static:80/` | upstream by the compose **service name** |

**static** and **api** are Docker DNS names in the `internal` network, not `127.0.0.1` on the edge.

## Publishing ports

```yaml
edge:
  ports:
    - "8080:80"
    - "8443:443"
```

Only the edge is on the host. An attempt to run `curl http://api:8080` **from the laptop** won't work — api is not published. Checking the backend **from the edge**:

```bash
docker compose exec mock-nginx-edge wget -qO- http://api:8080/health
```

## Smoke and health

```bash
cd deploy/nginx
docker compose up -d --build
bash scripts/smoke.sh
```

Smoke checks `/`, `/static/`, `/api/health`. The API has a **healthcheck** in compose — the edge may start before the api; on a 502 for `/api/` check `docker compose ps` and the api logs.

## Difference from deploy/containers

| | deploy/containers | deploy/nginx |
|--|-------------------|--------------|
| Edge | web (nginx + static in one) | separate edge |
| API | Flask | minimal Python HTTP |
| Port | 8088 | 8080, 8443 |

The web config: [`stack/web/nginx.conf`](../../deploy/containers/stack/web/nginx.conf) — the same trick `location /api/ { proxy_pass http://api:8080/; }`.

## Common mistakes

| Symptom | Cause |
|---------|---------|
| conf changes not visible | forgot to reload after -t |
| `host not found` in error.log | wrong upstream name (not the service name) |
| HTTPS not listening | no certificates, see `10-tls.conf` |
| Editing the wrong file | another server{} intercepts the Host |

## In production

- Configs — a **ConfigMap** + sidecar, or the ingress-nginx chart.
- Separate **access/error** logs per vhost (`access_log` in the server).
- `worker_connections` and `worker_processes` tuned to the load profile.

## Summary

The course stand is **edge + static + api**, one compose network, ports **8080/8443** on the host. The config is layered: `nginx.conf` → `conf.d/*.conf`. Any change: **`nginx -t`**, then **reload**. The next lab — walk through static content and vhost by hand.

## Checklist

- Which three containers are in the stand?
- Where are the locations for `/api/`?
- Why is the upstream `http://api:8080`, and not localhost?
- The syntax check command?

Next lesson: [03. Lab: vhost and static content](03-lab-vhost-static.md).
