# Containers — Basic (Docker)

Foundational level for **DevOps**: **image and Dockerfile**, **runtime** (`run`, `exec`, `logs`, `inspect`), **networking** (bridge, publish, compose networks), **volumes**, **multi-service Compose**, **registry** (tag/push/pull), **image security**, and a bridge to **Kubernetes**.

**Prerequisites:** terminal and Linux basics ([`linux-basic`](../linux-basic/README.md) — chapters [00-docker-lab](../linux-basic/00-docker-lab-environment.md), [02-shell](../linux-basic/02-shell-redirection.md)). It helps to know HTTP/nginx at the level of [`linux-intermediate/08-nginx`](../linux-intermediate/08-nginx.md).

**Locally:** [`deploy/containers`](../../deploy/containers/README.md) — `docker compose up -d --build`:

| Service | URL / port |
|--------|------------|
| Web (nginx) | [http://localhost:8088](http://localhost:8088) |
| API via proxy | [http://localhost:8088/api/health](http://localhost:8088/api/health), `/api/hits` |
| Redis | only inside the `backend` network (not on the host) |
| Registry (optional) | `localhost:5000` — overlay `docker-compose.registry.yml` |

Containers: `mock-containers-web`, `mock-containers-api`, `mock-containers-redis`. Smoke: `bash scripts/smoke.sh` in `deploy/containers`.

**Next:** [`kuber-basic`](../kuber-basic/README.md) — Pod, Deployment, images in the cluster; runtime theory: [02-docker-vs-containerd](../kuber-basic/02-docker-vs-containerd.md). CI and registry in GitLab: [gitlab-intermediate/03-docker-registry](../gitlab-intermediate/03-docker-registry.md).

## How to read the chapters

Each lesson is a **book chapter**, not a cheat sheet. Recommended order within a pair:

1. Read the **theory** (01, 02, 04…) — don't skip "common mistakes".
2. Open the **lab** (03, 05…) with the stand running in `deploy/containers`.
3. Complete the tasks **in order**; compare the output against the "what you'll see" block.
4. If a port is busy or you get a 502 on `/api/*` — [`deploy/containers/README.md`](../../deploy/containers/README.md).

**Theory structure:** intro (a scenario from work) → what you'll learn → concepts → example on the stand → mistakes → in production → summary → checklist.

**Lab structure:** goal → prerequisites → tasks 1…N (why / commands / what you'll see) → success criteria.

**Time:** about **45–55 minutes** per "theory + lab" pair; the [final project](17-final-project.md) — **2–3 hours**. The whole course — **~8–10 hours**.

**Stand cheat sheet:**

| From | Address / name |
|--------|-------------|
| From the host | [localhost:8088](http://localhost:8088) |
| API inside compose | `http://api:8080` (hostname `api`) |
| Redis inside compose | `redis:6379` |
| Registry (labs 12–13) | `localhost:5000` |

## Curriculum

### Fundamentals and image (01–03)

1. [Why containers: VM, isolation, path to Kubernetes](01-why-containers.md)
2. [Image and Dockerfile: layers, COPY, CMD](02-images-dockerfile.md) · 3. [Lab: Dockerfile and build](03-lab-dockerfile.md)

### Runtime (04–05)

4. [Container runtime: run, exec, logs, inspect](04-container-runtime.md) · 5. [Lab: run, exec, logs](05-lab-run-exec-logs.md)

### Networking (06–07)

6. [Docker networks: bridge, publish, compose networks](06-networking.md) · 7. [Lab: frontend/backend networks](07-lab-networks.md)

### Data (08–09)

8. [Volumes: bind mount and named volume](08-volumes.md) · 9. [Lab: data in Redis](09-lab-volumes.md)

### Compose (10–11)

10. [Multi-service Compose: a three-tier stack](10-compose-multi-service.md) · 11. [Lab: the deploy/containers stack](11-lab-compose-stack.md)

### Registry (12–13)

12. [Registry: tag, push, pull](12-registry.md) · 13. [Lab: localhost:5000](13-lab-registry.md)

### Security (14–15)

14. [Image security: USER, read-only, secrets, scan](14-security.md) · 15. [Lab: hardening](15-lab-security.md)

### Kubernetes and finale (16–17)

16. [Docker vs Kubernetes: the boundary of responsibility](16-docker-vs-kubernetes.md)
17. [Final project: 3-tier + registry + checklist](17-final-project.md)

## What you should end up with

- You can explain **why a container** instead of a VM and **what Kubernetes handles**.
- You write a **Dockerfile** with layers, `.dockerignore`, and **multistage** (example in [`examples/`](examples/)).
- You manage a container: **run / stop / logs / exec / inspect**.
- You configure compose **networks** (`frontend` / `backend`), **publishing** only the needed ports.
- You use **volumes** for Redis data.
- You assemble a **multi-service** stack with healthcheck and `depends_on`.
- You do **tag → push → pull** into a local registry.
- You apply **non-root**, don't put secrets in the image, and know an overview of **scan**.
- You connect Docker on your laptop with **containerd** in the cluster ([kuber-basic/02](../kuber-basic/02-docker-vs-containerd.md)).

## Examples

| Path | Purpose |
|------|------------|
| [`examples/Dockerfile.multistage`](examples/Dockerfile.multistage) | multistage build (builder + runtime) |
| [`examples/compose-snippet.yml`](examples/compose-snippet.yml) | networks and depends_on snippet |
| [`examples/.dockerignore`](examples/.dockerignore) | what should not end up in the build context |
