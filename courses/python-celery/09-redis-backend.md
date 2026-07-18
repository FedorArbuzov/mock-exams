# 09. Redis: broker vs result backend

## Введение

На стенде **RabbitMQ = broker**, **Redis = result backend**. Redis может быть и тем и другим — понимайте разницу.

## Что вы узнаете

- Result backend schema в Redis.
- Redis as broker — когда ok.
- TTL, memory, `result_expires`.

---

## Two roles

| Role | Data |
|------|------|
| **Broker** | task messages waiting for workers |
| **Result backend** | task return values + state metadata |

```python
broker_url = "amqp://..."           # RabbitMQ
result_backend = "redis://redis:6379/0"
```

[`redis-basic`](../redis-basic/README.md) — Redis fundamentals.

---

## Result backend keys

Celery stores keys like:

```text
celery-task-meta-<task_id>
```

```bash
docker exec mock-celery-redis redis-cli KEYS 'celery-task-meta-*'
docker exec mock-celery-redis redis-cli GET celery-task-meta-<uuid>
```

JSON: `{"status": "SUCCESS", "result": {...}, ...}`.

---

## Redis as broker

```python
broker_url = "redis://redis:6379/1"
result_backend = "redis://redis:6379/2"
```

| Pro | Con |
|-----|-----|
| Simple single service | Less routing features than Rabbit |
| Fast small tasks | At-most-once edge cases on crash |
| Good for dev | Production often prefers Rabbit broker |

Use **different DB indexes** (`/0`, `/1`) for broker vs results.

---

## result_expires

```python
app.conf.result_expires = 86400  # 24h
```

Prevents Redis OOM from infinite task history.

---

## disable result backend

```python
app.conf.result_backend = None
# or task_ignore_result = True
```

Tasks still run — нельзя `.get()`. OK for fire-and-forget.

---

## Sentinel / Cluster

Production Redis HA — [`redis-intermediate`](../redis-intermediate/README.md). Celery supports redis sentinel URL format.

---

## Типичные ошибки

| Ошибка | Fix |
|--------|-----|
| Same DB broker+results confusion | separate indexes |
| No TTL | set result_expires |
| Storing huge results | store S3 URL, not blob |

## Резюме

Стенд: Rabbit broker + Redis results — best of both. Results = meta keys with TTL. Don't store large payloads in result backend.

Далее: [10-lab-redis-results](10-lab-redis-results.md).
