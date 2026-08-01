# 09. Lab: named volume and Redis data

## Lab goal

Confirm that **without a volume** the `hits` counter resets when redis is recreated; add a **named volume** in an overlay compose and preserve the data.

## Prerequisites

```bash
cd deploy/containers
docker compose up -d --build
```

Theory: [08. Volumes](08-volumes.md).

---

## Task 1. Baseline hits

```bash
curl -s http://localhost:8088/api/hits
curl -s http://localhost:8088/api/hits
docker exec mock-containers-redis redis-cli GET hits
```

**What you'll see:** `hits` ≥ 2 in the JSON and in redis.

---

## Task 2. Recreate without a volume — data loss

```bash
docker compose up -d --force-recreate redis
sleep 3
docker exec mock-containers-redis redis-cli GET hits
curl -s http://localhost:8088/api/hits
```

**What you'll see:** in redis `nil` or a small number; the next curl again gives **1** — the data didn't survive the recreate (if the image wasn't writing RDB to a volume).

---

## Task 3. Overlay with a volume

Create the file `docker-compose.volume-lab.yml` next to the main compose:

```yaml
services:
  redis:
    volumes:
      - redis-lab-data:/data

volumes:
  redis-lab-data:
```

Bring it up:

```bash
curl -s http://localhost:8088/api/hits
curl -s http://localhost:8088/api/hits
docker compose -f docker-compose.yml -f docker-compose.volume-lab.yml up -d
docker exec mock-containers-redis redis-cli GET hits
```

**What you'll see:** the counter continues from the new volume (may differ from step 2).

---

## Task 4. Persistence after down/up

```bash
HITS=$(curl -s http://localhost:8088/api/hits | grep -o '[0-9]*')
echo "before down: $HITS"
docker compose -f docker-compose.yml -f docker-compose.volume-lab.yml stop redis
docker compose -f docker-compose.yml -f docker-compose.volume-lab.yml start redis
sleep 2
docker exec mock-containers-redis redis-cli GET hits
```

**What you'll see:** the **hits** value in redis is ≥ the previous one (the data is on the volume).

---

## Task 5. inspect the volume

```bash
docker volume ls | grep redis-lab
docker volume inspect deploy-containers_redis-lab-data --format '{{.Mountpoint}}'
```

**What you'll see:** a host path (Linux) or the volume name (Desktop).

---

## Task 6. Bind mount of the config (read-only)

**Why:** editing nginx without rebuilding the image.

```bash
docker run --rm -v "$(pwd)/stack/web/nginx.conf:/etc/nginx/conf.d/default.conf:ro" \
  nginx:1.27-alpine nginx -t
```

**What you'll see:** `syntax is ok` — the config is valid from the host.

---

## Task 7. Cleanup (optional)

```bash
docker compose -f docker-compose.yml -f docker-compose.volume-lab.yml down -v
rm -f docker-compose.volume-lab.yml
```

---

## Success criteria

- [ ] You understand the difference before/after a volume on redis
- [ ] The overlay compose with `redis-lab-data` is applied
- [ ] After stop/start of redis the `hits` key is preserved
- [ ] `docker volume inspect` shows the volume
- [ ] The `:ro` bind for nginx.conf is verified

## What to take to work

- A stateful service = a **volume** in compose
- `down -v` deletes data — be careful in CI/prod
- Bind for **configs**, named for **data**

Next lesson: [10. Multi-service Compose](10-compose-multi-service.md).
