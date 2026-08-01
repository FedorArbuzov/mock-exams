# 03. Lab: Redis Cluster (7001-7006)

## Lab goal

Bring up a **6-node** Cluster on Docker, run `init-cluster.sh`, verify **hash slots**, **MOVED redirects**, replica **failover**, and record observations in [`examples/cluster-notes.md`](examples/cluster-notes.md).

## Prerequisites

- [02. Redis Cluster](02-cluster.md).
- Docker, `bash` (Git Bash / WSL on Windows).
- Stop other compose stacks from `deploy/redis` ([stand README](../../deploy/redis/README.md)).

```bash
cd deploy/redis
docker compose down 2>/dev/null || true
docker compose -f docker-compose.cluster.yml up -d
bash scripts/init-cluster.sh
```

---

## Stand setup

```bash
docker compose -f docker-compose.cluster.yml ps
redis-cli -c -p 7001 PING
redis-cli -c -p 7001 CLUSTER INFO
```

**What you’ll see:** `cluster_state:ok`, `cluster_slots_assigned:16384`.

**If `cluster_state:fail`:** wait for healthcheck; re-run `init-cluster.sh`; check logs `docker logs mock-redis-cluster-1`.

---

## Task 1. Topology

**Why:** understand who is master and who is replica.

```bash
redis-cli -c -p 7001 CLUSTER NODES
```

Save in `cluster-notes.md`: three `master` lines and three `slave`, plus `replicates` binding.

**Criterion:** you can name the master for slot `9999` (command below).

```bash
redis-cli -p 7001 CLUSTER KEYSLOT test:9999
redis-cli -c -p 7001 CLUSTER GETKEYSINSLOT <slot> 1
```

---

## Task 2. Write and redirect

**Why:** see how `redis-cli -c` works.

```bash
redis-cli -c -p 7001 SET lab:user:1 alice
redis-cli -c -p 7001 GET lab:user:1
redis-cli -p 7001 CLUSTER KEYSLOT lab:user:1
```

Repeat from a **different** port (e.g. `7004`):

```bash
redis-cli -c -p 7004 GET lab:user:1
```

**What you’ll see:** the client with `-c` redirects itself to the right master.

**Without `-c`:** you may get `MOVED ...` — record the full text in notes.

---

## Task 3. Hash tag

**Why:** multi-key in one slot.

```bash
redis-cli -c -p 7001 MSET order:{lab99}:hdr "v1" order:{lab99}:lines "[]"
redis-cli -c -p 7001 MGET order:{lab99}:hdr order:{lab99}:lines
```

Compare slots:

```bash
redis-cli -p 7001 CLUSTER KEYSLOT order:{lab99}:hdr
redis-cli -p 7001 CLUSTER KEYSLOT order:lab99:hdr
```

**What you’ll see:** with `{}` — one slot; without tag — slots may differ.

---

## Task 4. Master failure (training)

**Why:** see failover (~5-15 s on the stand).

1. Find the master for key `lab:failover:test` (record node id).
2. Write a value:

```bash
redis-cli -c -p 7001 SET lab:failover:test ok-before
```

3. Stop **the container** of that master (name from `docker ps`, e.g. `mock-redis-cluster-2`):

```bash
docker stop mock-redis-cluster-2
sleep 8
redis-cli -c -p 7001 GET lab:failover:test
redis-cli -c -p 7001 CLUSTER NODES | grep failover
```

4. Bring the node back:

```bash
docker start mock-redis-cluster-2
sleep 5
redis-cli -c -p 7001 CLUSTER NODES | grep redis-2
```

**What you’ll see:** after timeout — a new master for the slot; data **usually** preserved (async repl). A brief `CLUSTERDOWN` period is acceptable.

**If the key disappeared:** the replica hadn’t synced yet — discuss the async replication risk.

---

## Task 5. Documentation

Fill in [`examples/cluster-notes.md`](examples/cluster-notes.md): port table, `CLUSTER INFO` output, one MOVED example, failover time.

---

## Success criteria

- [ ] `cluster_state:ok`, 16384 slots assigned.
- [ ] `SET`/`GET` via `-c` from any port 7001-7006.
- [ ] Hash tag `{lab99}` — `MGET` without `CROSSSLOT`.
- [ ] After `docker stop` of master — reading the key works again.
- [ ] `cluster-notes.md` filled in.

---

## If it doesn’t work

| Symptom | Solution |
|---------|---------|
| `Connection refused` on 700x | `docker compose -f docker-compose.cluster.yml ps` |
| `Cluster isn't configured` | `bash scripts/init-cluster.sh` |
| `NOAUTH` | ACL is off on the stand; in prod — see [07](07-security.md) |
| Windows without bash | Git Bash: `bash scripts/init-cluster.sh` |

**Next:** [04. Hot keys](04-hot-keys-stampede.md).
