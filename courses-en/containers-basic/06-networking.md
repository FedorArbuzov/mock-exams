# 06. Docker networks: bridge, publish, compose networks

## Intro: "why couldn't the api reach redis"

A developer publishes Redis on `6379` "for convenience" — from the host and from the internet. Security opens a ticket: **the database must not be on localhost**. The correct scheme: **only api** in the `backend` network, **web** proxies **one** port `8088` outward. This chapter is about the **Docker network model** and the stand's **compose networks**.

## What you'll learn

- The **bridge** driver and DNS by **service name**.
- **Publish** (`ports`) vs **expose** inside the network.
- The **frontend / backend** pattern in [`deploy/containers`](../../deploy/containers/docker-compose.yml).
- The nginx reverse proxy: `/api/` → `http://api:8080/`.

## Bridge network

By default, Docker creates a **bridge** — a virtual L2 segment on the host. Containers in the same user-defined network resolve each other:

```text
web  →  api:8080     (hostname = service name / container_name)
api  →  redis:6379
```

| Concept | Description |
|---------|----------|
| `hostname` / service name | DNS inside the network |
| `ports: "8088:80"` | NAT to the host |
| No `ports` | the service is **only inside** Docker |

On the stand, **redis** has no `ports:` — from the host `redis-cli -h 127.0.0.1` will **not** connect (unless published separately).

## Publish and EXPOSE

| Mechanism | Effect |
|----------|--------|
| `EXPOSE 8080` in the Dockerfile | documentation |
| `ports` in compose | access from the **host** |
| `expose` in compose | between compose services (rare on the stand) |

Publishing the **minimum ports** — a smaller attack surface ([`linux-intermediate`](../linux-intermediate/08-nginx.md) — reverse proxy).

## Two networks on the stand

```yaml
networks:
  frontend:
  backend:

services:
  web:
    networks: [frontend]
  api:
    networks: [frontend, backend]
  redis:
    networks: [backend]
```

```mermaid
flowchart LR
  Host[Host :8088] --> web[web nginx]
  web -->|frontend| api[api Flask]
  api -->|backend| redis[redis]
```

| Member | frontend | backend | Access from host |
|----------|----------|---------|----------------|
| web | yes | no | :8088 |
| api | yes | yes | no (only via nginx) |
| redis | no | yes | no |

**web does not see redis directly** — only via api (correct tier separation).

## nginx proxy_pass

A snippet of [`nginx.conf`](../../deploy/containers/stack/web/nginx.conf):

```nginx
location /api/ {
    proxy_pass http://api:8080/;
}
```

The request `GET /api/health` → upstream `GET http://api:8080/health`. The trailing slash in `proxy_pass` is **important** — otherwise the path `/api/health` will be forwarded incorrectly.

## User-defined networks vs the default bridge

| | default bridge | user-defined (compose) |
|---|----------------|-------------------------|
| DNS by name | no (legacy links) | yes |
| Project isolation | weak | a separate network per project |
| Recommendation | avoid | **compose networks** |

## On the stand: checks

```bash
docker network ls | grep containers
docker network inspect deploy-containers_frontend --format '{{range .Containers}}{{.Name}} {{end}}'
curl -s http://localhost:8088/api/hits
```

A second call to `/api/hits` will increment the counter — the traffic went web → api → redis.

## Common mistakes

| Mistake | Symptom | Fix |
|--------|---------|-------------|
| `localhost` inside a container | hits the **container itself** | the service hostname `redis`, `api` |
| Publishing redis "just for a minute" | data leak | remove `ports` |
| api and web in different compose projects | DNS doesn't resolve | one network / one compose file |
| Incorrect `proxy_pass` without `/` | 404 on `/api/*` | as on the stand |
| `host` network mode for no reason | breaks isolation | only for special cases |

## In production

- **Ingress / ALB** — a single entry into the cluster; internally — ClusterIP.
- **Network policies** (K8s) — the analog of "redis only from api".
- TLS at the edge (nginx, traefik), not necessarily in every microservice.
- A service mesh — on top of the same L4/L7 rules (advanced).

## Interview notes

- Containers in the same user-defined network — **one DNS namespace**.
- `host.docker.internal` (Desktop) — access to the host from a container.
- `docker compose port web 80` — find the published port.

## Summary

A Docker network is **tier isolation** and **internal DNS**. The compose networks `frontend`/`backend` model a DMZ: only web:8088 is exposed outward, data lives in the backend. The next lab — verify by hand that redis is unreachable from the host, while api is reachable from web.

## Checklist

- Why `REDIS_HOST=redis` and not `localhost`?
- How many networks does the api service have on the stand?
- What does `proxy_pass http://api:8080/` do?
- How do you call hits from the host without direct access to redis?

Next lesson: [07. Lab: networks](07-lab-networks.md).
