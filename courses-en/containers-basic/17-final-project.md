# 17. Final project: 3-tier stack + registry + hardening

## Intro: "we built the image, it won't start in K8s"

A typical failure before [`kuber-basic`](../kuber-basic/README.md): an image ships to the cluster that **wasn't built** on CI, listens on the **wrong port**, has Redis **published to the outside**, and secrets **baked into a layer**. The finale brings all of **containers-basic** into one loop on [`deploy/containers`](../../deploy/containers/README.md): Dockerfile → compose (web/api/redis) → local registry → minimal hardening → a checklist before Kubernetes.

## What you'll learn (course summary)

- Build and document a **3-tier** stack with the `frontend` / `backend` networks.
- Run **tag → push → pull** to `localhost:5000`.
- Apply **non-root**, `.dockerignore`, an overview of **scan**.
- Write a **PROJECT.md** for review and handoff to K8s.

## Requirements

| # | Requirement | Criterion |
|---|------------|----------|
| 1 | Stand | `docker compose up -d --build`, `smoke.sh` OK |
| 2 | API image | your own tag `course/api:final`, multistage or non-root (as in lab 15) |
| 3 | Compose | web + api + redis; Redis **not** on the host; web **8088** |
| 4 | Registry | registry overlay; `docker push localhost:5000/course/api:final` |
| 5 | Pull check | delete the local image, `pull`, `compose up` with the image from the registry |
| 6 | Hardening | `USER` non-root, no secrets in the Dockerfile, read-only root where possible |
| 7 | Document | `PROJECT.md` per the template below |
| 8 | Bridge to K8s | a table: what from compose becomes a Deployment/Service/Secret |

---

## Phase 1. Base stack

```bash
cd deploy/containers
docker compose down -v --rmi local 2>/dev/null || true
docker compose up -d --build
bash scripts/smoke.sh
```

Check manually:

```bash
curl -s http://localhost:8088/api/health
curl -s http://localhost:8088/api/hits
docker compose exec redis redis-cli ping
```

**Expectation:** `ok`, JSON with `hits`, `PONG`.

---

## Phase 2. Refining the API (your Dockerfile)

Copy `deploy/containers/stack/api` into a working folder or edit it in place:

1. Make sure of the **`.dockerignore`** (see [`examples/.dockerignore`](examples/.dockerignore)).
2. Keep **`USER appuser`** (or add it).
3. Build with the final tag:

```bash
docker build -t course/api:final ./stack/api
```

Optionally — multistage per [`examples/Dockerfile.multistage`](examples/Dockerfile.multistage).

In `docker-compose.yml`, temporarily for api:

```yaml
# image: course/api:final
# build: ./stack/api   # comment out build when checking pull
```

---

## Phase 3. Registry

```bash
docker compose -f docker-compose.yml -f docker-compose.registry.yml up -d
```

On Docker Desktop, if needed: **insecure-registries** → `localhost:5000`.

```bash
docker tag course/api:final localhost:5000/course/api:final
docker push localhost:5000/course/api:final
docker rmi course/api:final
docker pull localhost:5000/course/api:final
```

In compose, for api specify:

```yaml
image: localhost:5000/course/api:final
```

Recreate only api:

```bash
docker compose up -d --force-recreate api
bash scripts/smoke.sh
```

---

## Phase 4. Hardening and scan (overview)

```bash
docker scout quickview course/api:final 2>/dev/null || true
docker scout quickview localhost:5000/course/api:final 2>/dev/null || true
```

If `scout` is unavailable — `docker scan` or skip it with a note in PROJECT.md.

Hardening checklist:

- [ ] No `ENV PASSWORD=...` / secrets in the layers (`docker history` — carefully, don't log secrets).
- [ ] The API doesn't run as root (`docker compose exec api id`).
- [ ] Only **web:8088** is published to the host.

---

## Phase 5. The PROJECT.md document

Create a `PROJECT.md` in the root of your project copy (or in `courses/containers-basic/` for submission):

```markdown
# Containers final — <your name>

## Architecture
- Diagram or list: web (nginx) → api (Flask) → redis
- Networks: frontend, backend — who talks to whom

## Images
| Image | Tag | Registry | Non-root |
|-------|-----|----------|----------|

## Compose
- Ports on the host
- Volumes (if added for Redis)
- Healthcheck / depends_on

## Reproduction commands
1. compose up
2. smoke
3. push/pull registry

## Bridge to Kubernetes
| Compose | K8s object |
|---------|------------|
| service api | Deployment + Service |
| service web | Deployment + Service + Ingress |
| redis | StatefulSet or managed Redis outside the cluster |

## Risks / debt
- What you'd do in prod (secrets, limits, read-only FS)
```

---

## Success criteria

- [ ] `smoke.sh` is green after a pull from the registry.
- [ ] Redis is unreachable from the host (`nc -zv localhost 6379` — connection refused).
- [ ] PROJECT.md is filled in, the K8s table is meaningful.
- [ ] You can explain the difference between **image** vs **container** vs **Pod** ([16-docker-vs-kubernetes](16-docker-vs-kubernetes.md)).

## What to take to work

- Before the first `kubectl apply` — run the same image **locally** through compose.
- In an MR for a Dockerfile — `.dockerignore`, non-root, scan in CI ([gitlab-intermediate](../gitlab-intermediate/03-docker-registry.md)).
- In K8s — don't duplicate compose networks; use Service DNS ([kuber-basic/10-services](../kuber-basic/10-services.md) — when you get there).

## Course checklist

- [ ] Dockerfile, layers, CMD/ENTRYPOINT
- [ ] run, exec, logs, inspect
- [ ] bridge, publish, compose networks
- [ ] volumes for state
- [ ] multi-service + healthcheck
- [ ] registry push/pull
- [ ] security basics
- [ ] the Docker vs Kubernetes boundary

**Next:** [kuber-basic](../kuber-basic/README.md) — Pod and Deployment of the same application.
