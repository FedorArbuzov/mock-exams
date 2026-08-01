# 06. Lab: automatic failover via Sentinel

## Lab goal

Bring up [`docker-compose.sentinel.yml`](../../deploy/redis/docker-compose.sentinel.yml), write data, **kill the master**, wait for failover, and find the **new** master via Sentinel.

## Prerequisites

```bash
cd deploy/redis
docker compose down
docker compose -f docker-compose.replication.yml down 2>/dev/null || true
docker compose -f docker-compose.sentinel.yml up -d
```

Wait ~30 s for Sentinels to elect the master.

```bash
redis-cli -p 26379 PING
redis-cli -p 26379 SENTINEL master mymaster
```

---

## Task 1. Current master

```bash
redis-cli -p 26379 SENTINEL get-master-addr-by-name mymaster
redis-cli -p 6379 SET lab:sentinel:order 42
redis-cli -p 6379 GET lab:sentinel:order
```

Note the master **container name** (from `docker ps` — usually `mock-redis-sentinel-master`).

---

## Task 2. Sentinel and replica list

```bash
redis-cli -p 26379 SENTINEL sentinels mymaster
redis-cli -p 26379 SENTINEL replicas mymaster
```

**What you'll see:** two replicas, three sentinels (some without a host port publish — normal).

---

## Task 3. Master failure

```bash
docker stop mock-redis-sentinel-master
```

Watch Sentinel logs:

```bash
docker logs mock-redis-sentinel-1 --tail 30
```

After **5–60 s** (depends on `down-after` and failover):

```bash
redis-cli -p 26379 SENTINEL get-master-addr-by-name mymaster
```

**What you'll see:** IP/name of a **different** replica as master (port 6379 inside the Docker network).

Verify data on the new master (connect to the host if the new role's port is published — often you need exec):

```bash
docker exec mock-redis-sentinel-replica-1 redis-cli GET lab:sentinel:order
# or replica-2 — check get-master-addr-by-name output
```

---

## Task 4. Write after failover

Identify the new-master container from `docker ps` and:

```bash
docker exec <new-master-container> redis-cli SET lab:sentinel:after-failover ok
docker exec <new-master-container> redis-cli GET lab:sentinel:after-failover
```

---

## Task 5. Events (+switch-master)

```bash
docker logs mock-redis-sentinel-1 2>&1 | grep -i switch
```

**What you'll see:** a line about the master switch (`+switch-master`).

---

## Task 6. Reset

```bash
docker compose -f docker-compose.sentinel.yml down -v
```

---

## Success criteria

| # | Criterion |
|---|----------|
| 1 | Before failure, key `lab:sentinel:order` is readable |
| 2 | After stopping the old master, Sentinel returns a new address |
| 3 | Data survived on the promoted replica |
| 4 | Logs show a failover signal |
| 5 | You explained the difference from manual `REPLICAOF NO ONE` |

## If it doesn't work

| Symptom | Action |
|---------|----------|
| `Could not connect to Sentinel` | `docker ps`, port `26379`, wait 60 s |
| Master doesn't change | quorum: need 2 of 3 Sentinels alive |
| Port 6379 silent after failover | connect via `docker exec` to the container from `get-master-addr-by-name` |

Next lesson: [07. Streams](07-streams.md).
