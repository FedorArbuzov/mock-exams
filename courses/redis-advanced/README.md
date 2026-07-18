# Redis — Advanced

Продвинутый уровень для **собеседований** и **production**: **внутренности Redis**, **Cluster** (hash slots, resharding), **hot keys и cache stampede**, **память** (eviction, fragmentation, lazy free), **security** (ACL, rename-command, TLS), **troubleshooting** (OOM, latency, CLUSTERDOWN), **system design**, **Redlock и паттерны**, **Valkey / Redis Stack**, **операторы в Kubernetes**, **mock interview** и **capstone**.

**Предварительно:** [`redis-basic`](../redis-basic/README.md) — типы данных, TTL, pub/sub. [`redis-intermediate`](../redis-intermediate/README.md) — репликация, Sentinel, persistence, базовый `maxmemory`.

**Локально:** [`deploy/redis`](../../deploy/redis/README.md)

| Профиль | Команда | Подключение с хоста |
|---------|---------|---------------------|
| Один инстанс | `docker compose up -d` | `localhost:6379` |
| Master + replica | `docker compose -f docker-compose.replication.yml up -d` | `6379` / `6380` |
| Sentinel | `docker compose -f docker-compose.sentinel.yml up -d` | `26379` (Sentinel) |
| **Cluster (этот курс)** | `docker compose -f docker-compose.cluster.yml up -d` + `bash scripts/init-cluster.sh` | `localhost:7001-7006` (`redis-cli -c`) |

Перед сменой compose **остановите** предыдущий стенд — иначе конфликт портов `6379` / `7001-7006`.

## Как читать главы

Каждый урок — **глава книги** под подготовку к интервью, не сухая шпаргалка.

1. **Теория** (01, 02, 04…) — сценарий с работы → концепции → пример на стенде → типичные ошибки → «на собеседовании» → резюме.
2. **Лаба** (03, 05, 08…) — цель → предварительно → задания → «что увидите» / «если не работает» → критерии успеха.
3. После блоков 11–12 — пройдите [`interview-cheatsheet.md`](interview-cheatsheet.md) без подглядывания в ответы.

**Время:** ~60–90 минут на пару «теория + лаба»; [capstone](18-capstone.md) — **4–6 часов**.

## Программа

### Внутренности и кластер (01–03)

| # | Урок |
|---|------|
| 01 | [Внутренности Redis](01-internals.md) |
| 02 | [Redis Cluster](02-cluster.md) |
| 03 | [Лаба: cluster 7001-7006](03-lab-cluster.md) |

### Нагрузка и память (04–06)

| 04 | [Hot keys и cache stampede](04-hot-keys-stampede.md) |
| 05 | [Лаба: stampede](05-lab-stampede.md) |
| 06 | [Память: advanced](06-memory-advanced.md) |

### Security (07–08)

| 07 | [Security advanced](07-security.md) |
| 08 | [Лаба: rename-command](08-lab-rename-commands.md) |

### Ops и интервью (09–14)

| 09 | [Troubleshooting](09-troubleshooting.md) |
| 10 | [Лаба: OOM recovery](10-lab-oom-recovery.md) |
| 11 | [Interview Q&A (топ-30)](11-interview-qa.md) |
| 12 | [Лаба: mock interview](12-lab-mock-interview.md) |
| 13 | [System design](13-system-design.md) |
| 14 | [Лаба: system design](14-lab-system-design.md) |

### Паттерны и экосистема (15–18)

| 15 | [Паттерны: Redlock, rate limit](15-patterns-redlock.md) |
| 16 | [Valkey и Redis Stack](16-valkey-stack.md) |
| 17 | [K8s: StatefulSet и операторы](17-k8s-operators.md) |
| 18 | [Capstone](18-capstone.md) |

### Шпаргалка и примеры

| — | [Interview cheatsheet](interview-cheatsheet.md) |
| — | [examples/cluster-notes.md](examples/cluster-notes.md) |
| — | [examples/redis-security.conf](examples/redis-security.conf) |

## Что должно получиться

- Объясняете **single-threaded event loop**, **pipelining**, почему **большие ключи** — боль.
- Проектируете **hash tags**, понимаете **16384 slots**, **MOVED/ASK**, **failover** в Cluster.
- Снижаете **hot key** и **cache stampede** (TTL jitter, singleflight, local cache).
- Настраиваете **maxmemory**, **eviction**, читаете **mem_fragmentation_ratio**.
- Включаете **ACL**, **rename-command**, связываете с **host firewall** ([linux-intermediate: firewall](../linux-intermediate/07-firewall.md)).
- Восстанавливаете инстанс после **OOM** и диагностируете **latency spikes**.
- Отвечаете на **system design** «кэш + сессии для 50k RPS» с trade-offs.
- Критически оцениваете **Redlock** и альтернативы.
- Сравниваете **Valkey**, **Redis OSS**, **ElastiCache / MemoryDB**, **операторы** в k8s.

## Связь с другими курсами

| Курс | Связь |
|------|-------|
| [`redis-basic`](../redis-basic/README.md) | типы, TTL, базовые команды |
| [`redis-intermediate`](../redis-intermediate/README.md) | replica, Sentinel, RDB/AOF |
| [`linux-intermediate`](../linux-intermediate/07-firewall.md) | ufw/nftables вокруг Redis |
| [`kuber-intermediate`](../kuber-intermediate/01-statefulset.md) | StatefulSet для Redis/Valkey |
| [`aws-intermediate`](../aws-intermediate/README.md) | ElastiCache, VPC, security groups |
