# 28. Lab: Flower dashboard

## Goal

Get hands-on with Flower: workers, task history, revoke a running task.

---

## Step 1. Open Flower

[http://localhost:5555](http://localhost:5555) — verify 1+ workers online.

---

## Step 2. Generate traffic

```bash
for i in $(seq 1 20); do
  curl -s -X POST http://localhost:8093/reports/ \
    -H "Content-Type: application/json" -d "{\"report_type\":\"r$i\"}" &
done
wait
```

Monitor tab — tasks appear in real time.

---

## Step 3. Task detail

Click task → args, kwargs, state, runtime, worker name.

---

## Step 4. Revoke (optional)

Start a long report, then in Flower click **Revoke** — the worker terminates the task (behavior may vary by pool).

Or via CLI:

```bash
docker exec mock-celery-worker celery -A shop.celery_app control revoke <task_id> --terminate
```

---

## Step 5. Compare with the RabbitMQ UI

Message rate in Rabbit vs tasks completed in Flower — the end-to-end picture.

---

## Acceptance criteria

- [ ] Worker visible as online
- [ ] Tasks listed with SUCCESS/FAILURE states
- [ ] Understand the task detail page fields

Next: [29-docker-scaling](29-docker-scaling.md).
