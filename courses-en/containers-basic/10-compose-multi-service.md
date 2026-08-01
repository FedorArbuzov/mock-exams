# 10. Multi-service Compose: a three-tier stack

## Intro: one YAML instead of three runs

Instead of a script "first redis, then api, then nginx," the team keeps a **`docker-compose.yml`**: dependencies, networks, healthchecks, a single `up` command. This is **infrastructure as code** for the local environment and CI smoke. This chapter breaks down the [`deploy/containers`](../../deploy/containers/README.md) stack: **web → api → redis**.

## What you'll learn

- The structure of a **compose file** (services, networks, volumes).
- **`depends_on`** and **healthcheck**.
- **build** vs **image**.
- Naming conventions and the smoke test.

## Stand architecture

```text
Browser → localhost:8088 → web (nginx)
                              ↓ /api/*
                            api (Flask :8080)
                              ↓
                            redis (:6379, internal)
```

| Service | Image | Role |
|--------|-------|------|
| web | build `stack/web` | static + reverse proxy |
| api | build `stack/api` | REST, counter in redis |
| redis | `redis:7.2-alpine` | hits storage |

Full file: [`docker-compose.yml`](../../deploy/containers/docker-compose.yml). Snippet: [`examples/compose-snippet.yml`](examples/compose-snippet.yml).

## Key compose blocks

### build

```yaml
api:
  build: ./stack/api
```

Compose calls `docker build` with the context `./stack/api`. The layer cache is shared with the manual build from [lab 03](03-lab-dockerfile.md).

### environment

```yaml
environment:
  REDIS_HOST: redis
```

The name **`redis`** is the service name in DNS. Don't hardcode an IP.

### depends_on + healthcheck

```yaml
api:
  depends_on:
    - redis
  healthcheck:
    test: ["CMD", "python", "-c", "import urllib.request; urllib.request.urlopen('http://127.0.0.1:8080/health')"]
    interval: 10s
    retries: 6

web:
  depends_on:
    api:
      condition: service_healthy
```

| Mechanism | Effect |
|----------|--------|
| `depends_on: redis` | **startup** order, not redis readiness |
| `healthcheck` api | compose knows it's **healthy** |
| `condition: service_healthy` | web starts after a **successful** api health |

Without a healthcheck, web may return **502** while Flask isn't listening on the port yet.

### container_name

```yaml
container_name: mock-containers-api
```

Stable names for `docker exec` and the course documentation.

## Compose commands (daily)

```bash
docker compose up -d --build    # build and bring up
docker compose ps
docker compose logs -f api
docker compose restart api
docker compose down             # stop + remove containers
docker compose down -v --rmi local   # + volumes + local images
```

## Smoke test

[`scripts/smoke.sh`](../../deploy/containers/scripts/smoke.sh) — an automatic check of health and hits. The CI/GitLab analog — a job after deploy ([`gitlab-basic`](../gitlab-basic/04-lab-first-pipeline.md)).

```bash
cd deploy/containers && bash scripts/smoke.sh
```

## Compose project

The default project name = the **directory name** (`containers` → networks `containers_frontend`). Override:

```bash
docker compose -p mockexam up -d
```

It affects network and container names — important in command documentation.

## Common mistakes

| Mistake | Symptom | Fix |
|--------|---------|-------------|
| Forgetting `--build` after editing the Dockerfile | old code | `up --build` |
| `depends_on` without health | race 502 | healthcheck + condition |
| Duplicating `ports` on api and web | extra surface | only web:8088 |
| Storing secrets in `environment:` in git | leak | `.env` in `.gitignore` |
| One huge compose with 50 services | slow | profiles / multiple files |

## In production

- Compose — **dev/stage smoke**, not a replacement for K8s/ECS.
- **Helm / Kustomize** — a compose-like declaration for the cluster.
- Override files: `docker-compose.override.yml` (local, not in git).
- CI: `compose up` + smoke + `compose down -v`.

## Interview notes

- Compose v2 is the `docker compose` plugin, not a separate `docker-compose` binary (legacy).
- `docker compose config` — validation and file merging.
- **Profiles** — enable the registry only for the labs ([registry overlay](../../deploy/containers/docker-compose.registry.yml)).

## Summary

Multi-service compose describes the **entire stack**: build, networks, dependencies, health. The course stand is a reference **3-tier** setup before porting to Kubernetes. The next lab — walk the stack end-to-end and document the startup order.

## Checklist

- Which three services are in the stand?
- Why does web wait for the api's `service_healthy`?
- Which variable links api to redis?
- How do you run the smoke test?

Next lesson: [11. Lab: compose stack](11-lab-compose-stack.md).
