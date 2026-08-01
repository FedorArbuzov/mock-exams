# 08. Lab: rename-command and ACL deny

## Lab goal

On a **separate** instance with a custom config, disable `FLUSHALL`/`DEBUG`, rename `CONFIG`, create an **ACL user app** with key restrictions — and verify that dangerous operations are denied. Tie this to **host firewall** ([linux-intermediate: 07-firewall](../linux-intermediate/07-firewall.md)).

## Prerequisites

- [07. Security](07-security.md).
- Fragment: [`examples/redis-security.conf`](examples/redis-security.conf).

---

## Setup: container with config

From the repo root (paths for Git Bash / Linux):

```bash
cd deploy/redis
docker compose up -d
```

Copy the training config into a volume or run a second container (simplified — override command):

```bash
docker run -d --name redis-sec-lab -p 6381:6379 \
  -v "$(pwd)/../../courses/redis-advanced/examples/redis-security.conf:/usr/local/etc/redis/redis.conf:ro" \
  redis:7.2-alpine redis-server /usr/local/etc/redis/redis.conf
```

If the volume path doesn’t mount on Windows — copy `redis-security.conf` to `deploy/redis/config/redis-security-lab.conf` and:

```bash
docker run -d --name redis-sec-lab -p 6381:6379 \
  -v "%cd%\config\redis-security-lab.conf:/usr/local/etc/redis/redis.conf:ro" \
  redis:7.2-alpine redis-server /usr/local/etc/redis/redis.conf
```

```bash
redis-cli -p 6381 PING
```

---

## Task 1. Disabled commands

```bash
redis-cli -p 6381 FLUSHALL
redis-cli -p 6381 DEBUG SEGFAULT
```

**What you’ll see:** `ERR unknown command` (or similar) — commands removed.

---

## Task 2. Renamed CONFIG

```bash
redis-cli -p 6381 CONFIG GET maxmemory
redis-cli -p 6381 CONFIG_SECRET_a8f3 GET maxmemory
```

**What you’ll see:** old `CONFIG` unavailable; secret name works (name from your conf).

**If the name doesn’t match:** open `examples/redis-security.conf` and use your `rename-command`.

---

## Task 3. ACL user `app`

```bash
redis-cli -p 6381 ACL LIST
redis-cli -u redis://app:AppLabPassword@127.0.0.1:6381 SET app:session:1 ok
redis-cli -u redis://app:AppLabPassword@127.0.0.1:6381 SET other:key fail
redis-cli -u redis://app:AppLabPassword@127.0.0.1:6381 FLUSHALL
```

**What you’ll see:** `app:*` — OK; `other:*` and `FLUSHALL` — denied.

---

## Task 4. Firewall link (theory + checklist)

Read [07-firewall](../linux-intermediate/07-firewall.md) (the “two layers” section). Fill the table for an **imaginary** prod Redis host:

| Rule | ufw / SG |
|---------|----------|
| SSH | Bastion /32 only |
| Redis 6379 | App subnets only |
| Cluster bus 16379 | Between Redis nodes only |
| Internet → 6379 | **Deny** |

**Interview question:** why can `ufw deny 6379` on a host with a Docker published port **fail** to protect as you expect? (see firewall lesson — FORWARD/DNAT).

---

## Success criteria

- [ ] `FLUSHALL` / `DEBUG` unavailable.
- [ ] `CONFIG` only under the renamed name.
- [ ] User `app` writes only to `app:*`.
- [ ] Firewall table filled in.

---

## Cleanup

```bash
docker rm -f redis-sec-lab
```

**Next:** [09. Troubleshooting](09-troubleshooting.md).
