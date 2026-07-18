# 06. Память: advanced

## Введение: «maxmemory стоит, а OOM Killer убил redis»

В конфиге `maxmemory 8gb` и `maxmemory-policy allkeys-lru`. Ночью хост **убил процесс** — OOM Killer, не Redis eviction. `INFO memory` показывал `used_memory` 7.2G, но **RSS** 11G: **фрагментация** и COW после `BGSAVE`. Advanced-инженер читает память как **несколько метрик**, а не одно число.

## Что вы узнаете

- `used_memory` vs **RSS**, **fragmentation**.
- **Eviction policies** — когда что выбирать.
- **lazyfree**, **active defrag**.
- **Big keys** audit и планирование RAM в Cluster.

---

## Метрики INFO memory

| Поле | Смысл |
|------|-------|
| `used_memory` | Логика Redis (allocator) |
| `used_memory_rss` | Реальная резидентная память ОС |
| `mem_fragmentation_ratio` | RSS / used (ориентир > 1.5 — внимание) |
| `maxmemory` | Лимит; 0 = нет лимита (опасно) |
| `evicted_keys` | Счётчик вытеснений |

```bash
redis-cli INFO memory
redis-cli CONFIG GET maxmemory-policy
```

---

## Eviction policies

| Policy | Поведение | Когда |
|--------|-----------|-------|
| `noeviction` | Ошибка при write при полной памяти | **Сессии**, нельзя терять ключи |
| `allkeys-lru` | LRU среди **всех** ключей | Чистый cache |
| `volatile-lru` | LRU только с TTL | Cache + постоянные ключи без TTL |
| `allkeys-lfu` / `volatile-lfu` | LFU (Redis 4+) | Hot/cold cache |
| `volatile-ttl` | Сначала ключи с **меньшим** TTL | Предсказуемый expiry |

**На собеседовании:** «Почему noeviction для queue?» — потеря сообщений хуже, чем отказ записи → backpressure.

---

## Фрагментация и fork

- **jemalloc** оставляет «дыры» после удалений.
- `BGSAVE` / `AOF rewrite` → `fork()` → **copy-on-write** — spike RSS.
- **active defrag** (Redis 4+): `activedefrag yes` — CPU vs RAM trade-off.

```bash
redis-cli CONFIG SET activedefrag yes
redis-cli MEMORY DOCTOR
```

---

## Lazy freeing

Большой `DEL` / `UNLINK` блокировал event loop. **`UNLINK`** (async free) и `lazyfree-lazy-user-del yes` — удаление в фоне.

```bash
redis-cli MEMORY USAGE big:key
redis-cli UNLINK big:key
```

---

## Big keys

```bash
redis-cli --bigkeys
redis-cli --memkeys   # Redis 7.2+ (если доступно)
```

В Cluster запускайте **на каждой ноде** или используйте `--cluster`.

**Планирование RAM:**

```text
dataset + overhead(≈1.2-1.5) + replica buffer + COW headroom(≈same as dataset for fork)
```

---

## Типичные ошибки

- `maxmemory` **больше** RAM хоста.
- Нет TTL на cache → `noeviction` + full RAM.
- Игнор `evicted_keys` spike после deploy.

---

## Резюме

1. Смотрите **RSS** и **fragmentation**, не только `used_memory`.
2. Policy = **бизнес-контракт** (cache vs durable keys).
3. Big keys — latency, replication, fork spike.

**Дальше:** [07. Security](07-security.md).
