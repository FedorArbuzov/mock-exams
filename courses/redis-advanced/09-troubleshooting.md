# 09. Troubleshooting Redis в production

## Введение: runbook в 3 часа ночи

Алерт: **API latency p99**, Redis **connected_clients** растёт, `rejected_connections` > 0. Или: `OOM command not allowed when used memory > maxmemory`. Эта глава — **порядок диагностики**, не полный каталог всех багов.

## Что вы узнаете

- **Latency**: slowlog, latency doctor, intrinsic latency.
- **Memory / OOM**: maxmemory, eviction, killer.
- **Replication lag**, **CLUSTERDOWN**.
- **Connection storms**, timeouts.

---

## Первые 5 минут (любой инцидент)

```bash
redis-cli PING
redis-cli INFO server
redis-cli INFO clients
redis-cli INFO memory
redis-cli INFO stats
redis-cli SLOWLOG GET 20
```

| Симптом | Куда смотреть |
|---------|----------------|
| Все команды медленные | CPU, slowlog, big keys, AOF always |
| Только write | Disk AOF, replication backlog |
| Только один app | Ключи/паттерн приложения |
| Cluster partial | `CLUSTER INFO`, `CLUSTER NODES` |

---

## Latency

```bash
redis-cli --latency
redis-cli --latency-history -i 1
redis-cli LATENCY DOCTOR
redis-cli LATENCY LATEST
```

| Причина | Признак |
|---------|---------|
| Блокирующая команда | Spike в slowlog: `KEYS`, `SAVE`, большой `SUNION` |
| Fork COW | Latency при `BGREWRITEAOF` |
| Network | `redis-cli --latency` между app host и Redis |
| Hot key | Один master, commandstats |

**Intrinsic latency** (железо):

```bash
redis-cli --intrinsic-latency 100
```

---

## Memory и OOM

| Ответ Redis | Значение |
|-------------|----------|
| `OOM command not allowed` | `maxmemory` + `noeviction` или нет места для policy |
| Процесс killed | Host OOM killer — RSS > RAM |

Действия: [10-lab-oom-recovery](10-lab-oom-recovery.md), [06](06-memory-advanced.md).

```bash
redis-cli INFO memory | grep -E 'used_memory|maxmemory|evicted|fragmentation'
redis-cli MEMORY STATS
```

---

## Replication

```bash
redis-cli INFO replication
```

| Поле | Проблема |
|------|----------|
| `master_link_status:down` | Сеть, auth, master down |
| `master_repl_offset` vs replica offset | Lag |
| `repl_backlog_active:0` | Partial resync невозможен — full sync |

Full resync на большом dataset — **burst network + disk**.

---

## Cluster

```bash
redis-cli -c -p 7001 CLUSTER INFO
redis-cli -c -p 7001 CLUSTER NODES
```

| `cluster_state` | Действие |
|-----------------|----------|
| `fail` | Сколько masters up? quorum? |
| `ok` но apps fail | Клиент без cluster mode, stale slot map |

После рестарта всех нод без persistent volume — **`init-cluster.sh`** заново.

---

## Connections

```bash
redis-cli INFO clients
redis-cli CLIENT LIST | head
redis-cli CONFIG GET maxclients
```

**Connection storm** — пул в приложении, не новый TCP на каждый HTTP request.

---

## Чеклист «на собеседовании»

1. Уточнить: standalone / Sentinel / Cluster / managed?
2. **Recent change** (deploy, flush, resharding)?
3. **Metrics**: memory, ops/sec, latency, evicted_keys.
4. **Slowlog** и **big keys**.
5. **Blast radius** — один сервис или весь кластер?

---

## Резюме

Диагностика Redis — **INFO + slowlog + cluster state**, не перезагрузка «на удачу».

**Дальше:** [10. Лаба: OOM recovery](10-lab-oom-recovery.md).
