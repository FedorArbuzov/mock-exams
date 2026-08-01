# 03. Lab: Dockerfile, build and layers

## Lab goal

Build the **API** image from [`deploy/containers/stack/api`](../../deploy/containers/stack/api) manually, study the **layers** (`history`), run the container with a published port, and compare it to the image that **compose** builds.

## Prerequisites

- Docker Engine / Docker Desktop.
- From the repository root:

```bash
cd deploy/containers
docker compose down -v 2>/dev/null || true
```

Theory: [02. Image and Dockerfile](02-images-dockerfile.md).  
Ignore snippet: [`examples/.dockerignore`](examples/.dockerignore).

---

## Task 1. Build with a tag

**Why:** to separate a "manual build" from compose.

```bash
cd deploy/containers
docker build -t lab/api:manual ./stack/api
```

**What you'll see:** the steps `FROM`, `RUN pip`, `COPY` — on a repeated build with no changes — **CACHED**.

---

## Task 2. Layer history

```bash
docker image history lab/api:manual --no-trunc | head -12
docker image inspect lab/api:manual --format '{{.Id}} {{.Size}}'
```

**What you'll see:** the chain of layers; the image size in bytes.

---

## Task 3. Run without compose (in isolation)

**Why:** to understand that the container needs the Redis network separately (without it for now — health will fail).

```bash
docker run --rm -d --name lab-api-solo -p 18080:8080 \
  -e REDIS_HOST=127.0.0.1 lab/api:manual
sleep 3
curl -s -o /dev/null -w "%{http_code}\n" http://127.0.0.1:18080/health || true
docker logs lab-api-solo | tail -5
docker stop lab-api-solo
```

**What you'll see:** a response code other than `200` (Redis unavailable) — as expected; a Redis connection error in the logs.

---

## Task 4. Build web (nginx)

```bash
docker build -t lab/web:manual ./stack/web
docker run --rm -d --name lab-web-solo -p 18088:80 lab/web:manual
curl -s -o /dev/null -w "%{http_code}\n" http://127.0.0.1:18088/
docker stop lab-web-solo
```

**What you'll see:** `200` — static is served without the api.

---

## Task 5. Cache invalidation

**Why:** to see which layer gets rebuilt.

```bash
# add a comment to stack/api/app.py (any)
docker build -t lab/api:manual ./stack/api
```

**What you'll see:** a rebuild from the `COPY app.py` step (and below); `pip install` — **CACHED**.

Revert the comment before committing, or don't commit it at all.

---

## Task 6. Comparison with compose build

```bash
docker compose build api
docker compose images api
```

**What you'll see:** a name like `containers-api` or `deploy-containers-api` (depends on the directory name); a different tag, the same Dockerfile.

---

## Task 7. .dockerignore (thought experiment)

Copy [`examples/.dockerignore`](examples/.dockerignore) into `stack/api/.dockerignore`, add the line `app.py`, and build again.

**What you'll see:** the build **fails** on `COPY app.py` — the lesson: ignore must not exclude the files you need.

Delete the test `.dockerignore` after checking.

---

## Success criteria

- [ ] `docker build -t lab/api:manual ./stack/api` finished without errors
- [ ] `docker image history` shows the layers
- [ ] Solo api without Redis — a connection error (you understand the dependency)
- [ ] Solo web returns `200` on `/`
- [ ] A repeated build caches `pip install` when only `app.py` changes

## What to take to work

- Build context = the directory at the end of the `docker build` command
- The `name:tag` tag is the unit of versioning for the registry
- Compose is a wrapper over the same `docker build`

Next lesson: [04. Container runtime](04-container-runtime.md).
