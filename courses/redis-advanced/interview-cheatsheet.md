# Interview cheatsheet — Redis Advanced

Таблицы для повторения перед собеседованием. Формат: **вопрос → короткий ответ (≈30 с) → deep dive (2–3 мин)**.

Полные развёрнутые главы: [11-interview-qa](11-interview-qa.md). Практика: [12-lab-mock-interview](12-lab-mock-interview.md).

**Стенд:** [`deploy/redis`](../../deploy/redis/README.md) (cluster `7001-7006`) · **Предшественник:** [`redis-intermediate`](../redis-intermediate/README.md) · **Firewall:** [`linux-intermediate/07-firewall`](../linux-intermediate/07-firewall.md) · **K8s:** [`kuber-intermediate/01-statefulset`](../kuber-intermediate/01-statefulset.md)

---

## Архитектура и модель

| # | Вопрос | Короткий ответ | Deep dive |
|---|--------|----------------|-----------|
| 1 | Redis vs PG как кэш? | In-memory, структуры, sub-ms; не ACID SoT | Cache/session/rate limit; явная потеря без AOF/cluster |
| 2 | Однопоточный? | Один main thread команд; scale шардами | I/O threads; KEYS блокирует; Cluster = N потоков ([01](01-internals.md)) |
| 3 | Pipeline? | Меньше RTT, не атомарность | vs MULTI/Lua; размер pipeline |
| 4 | MULTI vs Lua? | MULTI очередь; Lua условия атомарно | WATCH; Cluster same slot |
| 5 | RDB vs AOF? | Snapshot vs log | everysec; rewrite; fork COW |

---

## Репликация и HA

| # | Вопрос | Короткий ответ | Deep dive |
|---|--------|----------------|-----------|
| 6 | Async replication loss? | Запись после ACK может не дойти до replica | WAIT редко; failover promote lag |
| 7 | Sentinel vs Cluster? | Sentinel failover; Cluster sharding | Когда один master достаточен ([02](02-cluster.md)) |
| 8 | Сколько Sentinel? | 3+ нечётные | Quorum; split-brain |
| 9 | Read replica? | Eventual reads | Lag; не read-your-writes |
| 10 | CLUSTERDOWN? | Нет quorum masters / slots | init-cluster; full coverage ([09](09-troubleshooting.md)) |

---

## Cluster и ключи

| # | Вопрос | Короткий ответ | Deep dive |
|---|--------|----------------|-----------|
| 11 | Hash slots? | 16384; CRC16 mod | Не меняется |
| 12 | MOVED vs ASK? | Permanent vs migration redirect | Slot map; ASKING |
| 13 | Hash tag? | `{x}` в ключе → same slot | Hot slot risk ([04](04-hot-keys-stampede.md)) |
| 14 | KEYS в prod? | Нет O(N) block | SCAN |
| 15 | CROSSSLOT? | Multi-key разные slots | Hash tag / redesign |

---

## Память и perf

| # | Вопрос | Короткий ответ | Deep dive |
|---|--------|----------------|-----------|
| 16 | Policy для cache? | allkeys-lru/lfu + TTL | noeviction queues ([06](06-memory-advanced.md)) |
| 17 | High fragmentation? | RSS >> used | defrag; OOM killer |
| 18 | Hot key? | commandstats, --hotkeys staging | Shard key; local cache |
| 19 | Stampede? | Mass miss → DB | jitter, lock, singleflight ([05](05-lab-stampede.md)) |
| 20 | Big values? | Network, replication | S3 + id; UNLINK |

---

## Security / patterns / cloud

| # | Вопрос | Короткий ответ | Deep dive |
|---|--------|----------------|-----------|
| 21 | Защита Redis? | Private, SG, ACL, TLS, ufw | Defense depth ([07](07-security.md), [firewall](../linux-intermediate/07-firewall.md)) |
| 22 | ACL vs requirepass? | Multi-user, commands, keys | default off |
| 23 | Redlock? | Спорно; fencing, clocks | SET NX; etcd/DB critical ([15](15-patterns-redlock.md)) |
| 24 | Rate limit? | INCR+EXPIRE; ZSET sliding | Hot key shard |
| 25 | Pub/Sub vs Streams? | Pub/Sub volatile; Streams log+groups | No persistence pub/sub |

---

## Design / ecosystem

| # | Вопрос | Короткий ответ | Deep dive |
|---|--------|----------------|-----------|
| 26 | Session store? | TTL, replication, encrypt PII | noeviction instance |
| 27 | Redis vs Memcached? | Structures, persistence vs simple MT cache | Use-case fit |
| 28 | ElastiCache? | Managed HA/patch; you size keys | Cluster mode ([17](17-k8s-operators.md)) |
| 29 | Valkey? | OSS fork, RESP compatible | License; modules check ([16](16-valkey-stack.md)) |
| 30 | Design 50k RPS cache? | RAM estimate, cluster, stampede, metrics | [13](13-system-design.md) |

---

## Команды «день собеседования»

```bash
redis-cli -c -p 7001 CLUSTER INFO
redis-cli INFO memory
redis-cli SLOWLOG GET 10
redis-cli LATENCY DOCTOR
redis-cli ACL LIST
```

---

## Стенд cluster (порты)

| Node | Client | Bus |
|------|--------|-----|
| redis-1 | 7001 | 17001 |
| redis-2 | 7002 | 17002 |
| … | … | … |
| redis-6 | 7006 | 17006 |

`bash scripts/init-cluster.sh` после `docker compose -f docker-compose.cluster.yml up -d`
