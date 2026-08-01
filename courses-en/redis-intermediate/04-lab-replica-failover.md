# 04. Lab: replication and manual failover

## Lab goal

Bring up a **master + replica** stand, verify data replication, simulate a master failure, and perform a **manual promote** of the replica to the new master.

## Prerequisites

```bash
cd deploy/redis
docker compose down
docker compose -f docker-compose.replication.yml up -d
docker compose -f docker-compose.replication.yml ps
```

Both Redis instances and Commander are **Up**.

---

## Task 1. Stand map

**Why:** don't mix up the ports.

| Connection | Port | Role |
|-------------|------|------|
| `redis-cli -p 6379` | 6379 | master |
| `redis-cli -p 6380` | 6380 | replica (6379 inside the container) |

```bash
docker exec mock-redis-master redis-cli INFO server | grep redis_version
docker exec mock-redis-replica redis-cli INFO replication | grep -E 'role|master_host|master_link_status'
```

**What you'll see:** `role:slave`/`replica`, `master_host:redis-master`, `master_link_status:up`.

---

## Task 2. Write on master, read from replica

```bash
redis-cli -p 6379 SET lab:repl:order:1001 '{"status":"paid"}'
redis-cli -p 6379 INCR lab:repl:counter
sleep 1
redis-cli -p 6380 GET lab:repl:order:1001
redis-cli -p 6380 GET lab:repl:counter
```

**What you'll see:** the same values on the replica.

Attempt to write on the replica:

```bash
redis-cli -p 6380 SET lab:repl:hack 1
```

Expect **READONLY**.

---

## Task 3. Offset and lag

```bash
docker exec mock-redis-master redis-cli INFO replication | grep -E 'master_repl_offset|connected_slaves'
docker exec mock-redis-replica redis-cli INFO replication | grep -E 'slave_repl_offset|master_repl_offset'
```

Write 100 keys:

```bash
for i in $(seq 1 100); do redis-cli -p 6379 SET "lab:repl:bulk:$i" $i; done
docker exec mock-redis-replica redis-cli DBSIZE
```

**What you'll see:** DB size on the replica matches (or ±1 in a race).

---

## Task 4. Simulate master failure

**Why:** practice DR without Sentinel.

```bash
docker stop mock-redis-master
redis-cli -p 6380 GET lab:repl:order:1001
```

Data on the replica **is there**, but new writes on the master are impossible.

---

## Task 5. Manual promote

On the replica (port 6380 from the host):

```bash
redis-cli -p 6380 REPLICAOF NO ONE
redis-cli -p 6380 INFO replication | grep role
redis-cli -p 6380 SET lab:repl:promoted 1
```

**What you'll see:** `role:master`, write succeeds.

Note in your notebook: **the new master listens on 6380** (in reality you would update DNS/load balancer).

---

## Task 6. (Optional) Bring up the old master as a replica

```bash
docker start mock-redis-master
sleep 3
docker exec mock-redis-master redis-cli REPLICAOF host.docker.internal 6380
```

On Linux `host.docker.internal` may not work — use the host IP or recreate compose. For the course, tasks 1–5 are enough.

---

## Task 7. Reset the stand

```bash
docker compose -f docker-compose.replication.yml down
```

Before Sentinel/single labs — make sure the ports are free.

---

## Success criteria

| # | Criterion |
|---|----------|
| 1 | Master data is visible on `6380` |
| 2 | Writes on the replica are rejected |
| 3 | After stopping the master, the replica still serves keys |
| 4 | After `REPLICAOF NO ONE` the replica accepts `SET` |
| 5 | You understand why the app needs a new endpoint |

Next lesson: [05. Sentinel](05-sentinel.md).
