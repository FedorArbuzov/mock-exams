# 28. Redis: cache-aside, TTL и rate limiting

## Введение: «каталог без кэша — 40 ms, с кэшем — 2 ms, без инвалидации — скандал»

После deploy цены в PostgreSQL обновили, Redis отдавал старый JSON ещё **час** — клиенты видели неверные суммы. Redis в стеке [`deploy/fastapi`](../../deploy/fastapi/README.md) (`REDIS_URL=redis://redis:6379/0`) — не «ускоритель любой цены», а слой с **TTL**, **инвалидацией** и fallback на БД.

Подробные паттерны — [`redis-basic`](../redis-basic/06-patterns-cache.md); здесь интеграция с FastAPI async.

## Что вы узнаете

- **Cache-aside** с `redis.asyncio`.
- **TTL** и ключевая схема `app:cache:...`.
- **Rate limiting** sliding window / fixed counter.
- Деградация при недоступности Redis.

---

## Подключение в lifespan

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

Проверка стенда:

```bash
docker exec mock-fastapi-redis redis-cli ping
# PONG
```

---

## Cache-aside для GET

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

| Шаг | Действие |
|-----|----------|
| 1 | `GET` ключ |
| 2 | hit → deserialize |
| 3 | miss → PostgreSQL |
| 4 | `SET` с `EX` |
| 5 | return |

**Инвалидация** при update/delete:

```python
await r.delete(cache_key_item(item_id))
```

См. [cache-aside patterns](../redis-basic/06-patterns-cache.md) — jitter, stampede.

---

## TTL и версия в ключе

```python
await r.set(f"app:cache:items:list:v2:{owner_id}", payload, ex=300 + random.randint(0, 60))
```

| Практика | Зачем |
|----------|-------|
| `v1` / `v2` в ключе | смена формата без mass DEL |
| jitter к TTL | меньше stampede |
| Не кэшировать 404 долго | cache poisoning |

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
        return  # fail open или closed — политика продукта
```

Применение на login:

```python
@router.post("/auth/token")
async def login(request: Request, ...):
    client_ip = request.client.host if request.client else "unknown"
    await rate_limit(request, f"login:{client_ip}", limit=10, window_sec=60)
    ...
```

| Политика при Redis down | Риск |
|-------------------------|------|
| **Fail open** | доступен, нет лимита |
| **Fail closed** | 503, защита ценой availability |

Для edge rate limit — [`nginx-intermediate`](../nginx-intermediate/README.md).

---

## JWT denylist (preview)

Отзыв токена до `exp`:

```python
await r.setex(f"app:jwt:deny:{jti}", ttl_seconds, "1")

# в get_current_user
if await r.exists(f"app:jwt:deny:{jti}"):
    raise HTTPException(401, detail="Token revoked")
```

Связь с [20-rbac-scopes](20-rbac-scopes.md).

---

## Метрики и отладка

```bash
docker exec mock-fastapi-redis redis-cli KEYS 'app:cache:*'
docker exec mock-fastapi-redis redis-cli TTL app:cache:item:v1:1
docker exec mock-fastapi-redis redis-cli INFO stats | grep keyspace
```

После лабы [29-lab-redis](29-lab-redis.md) — полный сценарий на **8090**.

---

## Типичные ошибки

| Ошибка | Последствие | Решение |
|--------|-------------|---------|
| Redis как source of truth | потеря данных при flush | cache-aside, БД главная |
| Нет TTL | OOM Redis | всегда `EX` |
| Кэш без try/except | Redis down → 500 | degrade to DB |
| Один ключ на весь каталог | stampede | per-entity + lock |
| `KEYS *` в prod | блокировка Redis | `SCAN` |

---

## Резюме

**Cache-aside:** читайте Redis → при miss БД → `SET` с TTL. **Инвалидируйте** при записи. **Rate limit** на чувствительных эндпоинтах через `INCR` + `EXPIRE`. Обрабатывайте **RedisError** явно. Теория паттернов — [`redis-basic`](../redis-basic/README.md); следующая лаба — [29-lab-redis](29-lab-redis.md).

## Чек-лист

- Четыре шага cache-aside?
- Fail open vs closed для rate limit?
- Зачем версия в имени ключа?

Далее: [29-lab-redis](29-lab-redis.md).
