# 28. Redis: cache-aside, TTL, and rate limiting

## Introduction: "no cache, the catalog takes 40 ms; with cache, 2 ms; without invalidation, a mess"

After a deploy, prices were updated in PostgreSQL, but Redis kept serving the old JSON for a whole **hour** — customers saw the wrong totals. Redis in the [`deploy/fastapi`](../../deploy/fastapi/README.md) stack (`REDIS_URL=redis://redis:6379/0`) isn't "make everything faster at any cost" — it's a layer with **TTL**, **invalidation**, and a fallback to the database.

Detailed patterns live in [`redis-basic`](../redis-basic/06-patterns-cache.md); here we cover the FastAPI async integration.

## What you'll learn

- **Cache-aside** with `redis.asyncio`.
- **TTL** and the `app:cache:...` key scheme.
- **Rate limiting**: sliding window / fixed counter.
- Graceful degradation when Redis is unavailable.

---

## Connecting in lifespan

```python
import redis.asyncio as redis
from contextlib import asynccontextmanager

@asynccontextmanager
async def lifespan(app: FastAPI):
    app.state.redis = redis.from_url(
        settings.REDIS_URL,
        encoding="utf-8",
        decode_responses=True,
    )
    yield
    await app.state.redis.aclose()
```

Dependency:

```python
async def get_redis(request: Request) -> redis.Redis:
    return request.app.state.redis
```

Checking the test stand:

```bash
docker exec mock-fastapi-redis redis-cli ping
# PONG
```

---

## Cache-aside for GET

```python
import json
from fastapi import Depends, Request

CACHE_TTL = 300

def cache_key_item(item_id: int) -> str:
    return f"app:cache:item:v1:{item_id}"

@router.get("/items/{item_id}", response_model=ItemOut)
async def get_item(
    item_id: int,
    request: Request,
    db: AsyncSession = Depends(get_db),
):
    r: redis.Redis = request.app.state.redis
    key = cache_key_item(item_id)
    try:
        cached = await r.get(key)
        if cached:
            return ItemOut.model_validate_json(cached)
    except redis.RedisError:
        pass  # degrade to DB

    item = await db.get(Item, item_id)
    if not item:
        raise HTTPException(404, detail="Not found")
    out = ItemOut.model_validate(item)
    try:
        await r.set(key, out.model_dump_json(), ex=CACHE_TTL)
    except redis.RedisError:
        pass
    return out
```

| Step | Action |
|-----|----------|
| 1 | `GET` the key |
| 2 | hit → deserialize |
| 3 | miss → fetch from PostgreSQL |
| 4 | `SET` with `EX` |
| 5 | return |

**Invalidation** on update/delete:

```python
await r.delete(cache_key_item(item_id))
```

See [cache-aside patterns](../redis-basic/06-patterns-cache.md) for jitter and stampede handling.

---

## TTL and a version in the key

```python
await r.set(f"app:cache:items:list:v2:{owner_id}", payload, ex=300 + random.randint(0, 60))
```

| Practice | Why |
|----------|--------|
| `v1` / `v2` in the key | change the format without a mass `DEL` |
| jitter on the TTL | reduces stampede risk |
| don't cache 404s for long | cache poisoning |

---

## Rate limiting (fixed window)

```python
async def rate_limit(
    request: Request,
    key: str,
    limit: int = 60,
    window_sec: int = 60,
) -> None:
    r = request.app.state.redis
    redis_key = f"app:rl:{key}:{int(time.time()) // window_sec}"
    try:
        count = await r.incr(redis_key)
        if count == 1:
            await r.expire(redis_key, window_sec)
        if count > limit:
            raise HTTPException(429, detail="Too many requests")
    except redis.RedisError:
        return  # fail open or closed — a product-level policy decision
```

Applied to login:

```python
@router.post("/auth/token")
async def login(request: Request, ...):
    client_ip = request.client.host if request.client else "unknown"
    await rate_limit(request, f"login:{client_ip}", limit=10, window_sec=60)
    ...
```

| Policy when Redis is down | Risk |
|-------------------------|------|
| **Fail open** | stays available, but no limit enforced |
| **Fail closed** | 503s — protects the system at the cost of availability |

For edge rate limiting, see [`nginx-intermediate`](../nginx-intermediate/README.md).

---

## JWT denylist (preview)

Revoking a token before its `exp`:

```python
await r.setex(f"app:jwt:deny:{jti}", ttl_seconds, "1")

# in get_current_user
if await r.exists(f"app:jwt:deny:{jti}"):
    raise HTTPException(401, detail="Token revoked")
```

Related to [20-rbac-scopes](20-rbac-scopes.md).

---

## Metrics and debugging

```bash
docker exec mock-fastapi-redis redis-cli KEYS 'app:cache:*'
docker exec mock-fastapi-redis redis-cli TTL app:cache:item:v1:1
docker exec mock-fastapi-redis redis-cli INFO stats | grep keyspace
```

The full end-to-end scenario on port **8090** is in the lab: [29-lab-redis](29-lab-redis.md).

---

## Common mistakes

| Mistake | Consequence | Fix |
|--------|-------------|---------|
| Treating Redis as the source of truth | data loss on flush | cache-aside, DB stays authoritative |
| No TTL | Redis runs out of memory | always set `EX` |
| Caching without try/except | Redis down → 500 | degrade to DB |
| One key for the entire catalog | stampede | per-entity keys + lock |
| `KEYS *` in production | blocks Redis | use `SCAN` |

---

## Summary

**Cache-aside:** read from Redis → on miss, hit the DB → `SET` with a TTL. **Invalidate** on writes. Apply **rate limiting** on sensitive endpoints via `INCR` + `EXPIRE`. Handle **RedisError** explicitly. Pattern theory lives in [`redis-basic`](../redis-basic/README.md); the next lab is [29-lab-redis](29-lab-redis.md).

## Checklist

- What are the four steps of cache-aside?
- Fail open vs. fail closed for rate limiting?
- Why put a version in the key name?

Next: [29-lab-redis](29-lab-redis.md).
