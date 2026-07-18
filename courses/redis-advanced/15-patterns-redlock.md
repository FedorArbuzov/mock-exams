# 15. Паттерны: Redlock, rate limit, idempotency

## Введение: «поставили Redlock — получили двойное списание»

Команда обернула платёж в Redlock на 5 Redis-нодах. При **GC pause** 40 ms и **clock skew** два инстанса API оба «владели» lock — двойной charge. Distributed lock — **сложнее**, чем кажется; для cache refresh хватит `SET NX EX`.

## Что вы узнаете

- **Distributed lock**: SET NX, Redlock, альтернативы.
- **Rate limiting** (fixed, sliding, token bucket в Redis).
- **Idempotency keys** для API.
- Когда Redis **не** должен быть lock service.

---

## Lock на одном инстансе

```bash
SET resource:lock:42 <token> NX EX 30
```

Разблокировка **только если token совпадает** (Lua):

```lua
if redis.call("GET", KEYS[1]) == ARGV[1] then
  return redis.call("DEL", KEYS[1])
else
  return 0
end
```

| Риск | Mitigation |
|------|------------|
| TTL истёк, работа продолжается | Fencing token в DB |
| Процесс умер, lock висит | TTL |
| Не atomic unlock | Lua compare-and-del |

---

## Redlock (Antirez)

Алгоритм на **N** независимых masters (обычно 5), quorum `N/2+1`, случайный TTL.

**Критика Martin Kleppmann:**

- Нет **fencing** — stale lock holder может писать в DB.
- Зависимость от **синхронных часов** и GC pauses.
- «Независимые» ноды на одном hypervisor — иллюзия.

**На собеседовании:** знать Redlock, но предлагать **PostgreSQL advisory lock**, **etcd/Consul**, **SQS visibility** для critical path.

---

## Rate limiting

### Fixed window

```bash
INCR ratelimit:{ip}:2025051814
EXPIRE ratelimit:{ip}:2025051814 60
```

Проблема: burst на границе минуты.

### Sliding window (ZSET)

```text
ZADD key now now
ZREMRANGEBYSCORE key -inf now-60
ZCARD key
```

### Token bucket (Lua)

Атомарно пополнять и забирать токены — точнее, сложнее в коде.

**Hot key:** `ratelimit:global` → sharded `ratelimit:{ip % 32}`.

---

## Idempotency

```text
SET idempotency:{paymentId} processing NX EX 86400
```

После успеха — `SET ... completed` с result body hash. Повторный POST с тем же key → вернуть сохранённый ответ.

---

## Выбор инструмента

| Задача | Redis pattern |
|--------|----------------|
| Cache refresh mutex | SET NX на **одном** cache Redis |
| Payment idempotency | DB unique + idempotency key table |
| Global leader election | Consul / k8s lease |
| Rate limit API | Redis counter / Gateway |

---

## Резюме

1. **SET NX EX + token + Lua unlock** — baseline.
2. **Redlock** — знать, критически оценивать.
3. Rate limit — следить за **hot key** и atomicity.

**Дальше:** [16. Valkey](16-valkey-stack.md).
