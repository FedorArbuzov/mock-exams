# 28. Лаба: Flower dashboard

## Цель

Освоить Flower: workers, task history, revoke running task.

---

## Шаг 1. Open Flower

[http://localhost:5555](http://localhost:5555) — verify 1+ workers online.

---

## Шаг 2. Generate traffic

```bash
for i in $(seq 1 20); do
  curl -s -X POST http://localhost:8093/reports/ \
    -H "Content-Type: application/json" -d "{\"report_type\":\"r$i\"}" &
done
wait
```

Monitor tab — tasks appear in real time.

---

## Шаг 3. Task detail

Click task → args, kwargs, state, runtime, worker name.

---

## Шаг 4. Revoke (optional)

Start long report, in Flower **Revoke** task — worker terminates (may vary by pool).

Or CLI:

```bash
docker exec mock-celery-worker celery -A shop.celery_app control revoke <task_id> --terminate
```

---

## Шаг 5. Compare with rabbitmq UI

Messages rate in Rabbit vs tasks completed in Flower — end-to-end picture.

---

## Критерии приёмки

- [ ] Worker visible as online
- [ ] Tasks listed with SUCCESS/FAILURE states
- [ ] Understand task detail page fields

Далее: [29-docker-scaling](29-docker-scaling.md).
