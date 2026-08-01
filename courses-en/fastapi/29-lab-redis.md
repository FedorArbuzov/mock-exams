# 29. Lab: caching and rate limiting with Redis

## Lab goal

Extend the [`deploy/fastapi`](../../deploy/fastapi/README.md) stand: **cache-aside** for reading items and **rate limiting** by IP on the create endpoint. Redis is already up in compose — the task is for the application to use it **deliberately**, not just "connect to it".

Caching theory: [redis-basic/06-patterns-cache](../redis-basic/06-patterns-cache.md). The rate-limit pattern: [redis-basic/17-final-project](../redis-basic/17-final-project.md).

---

## Prerequisites

```bash
cd deploy/fastapi
docker compose up -d --build
bash scripts/smoke.sh
docker exec mock-fastapi-redis redis-cli ping
```

| Service | URL |
|--------|-----|
| API | http://localhost:8090 |
| Redis (inside compose) | `redis://redis:6379/0` |

---

## Task 1. Connecting Redis

**Why:** a single client on lifespan, graceful close.

1. Add `redis[hiredis]>=5.0` to `stack/api/requirements.txt`.
2. Create `app/core/redis.py` — a factory `Redis.from_url(settings.REDIS_URL)`.
3. In `lifespan` (`main.py`): `app.state.redis = await create_redis()`, and on shutdown — `await redis.aclose()`.

```python
# app/core/redis.py (skeleton)
from redis.asyncio import Redis

async def create_redis(url: str) -> Redis:
    return Redis.from_url(url, decode_responses=True)
```

**Verification:** `docker compose logs api` with no connection errors; `INFO` in Redis: `docker exec mock-fastapi-redis redis-cli INFO clients`.

---

## Task 2. Cache-aside for `GET /api/v1/items/{id}`

**Why:** reduce DB load under read-heavy traffic.

| Step | Action |
|-----|----------|
| 1 | `GET cache:item:{id}` |
| 2 | hit → return the JSON |
| 3 | miss → read the source (for now in-memory `_ITEMS` or the future SQL) |
| 4 | `SET cache:item:{id} <json> EX 300` |
| 5 | return to the client |

Add **jitter** to the TTL: `300 + random.randint(0, 60)`.

```python
CACHE_KEY = "cache:item:{item_id}"

async def get_item_cached(redis: Redis, item_id: int) -> dict | None:
    raw = await redis.get(CACHE_KEY.format(item_id=item_id))
    if raw:
        return json.loads(raw)
    # ... load from source ...
    await redis.set(key, json.dumps(data), ex=ttl_with_jitter)
    return data
```

**Verification:**

```bash
curl -s http://localhost:8090/api/v1/items/1
docker exec mock-fastapi-redis redis-cli GET cache:item:1
docker exec mock-fastapi-redis redis-cli TTL cache:item:1
```

A repeated request — a hit (lower latency, the key in Redis).

---

## Task 3. Invalidation on change

On `PUT`/`DELETE` (if you implement them) or manually for the demo:

```bash
docker exec mock-fastapi-redis redis-cli DEL cache:item:1
```

In code — `await redis.delete(f"cache:item:{item_id}")` **before** or **after** the DB write (write-invalidate).

**Common mistake:** caching a 404 for a long time — clients see a "ghost" of a deleted object.

---

## Task 4. Rate limit (sliding window counter)

**Why:** protection against brute-force and accidental DDoS on write endpoints.

Implement a `rate_limit(request, redis)` dependency:

```python
# Pseudocode: 10 requests / 60 sec per IP
key = f"rl:{client_ip}:{path}"
count = await redis.incr(key)
if count == 1:
    await redis.expire(key, 60)
if count > 10:
    raise HTTPException(429, detail="Too many requests")
```

Wire it into `POST /api/v1/items` (create a minimal handler).

**Verification:**

```bash
for i in $(seq 1 15); do curl -s -o /dev/null -w "%{http_code}\n" -X POST \
  http://localhost:8090/api/v1/items -H "Content-Type: application/json" \
  -d '{"title":"x"}'; done
```

Expect `200`/`201` up to the limit, then **429**.

---

## Task 5. Degrade when Redis is down

**Why:** Redis is an accelerator, not a single point of failure for reads.

Wrap cache/rate-limit in a `try/except` or a `redis.ping()` check:

| Scenario | Behavior |
|----------|-----------|
| Redis up | cache + limit |
| Redis down | read from the DB; skip rate limit or use an in-memory fallback |
| Redis slow | 50–100 ms timeout, then bypass |

```bash
docker compose stop redis
curl -s http://localhost:8090/api/v1/items/1   # should work
docker compose start redis
```

---

## Task 6. Metrics (preview)

Add `cache_hits_total` / `cache_misses_total` counters — useful in [36-observability](36-observability.md) and the [37-lab-observability](37-lab-observability.md) lab.

---

## Submission criteria

| Criterion | Required |
|----------|-------------|
| Cache-aside with TTL + jitter | yes |
| `DEL` on update | yes |
| Rate limit 429 | yes |
| Graceful degrade without Redis | yes |
| No secrets in git | yes |

---

## Related courses

- **Redis cluster/Sentinel:** [`deploy/redis`](../../deploy/redis/README.md), [redis-intermediate](../redis-intermediate/README.md).
- **K8s probes:** the health endpoint from the stand — [kuber-intermediate/13-probes-advanced](../kuber-intermediate/13-probes-advanced.md).
- **CI smoke:** the pipeline after deploy — [gitlab-basic/04-lab-first-pipeline](../gitlab-basic/04-lab-first-pipeline.md).

---

## Summary

**Cache-aside** speeds up reads; **invalidation** keeps consistency. A **rate limit** in Redis is cheap edge control before nginx ([34-nginx-tls](34-nginx-tls.md)). When Redis fails, the API should **degrade**, not crash.

## Checklist

- Describe cache-aside for items in 4 steps.
- Why add jitter to the TTL?
- How does an app-level rate limit differ from nginx `limit_req`?
- What happens during a stampede without a lock?

Next lesson: [30-testing](30-testing.md).
