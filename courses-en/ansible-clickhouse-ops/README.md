# Ansible — ClickHouse ops

Hands-on **day-0 + day-2** on three Linux nodes: you install **ClickHouse Server + ClickHouse Keeper** from the **official apt repo**, then **your** repo (`nimbus-ch`) owns schema, rolling restarts, backups you can fetch, node replace, and runbooks.

This is **not** Docker Compose, **not** Helm, **not** the Altinity operator, and **not** Kubernetes. There is **no** Autobase / Kubespray-class official installer. A Galaxy role that “installs ClickHouse” is not the job. You pin **24.8** LTS, write inventory-driven `config.d`, and freeze that installer after lesson 04.

**Time:** ~12–16 hours + **1–2 hours** finale.  
**Prerequisites:** [`ansible-basic`](../ansible-basic/README.md) only. This course teaches cluster, replica, and readonly. There is no `clickhouse-intermediate` to take first.

> There is **no** Interactive Check. Each lab has success criteria; the finale uses [`examples/scripts/verify.sh`](examples/scripts/verify.sh) as an author picture.

Setup: **[ENVIRONMENT.md](ENVIRONMENT.md)** · UI: **http://127.0.0.1:8091/ansible-clickhouse-ops/README.md**

---

## How to take this course

1. **ENVIRONMENT.md** once — tools and the LXD profile. No ClickHouse yet.
2. **Read** the theory page.
3. **Do** the lab on the 16 GB host. Lesson 02 creates three empty nodes. Lesson 04 applies `roles/cluster`. Then you write day-2 playbooks in `~/nimbus-ch`.
4. **Check** the lesson checklist.

Do **not** run [`ansible-k8s-ops`](../ansible-k8s-ops/README.md), [`ansible-kafka-ops`](../ansible-kafka-ops/README.md), [`ansible-postgres-ops`](../ansible-postgres-ops/README.md), or [`ansible-mongo-ops`](../ansible-mongo-ops/README.md) on the same host at the same time — RAM.

---

## Local stand

```text
host (LXD)     Ansible + clickhouse-client (via SSH)
ch-01  .10     Keeper + Server   (replica, keeper_id=1)
ch-02  .11     Keeper + Server   (replica, keeper_id=2)
ch-03  .12     Keeper + Server   (replica, keeper_id=3)
```

Three **colocated** nodes: Keeper quorum and ClickHouse Server on the same boxes, like Kafka KRaft. **1 shard, 3 replicas.** Cluster name **`nimbus`**. Table engine **ReplicatedMergeTree**. No ZooKeeper.

| Piece | Role |
|-------|------|
| LXD | three Ubuntu 22.04 on `192.168.60.0/24` |
| Ansible ≥ 2.15 | on the host |
| Official ClickHouse apt | **24.8** LTS — `clickhouse-server`, `clickhouse-client`, `clickhouse-keeper` |
| `roles/cluster` | frozen installer — packages, `config.d`, Keeper raft |
| Workspace | `~/nimbus-ch` |

**RAM:** **16 GB** on the LXD host. Cap each container at **2 GiB**. Server memory stays small (lesson 04).

[`examples/`](examples/README.md) is an author reference. You type the repo.

---

## Curriculum

### Cluster (01–04)

1. [Why two Ansible trees](01-why-two-trees.md)
2. [Lab: nodes and an empty ops repo](02-lab-nodes.md)
3. [Keeper, cluster, config.d](03-keeper-cluster.md)
4. [Lab: install Server + Keeper](04-lab-cluster.md)

### Baseline and schema (05–08)

5. [Baseline next to ClickHouse](05-baseline.md)
6. [Lab: role `common`](06-lab-baseline.md)
7. [Schema as code ON CLUSTER](07-schema.md)
8. [Lab: shop database](08-lab-schema.md)

### Replica down and a change window (09–12)

9. [Replication, readonly, parts](09-replication.md)
10. [Lab: stop a replica](10-lab-replica-down.md)
11. [Change windows](11-change-window.md)
12. [Lab: rolling server restart](12-lab-rolling.md)

### Backup, replace, incidents (13–19)

13. [Disaster kit](13-disaster-kit.md)
14. [Lab: backup off the node](14-lab-backup.md)
15. [Replace a replica](15-replace.md)
16. [Lab: ch-03 disk died](16-lab-replace.md)
17. [Runbooks](17-runbooks.md)
18. [Lab: junk and a dead server](18-lab-incident.md)
18b. [Lab: one Keeper down](18b-lab-keeper-down.md)
18c. [Lab: readonly replica](18c-lab-readonly.md)
19. [Monday + finale](19-lab-audit-finale.md)

---

## What you should end up with

- Install a 3-node ClickHouse + Keeper cluster from official 24.8 packages and say what you must **not** edit in `roles/cluster` after lesson 04.
- Create `shop` / `shop.events` with `ON CLUSTER nimbus` and a Vault user in `users.d`. Run the play twice.
- Survive one **server** down: inserts still work; the replica catches up.
- Restart servers `serial: 1`. Never bounce all Keepers at once.
- Fetch a backup (metadata + data) to the control node. Do not restore on the happy path.
- Replace `ch-03` (wipe OS, same IP, Keeper `server_id` stays 3) and let ReplicatedMergeTree sync.
- Survive **one** Keeper down. Close a readonly replica with a runbook, not `rm -rf` on three datadirs.
- Fail a Monday audit when a member is down or `shop.events` is missing.

## Path

```text
ansible-basic
        ↓
ansible-clickhouse-ops   ← empty LXC → official apt + roles/cluster → nimbus-ch
        ↓
same ops-repo idea: ansible-postgres-ops / ansible-kafka-ops / ansible-mongo-ops / ansible-k8s-ops
```

Galaxy roles (`anhnt094.clickhouse` and friends) are **someone’s** installer, not an official product. Helm / Altinity operator are **Kubernetes**. This course is **VMs + systemd + Ansible**, like production on-prem ClickHouse.

## Related

| Course | Relation |
|--------|----------|
| [`ansible-basic`](../ansible-basic/README.md) | Inventory, roles, `serial`, tags |
| [`ansible-postgres-ops`](../ansible-postgres-ops/README.md) | Same ops-repo idea for **Patroni**. Bridge `.58` — do not mix RAM |
| [`ansible-kafka-ops`](../ansible-kafka-ops/README.md) | Same colocated quorum idea (**KRaft**). Bridge `.57` — do not mix RAM |
| [`ansible-mongo-ops`](../ansible-mongo-ops/README.md) | Same ops-repo idea for **replica set**. Other bridge — do not mix RAM |
| [`ansible-k8s-ops`](../ansible-k8s-ops/README.md) | Same ops-repo idea for Kubernetes. Bridge `.56` — do not mix RAM |
