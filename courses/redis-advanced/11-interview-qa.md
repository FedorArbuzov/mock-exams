# 11. Interview Q&A — топ-30 вопросов с ответами

Формат: **вопрос** → **короткий ответ** (30 с) → **deep dive** (2–3 мин). Таблица: [`interview-cheatsheet.md`](interview-cheatsheet.md).

---

## Архитектура и модель

### 1. Зачем Redis, а не PostgreSQL как кэш?

**Коротко:** In-memory, sub-ms latency, структуры данных; не замена durable DB.

**Deep dive:** Redis — **кэш / session / rate limit / pub-sub** с явным контрактом потери при crash (если не AOF/cluster). PG — source of truth, ACID.

### 2. Почему Redis «однопоточный»?

**Коротко:** Одна нить выполняет команды → нет lock contention; масштаб шардированием.

**Deep dive:** I/O threads разгружают сеть; CPU-bound `KEYS` блокирует всех. Cluster = несколько main threads на разных нодах ([01](01-internals.md)).

### 3. Что такое pipeline?

**Коротко:** Пачка команд без ожидания ответа между ними — экономия RTT.

**Deep dive:** Не атомарность; для атомарной логики — Lua/MULTI. Осторожно с размером pipeline (память буфера).

### 4. Разница MULTI и Lua?

**Коротко:** MULTI/EXEC — очередь; Lua — ветвление и условия атомарно.

**Deep dive:** WATCH для optimistic locking; Lua не должна быть долгой. Cluster: ключи в одном slot.

### 5. RDB vs AOF?

**Коротко:** RDB — snapshot; AOF — журнал команд; AOF чаще свежее, тяжелее.

**Deep dive:** `everysec` компромисс; rewrite I/O; hybrid Redis 7. Backup ≠ replication.

---

## Репликация и HA

### 6. Async replication — что теряем?

**Коротко:** При crash master после ACK клиенту — последние записи могут не дойти до replica.

**Deep dive:** WAIT command (редко); Sentinel/Cluster failover — promote с lag. Не strong consistency.

### 7. Sentinel vs Cluster?

**Коротко:** Sentinel — failover одного master; Cluster — sharding + failover.

**Deep dive:** [02](02-cluster.md). Sentinel проще до предела одной ноды RAM/CPU.

### 8. Сколько Sentinel?

**Коротко:** Минимум 3 для quorum, нечётное число.

**Deep dive:** Split-brain при partition; `down-after-milliseconds`, `failover-timeout`.

### 9. Что такое replica read?

**Коротко:** Чтение с replica → eventual consistency, меньше нагрузки на master.

**Deep dive:** Lag метрики; не для «прочитал сразу после записи» без проверки offset.

### 10. CLUSTERDOWN?

**Коротко:** Нет большинства masters или slots не покрыты.

**Deep dive:** [09](09-troubleshooting.md); init cluster; `cluster-require-full-coverage`.

---

## Cluster и ключи

### 11. Сколько hash slots?

**Коротко:** 16384; `CRC16(key) mod 16384`.

**Deep dive:** Исторически баланс metadata vs гибкость; не меняется без новой версии протокола.

### 12. MOVED vs ASK?

**Коротко:** MOVED — постоянный redirect слота; ASK — временно при migration.

**Deep dive:** Клиент обновляет slot cache; `ASKING` перед ASK.

### 13. Hash tag зачем?

**Коротко:** `{user:1}` в ключе — общий slot для multi-key ops.

**Deep dive:** Риск hot slot; осознанный выбор локальности vs баланс.

### 14. Можно ли `KEYS *` в prod?

**Коротко:** Нет — O(N), блокирует инстанс.

**Deep dive:** `SCAN` cursor; `--bigkeys` на maintenance window.

### 15. CROSSSLOT?

**Коротко:** Multi-key команда затронула ключи из разных slots.

**Deep dive:** Hash tag или redesign данных.

---

## Память и производительность

### 16. maxmemory-policy для cache?

**Коротко:** `allkeys-lru` или `allkeys-lfu`; TTL желателен.

**Deep dive:** [06](06-memory-advanced.md); `noeviction` для очередей/сессий если нельзя терять.

### 17. mem_fragmentation_ratio высокий?

**Коротко:** RSS >> used_memory; риск OOM killer.

**Deep dive:** active defrag; restart; jemalloc; после big DEL.

### 18. Hot key как найти?

**Коротко:** commandstats, latency, proxy metrics, `--hotkeys` на staging.

**Deep dive:** [04](04-hot-keys-stampede.md); sharded key; local cache.

### 19. Cache stampede?

**Коротко:** Массовый miss → DB overload.

**Deep dive:** TTL jitter, lock, singleflight ([05](05-lab-stampede.md)).

### 20. Почему большие values плохи?

**Коротко:** Сеть, latency, replication, блокировка при DEL.

**Deep dive:** UNLINK; хранить blob в S3, в Redis id.

---

## Security и patterns

### 21. Как защитить Redis в VPC?

**Коротко:** Private subnet, SG, ACL, TLS, no public 6379, host firewall.

**Deep dive:** [07](07-security.md), [firewall](../linux-intermediate/07-firewall.md).

### 22. ACL vs requirepass?

**Коротко:** ACL — несколько users, команды и ключи; requirepass — один пароль legacy.

**Deep dive:** `default off`; app user `~prefix:* +@read +@write`.

### 23. Redlock надёжен?

**Коротко:** Спорно; Martin Kleppmann критика — clock skew, fencing.

**Deep dive:** [15](15-patterns-redlock.md); для cache lock часто достаточно SET NX + TTL на одном инстансе; critical — DB/Consul.

### 24. Rate limiting в Redis?

**Коротко:** INCR + EXPIRE; sliding window в ZSET; Cell algorithm в module.

**Deep dive:** Atomic Lua; sharded counters при hot key.

### 25. Pub/Sub vs Streams?

**Коротко:** Pub/Sub — fire-and-forget, нет persistence; Streams — log, consumer groups.

**Deep dive:** Потеря сообщений при disconnect в pub/sub; Streams ≈ lightweight Kafka для одного DC.

---

## Design и managed

### 26. Session store в Redis?

**Коротко:** TTL, replication, sticky optional; шифровать PII.

**Deep dive:** `noeviction` vs session loss; Cluster session affinity не обязателен если session id in key.

### 27. Redis vs Memcached?

**Коротко:** Redis — структуры, persistence, replication; Memcached — простой multithreaded cache.

**Deep dive:** Выбор по ops model; Memcached не заменяет Streams/Lua.

### 28. ElastiCache vs self-hosted?

**Коротко:** Managed patches, Multi-AZ; вы — sizing, params, clients.

**Deep dive:** [17](17-k8s-operators.md); cluster mode enabled; auth token.

### 29. Valkey vs Redis?

**Коротко:** Valkey — OSS fork post-license; совместимость протокола; экосистема движется.

**Deep dive:** [16](16-valkey-stack.md); проверять клиенты и modules.

### 30. Спроектируйте кэш 50k RPS?

**Коротко:** Оценка RAM, TTL, eviction, sharding, cache-aside, stampede protection, monitoring.

**Deep dive:** [13](13-system-design.md), [14](14-lab-system-design.md).

---

## Дальше

Практика: [12. mock interview](12-lab-mock-interview.md) · Шпаргалка: [interview-cheatsheet](interview-cheatsheet.md)
