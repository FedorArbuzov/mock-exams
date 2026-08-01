# 13. Lab: tag, push and pull localhost:5000

## Lab goal

Bring up a **local registry**, push the **api** image, delete the local tag, **pull** it again, and run a container from the registry.

## Prerequisites

- Docker Desktop: add `"insecure-registries": ["localhost:5000"]` and restart the Engine (see [12-registry](12-registry.md)).
- The stand is built:

```bash
cd deploy/containers
docker compose up -d --build
```

---

## Task 1. Bring up the registry

```bash
docker compose -f docker-compose.yml -f docker-compose.registry.yml up -d registry
docker ps --filter name=mock-registry
curl -s http://localhost:5000/v2/
```

**What you'll see:** `{}` or an empty JSON — the v2 API responds.

---

## Task 2. Build and tag

```bash
docker build -t lab/api:registry ./stack/api
docker tag lab/api:registry localhost:5000/course/api:registry
docker images | grep course/api
```

**What you'll see:** two tags on the same IMAGE ID.

---

## Task 3. Push

```bash
docker push localhost:5000/course/api:registry
curl -s http://localhost:5000/v2/_catalog
curl -s http://localhost:5000/v2/course/api/tags/list
```

**What you'll see:** the `course/api` repository, the `registry` tag.

On **denied** / HTTPS error — check insecure-registries.

---

## Task 4. Pull after deleting the local image

```bash
docker rmi localhost:5000/course/api:registry lab/api:registry
docker pull localhost:5000/course/api:registry
```

**What you'll see:** the layers are downloaded from localhost:5000.

---

## Task 5. Run from the registry (in the stand network)

```bash
NET=$(docker inspect mock-containers-api --format '{{range $k,$v := .NetworkSettings.Networks}}{{$k}}{{break}}{{end}}')
docker run --rm -d --name lab-api-reg \
  --network "$NET" \
  -e REDIS_HOST=redis \
  localhost:5000/course/api:registry
sleep 3
docker exec lab-api-reg python -c "import urllib.request; print(urllib.request.urlopen('http://127.0.0.1:8080/health').read())"
docker stop lab-api-reg
```

**What you'll see:** `{"status":"ok",...}` — the image from the registry works in the backend network.

---

## Task 6. Compose with image instead of build (optional)

The file `docker-compose.from-registry.yml`:

```yaml
services:
  api:
    image: localhost:5000/course/api:registry
    build: !reset null
```

```bash
docker compose -f docker-compose.yml -f docker-compose.from-registry.yml up -d api
curl -s http://localhost:8088/api/health
```

Revert: `docker compose up -d --build api` without the overlay.

---

## Task 7. Cleaning the registry volume (optional)

```bash
docker compose -f docker-compose.yml -f docker-compose.registry.yml down
docker volume ls | grep registry
```

---

## Success criteria

- [ ] The registry responds on `/v2/`
- [ ] `docker push localhost:5000/course/api:registry` succeeds
- [ ] `_catalog` and `tags/list` show the repository
- [ ] After `pull`, the container passes health to redis
- [ ] You understand the link to GitLab `CI_REGISTRY_IMAGE`

## What to take to work

- A full image name = registry + repo + tag
- CI: build → tag → push → deploy pull
- Insecure — **only** localhost in the lab

Next lesson: [14. Security](14-security.md).
