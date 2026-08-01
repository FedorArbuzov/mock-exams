# 30. Lab: scale workers

## Goal

Remove `container_name`, scale workers, and drain the backlog faster.

---

## Step 1. Patch compose (temp)

Comment out in `docker-compose.yml`:

```yaml
# container_name: mock-celery-worker
```

---

## Step 2. Scale

```bash
docker compose up -d --scale worker=3
docker compose ps worker
```

3 worker containers.

---

## Step 3. Backlog drain benchmark

```bash
docker compose stop worker
for i in $(seq 1 50); do
  curl -s -X POST http://localhost:8093/tasks/ping/ > /dev/null
done

time docker compose up -d --scale worker=3
# watch rabbitmq queue drain
docker exec mock-celery-rabbitmq rabbitmqctl list_queues name messages
```

Compare drain time 1 vs 3 workers.

---

## Step 4. inspect ping all

```bash
docker exec $(docker ps -q -f name=worker | head -1) \
  celery -A shop.celery_app inspect ping
```

---

## Step 5. Revert

Restore `container_name`, `docker compose up -d --scale worker=1`.

---

## Success criteria

- [ ] 3 workers running without a name conflict
- [ ] Faster backlog drain vs a single worker (qualitative)
- [ ] All workers respond to inspect ping

Next: [31-testing-celery](31-testing-celery.md).
