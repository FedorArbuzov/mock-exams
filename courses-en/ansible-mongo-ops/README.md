# Ansible — MongoDB ops

Hands-on **day-0 + day-2** on three Linux nodes: **`community.mongodb` 1.7.12** installs **MongoDB 7.0** community and a replica set named **`nimbus`**, then **your** repo (`nimbus-mongo`) owns databases, users, indexes, planned stepDown, backups you can fetch, member replace, and runbooks.

This is **not** Compose, **not** Helm, **not** a Kubernetes operator, and **not** `geerlingguy.mongodb` (one `mongod`). You call a pinned collection. Day-0 **and** day-2 objects use the **same** collection: roles for install, modules for `rs.initiate`, auth, users, indexes, status, stepDown. Everything else is playbooks you can explain. **No sharding** — no `mongos`, no config servers.

**Time:** ~12–16 hours + **1–2 hours** finale.  
**Prerequisites:** [`ansible-basic`](../ansible-basic/README.md). Replica-set words (PRIMARY / SECONDARY, `w:"majority"`) show up here on real processes. You **build the stand in this course**. Do not reuse a Docker Mongo or an operator cluster.

> There is **no** Interactive Check. Each lab has success criteria; the finale uses [`examples/scripts/verify.sh`](examples/scripts/verify.sh) as an author picture.

Setup: **[ENVIRONMENT.md](ENVIRONMENT.md)** · UI: **http://127.0.0.1:8091/ansible-mongo-ops/README.md**

---

## How to take this course

1. **ENVIRONMENT.md** once — tools and the LXD profile. No MongoDB yet.
2. **Read** the theory page.
3. **Do** the lab on the 16 GB host. Lesson 02 creates three empty nodes. Lesson 04 runs the collection roles + `mongodb_replicaset`. Then you write `~/nimbus-mongo`.
4. **Check** the lesson checklist.

Do **not** run [`ansible-k8s-ops`](../ansible-k8s-ops/README.md), [`ansible-kafka-ops`](../ansible-kafka-ops/README.md), [`ansible-postgres-ops`](../ansible-postgres-ops/README.md), or [`ansible-clickhouse-ops`](../ansible-clickhouse-ops/README.md) on the same host at the same time — RAM.

---

## Local stand

```text
host (LXD)       Ansible + mongosh (via SSH)
mongo-01  .10    mongod   (bootstrap / first PRIMARY — not forever)
mongo-02  .11    mongod   (SECONDARY)
mongo-03  .12    mongod   (SECONDARY)
```

Three **voting** members, replica set **`nimbus`**. That is a real small on-prem layout. No arbiter. No shard.

| Piece | Role |
|-------|------|
| LXD | three Ubuntu 22.04 on `192.168.59.0/24` |
| Ansible ≥ 2.15 | on the host |
| `community.mongodb` **1.7.12** | Galaxy — you do not edit its roles |
| MongoDB | **7.0** community (`mongodb-org`) |
| Workspace | `~/nimbus-mongo` |

**RAM:** **16 GB** on the LXD host. Cap each container at **2 GiB**. WiredTiger cache stays small (lesson 04).

[`examples/`](examples/README.md) is an author reference. You type the repo.

---

## Curriculum

### Cluster (01–04)

1. [Why two Ansible trees](01-why-two-trees.md)
2. [Lab: nodes and an empty ops repo](02-lab-nodes.md)
3. [`community.mongodb`: what you own](03-community-mongodb.md)
4. [Lab: install the replica set](04-lab-cluster.md)

### Baseline and objects (05–08)

5. [Baseline next to mongod](05-baseline.md)
6. [Lab: role `common`](06-lab-baseline.md)
7. [Databases, users, indexes as code](07-objects.md)
8. [Lab: shop database](08-lab-objects.md)

### Failover and a change window (09–12)

9. [stepDown vs kill PRIMARY](09-stepdown.md)
10. [Lab: planned stepDown](10-lab-stepdown.md)
11. [Change windows](11-change-window.md)
12. [Lab: secondaries first, then PRIMARY](12-lab-rolling.md)

### Backup, replace, incidents (13–19)

13. [Disaster kit](13-disaster-kit.md)
14. [Lab: mongodump off the node](14-lab-backup.md)
15. [Replace a member](15-replace.md)
16. [Lab: mongo-03 disk died](16-lab-replace.md)
17. [Runbooks](17-runbooks.md)
18. [Lab: junk and a dead secondary](18-lab-incident.md)
18b. [Lab: PRIMARY is dead](18b-lab-primary-down.md)
18c. [Lab: resync a secondary](18c-lab-resync.md)
16b. [Lab: majority / `w:3` trap](16b-lab-majority.md)
19. [Monday + finale](19-lab-audit-finale.md)

---

## What you should end up with

- Install a 3-member replica set with `community.mongodb` and say what you must **not** edit inside the collection.
- Create `shop` / `shop_app` / indexes with the collection modules and run the play twice.
- Do a **planned** stepDown and a game-day PRIMARY kill; write `w:"majority"` on the new PRIMARY. Objects still find PRIMARY — they do not assume `.10`.
- Restart secondaries `serial: 1`, then stepDown, then bounce the old PRIMARY.
- Fetch a `mongodump` kit (dump + keyfile + inventory) to the control node. Do not restore on the happy path.
- Replace a member (wipe OS, same IP, `rs.remove` / add, initial sync) and, separately, resync bad secondary data without recycling the LXC.
- See `w:3` die when one member is down; see **no PRIMARY** when two of three are down (quorum). Restore writeConcern from git.
- Fail a Monday audit when a member is down or `shop` is missing.

## Path

```text
ansible-basic
        ↓
ansible-mongo-ops   ← empty LXC → community.mongodb → nimbus-mongo
        ↓
same ops-repo idea: ansible-postgres-ops / ansible-kafka-ops / ansible-clickhouse-ops / ansible-k8s-ops
```

`geerlingguy.mongodb` / a lone `apt install mongodb-org` is **one** `mongod`. Fine for a laptop CI database. This course is a replica set, because that is the on-prem job.

## Related

| Course | Relation |
|--------|----------|
| [`ansible-basic`](../ansible-basic/README.md) | Inventory, roles, `serial`, tags, Vault |
| [`ansible-postgres-ops`](../ansible-postgres-ops/README.md) | Same ops-repo idea for **Patroni**. Bridge `.58` — do not mix RAM |
| [`ansible-kafka-ops`](../ansible-kafka-ops/README.md) | Same colocated quorum idea (**KRaft**). Bridge `.57` — do not mix RAM |
| [`ansible-clickhouse-ops`](../ansible-clickhouse-ops/README.md) | Same ops-repo idea for **ClickHouse + Keeper**. Bridge `.60` — do not mix RAM |
| [`ansible-k8s-ops`](../ansible-k8s-ops/README.md) | Same ops-repo idea for Kubernetes. Bridge `.56` — do not mix RAM |
