# 29. Лаба: кэш и rate limit через Redis

## Цель лабы

Расширить стенд [`deploy/fastapi`](../../deploy/fastapi/README.md): **cache-aside** для чтения items и **rate limiting** по IP на эндпоинт создания. Redis уже поднят в compose — задача в том, чтобы приложение **осознанно** им пользовалось, а не «просто подключилось».

Теория кэширования: [redis-basic/06-patterns-cache](../redis-basic/06-patterns-cache.md). Паттерн rate limit: [redis-basic/17-final-project](../redis-basic/17-final-project.md).

---

## Предварительно

```bash
cd deploy/fastapi
docker compose up -d --build
bash scripts/smoke.sh
docker exec mock-fastapi-redis redis-cli ping
```

| Сервис | URL |
|--------|-----|
| API | http://localhost:8090 |
| Redis (внутри compose) | `redis://redis:6379/0` |

---

## Задание 1. Подключение Redis

**Зачем:** единый клиент на lifespan, graceful close.

1. Добавьте `redis[hiredis]>=5.0` в `stack/api/requirements.txt`.
2. Создайте `app/core/redis.py` — фабрика `Redis.from_url(settings.REDIS_URL)`.
3. В `lifespan` (`main.py`): `app.state.redis = await create_redis()`, при shutdown — `await redis.aclose()`.

```python
# app/core/redis.py (скелет)
from redis.asyncio import Redis

async def create_redis(url: str) -> Redis:
    return Redis.from_url(url, decode_responses=True)
```

**Проверка:** `docker compose logs api` без ошибок подключения; `INFO` в Redis: `docker exec mock-fastapi-redis redis-cli INFO clients`.

---

## Задание 2. Cache-aside для `GET /api/v1/items/{id}`

**Зачем:** снизить нагрузку на БД при read-heavy трафике.

| Шаг | Действие |
|-----|----------|
| 1 | `GET cache:item:{id}` |
| 2 | hit → вернуть JSON |
| 3 | miss → читать источник (пока in-memory `_ITEMS` или будущий SQL) |
| 4 | `SET cache:item:{id} <json> EX 300` |
| 5 | вернуть клиенту |

Добавьте **jitter** к TTL: `300 + random.randint(0, 60)`.

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

**Проверка:**

```bash
curl -s http://localhost:8090/api/v1/items/1
docker exec mock-fastapi-redis redis-cli GET cache:item:1
docker exec mock-fastapi-redis redis-cli TTL cache:item:1
```

Повторный запрос — hit (latency ниже, ключ в Redis).

---

## Задание 3. Инвалидация при изменении

При `PUT`/`DELETE` (если реализуете) или вручную для демо:

```bash
docker exec mock-fastapi-redis redis-cli DEL cache:item:1
```

В коде — `await redis.delete(f"cache:item:{item_id}")` **до** или **после** записи в БД (write-invalidate).

**Типичная ошибка:** кэшировать 404 надолго — клиенты видят «призрак» удалённого объекта.

---

## Задание 4. Rate limit (sliding window counter)

**Зачем:** защита от brute-force и случайных DDoS на write-эндпоинты.

Реализуйте dependency `rate_limit(request, redis)`:

```python
# Псевдокод: 10 запросов / 60 сек на IP
key = f"rl:{client_ip}:{path}"
count = await redis.incr(key)
if count == 1:
    await redis.expire(key, 60)
if count > 10:
    raise HTTPException(429, detail="Too many requests")
```

Подключите к `POST /api/v1/items` (создайте минимальный handler).

**Проверка:**

```bash
for i in $(seq 1 15); do curl -s -o /dev/null -w "%{http_code}\n" -X POST \
  http://localhost:8090/api/v1/items -H "Content-Type: application/json" \
  -d '{"title":"x"}'; done
```

Ожидайте `200`/`201` до лимита, затем **429**.

---

## Задание 5. Degrade при падении Redis

**Зачем:** Redis — ускоритель, не single point of failure для чтения.

Оберните cache/rate-limit в `try/except` или проверку `redis.ping()`:

| Сценарий | Поведение |
|----------|-----------|
| Redis up | кэш + лимит |
| Redis down | читать из БД; rate limit пропустить или in-memory fallback |
| Redis slow | timeout 50–100 ms, затем bypass |

```bash
docker compose stop redis
curl -s http://localhost:8090/api/v1/items/1   # должен работать
docker compose start redis
```

---

## Задание 6. Метрики (preview)

Добавьте counter `cache_hits_total` / `cache_misses_total` — пригодится в [36-observability](36-observability.md) и лабе [37-lab-observability](37-lab-observability.md).

---

## Критерии сдачи

| Критерий | Обязательно |
|----------|-------------|
| Cache-aside с TTL + jitter | да |
| `DEL` при обновлении | да |
| Rate limit 429 | да |
| Graceful degrade без Redis | да |
| Без секретов в git | да |

---

## Связь с другими курсами

- **Redis cluster/Sentinel:** [`deploy/redis`](../../deploy/redis/README.md), [redis-intermediate](../redis-intermediate/README.md).
- **K8s probes:** health endpoint из стенда — [kuber-intermediate/13-probes-advanced](../kuber-intermediate/13-probes-advanced.md).
- **CI smoke:** pipeline после deploy — [gitlab-basic/04-lab-first-pipeline](../gitlab-basic/04-lab-first-pipeline.md).

---

## Резюме

**Cache-aside** ускоряет чтение; **инвалидация** держит консистентность. **Rate limit** в Redis — дешёвый edge-control до nginx ([34-nginx-tls](34-nginx-tls.md)). При отказе Redis API должен **деградировать**, а не падать.

## Чек-лист

- Опишите cache-aside в 4 шагах для items.
- Зачем jitter к TTL?
- Чем app-level rate limit отличается от nginx `limit_req`?
- Что произойдёт при stampede без lock?

Следующий урок: [30-testing](30-testing.md).
