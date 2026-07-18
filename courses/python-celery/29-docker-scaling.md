# 29. Docker, scaling workers

## Введение

Black Friday — queue depth 50k. Scale **workers horizontally**, not API (usually).

## Что вы узнаете

- Compose / K8s worker replicas.
- Same image, different CMD.
- Resource limits, graceful shutdown.

---

## Compose scale

```bash
docker compose up -d --scale worker=3
```

**Caution:** default compose uses `container_name: mock-celery-worker` — remove `container_name` for scale to work.

Production compose pattern:

```yaml
worker:
  build: ./stack
  command: celery -A shop.celery_app worker --loglevel=info -Q default,orders,reports
  deploy:
    replicas: 3
  # no container_name
```

---

## Kubernetes Deployment

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: celery-worker
spec:
  replicas: 3
  template:
    spec:
      containers:
        - name: worker
          image: shop-celery:latest
          command: ["celery", "-A", "shop.celery_app", "worker", "--loglevel=info"]
          resources:
            limits:
              memory: "512Mi"
              cpu: "500m"
```

Separate Deployment for **beat** (replicas: 1). API — HPA on CPU; workers — HPA on **queue depth** (KEDA).

---

## Graceful shutdown

```bash
celery worker --time-limit=300 --soft-time-limit=240
```

K8s `terminationGracePeriodSeconds` > longest task. SIGTERM → finish current task → exit.

---

## Beat singleton

Never scale beat > 1 without **distributed lock** (Redis redbeat, django-celery-beat scheduler).

---

## Connection limits

3 workers × 2 concurrency × broker connections — watch RabbitMQ `connection_max`.

Postgres pool: workers need DB too — size pools accordingly.

---

## Health checks

Worker liveness — custom probe or `celery inspect ping`:

```bash
celery -A shop.celery_app inspect ping
```

---

## Типичные ошибки

| Ошибка | Fix |
|--------|-----|
| Scale beat | duplicate schedules |
| container_name + scale | compose error |
| No grace period | killed mid-task → redelivery storm |

## Резюме

Scale workers horizontally. One beat. Remove container_name for compose scale. Graceful shutdown + time limits.

Далее: [30-lab-scale-workers](30-lab-scale-workers.md).
