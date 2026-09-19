# Ansible — Postgres ops

Hands-on **day-0 + day-2** on three Linux nodes: **Autobase** (`vitabaks.autobase`, the project still widely called **vitabaks/postgresql_cluster**) installs **Patroni + etcd + PostgreSQL**, then **your** repo (`nimbus-pg`) owns databases, roles, switchover windows, backups you can fetch, node replace, and runbooks.

This is **not** Compose, **not** CloudNativePG, and **not** `apt install postgresql` via ANXS/geerlingguy. You call a pinned collection. Day-2 objects use **`community.postgresql`**. Everything else is playbooks you can explain.

**Time:** ~12–16 hours + **1–2 hours** finale.  
**Prerequisites:** [`ansible-basic`](../ansible-basic/README.md) and [`postgresql-intermediate`](../postgresql-intermediate/README.md) (WAL, streaming replica). Helpful: [`postgresql-advanced` 01](../postgresql-advanced/01-patroni-ha.md) so Patroni is not a new word. You **build the stand in this course**. Do not reuse Compose or a CNPG cluster.

> There is **no** Interactive Check. Each lab has success criteria; the finale uses [`examples/scripts/verify.sh`](examples/scripts/verify.sh) as an author picture.

Setup: **[ENVIRONMENT.md](ENVIRONMENT.md)** · UI: **http://127.0.0.1:8091/ansible-postgres-ops/README.md**

---

## How to take this course

1. **ENVIRONMENT.md** once — tools and the LXD profile. No Postgres yet.
2. **Read** the theory page.
3. **Do** the lab on the 16 GB host. Lesson 02 creates three empty nodes. Lesson 04 runs `vitabaks.autobase.deploy_pgcluster`. Then you write `~/nimbus-pg`.
4. **Check** the lesson checklist.

Do **not** run [`ansible-k8s-ops`](../ansible-k8s-ops/README.md), [`ansible-kafka-ops`](../ansible-kafka-ops/README.md), or [`zabbix-ops`](../zabbix-ops/README.md) on the same host at the same time — RAM.

---

## Local stand

```text
host (LXD)     Ansible + psql + patronictl (via SSH)
pg-01  .10     etcd + Patroni + PostgreSQL   (bootstrap master)
pg-02  .11     etcd + Patroni + PostgreSQL   (replica)
pg-03  .12     etcd + Patroni + PostgreSQL   (replica)
```

Three **colocated** nodes: DCS quorum and database on the same boxes. That is a real small on-prem layout. HAProxy/VIP is **off** unless a later ticket turns it on — you talk to the current **leader** (`patronictl list`).

| Piece | Role |
|-------|------|
| LXD | three Ubuntu 22.04 on `192.168.58.0/24` |
| Ansible ≥ 2.15 | on the host |
| `vitabaks.autobase` 2.11.x | Galaxy — you do not edit its roles |
| `community.postgresql` | databases and roles after the cluster exists |
| Workspace | `~/nimbus-pg` |

**RAM:** **16 GB** on the LXD host. Cap each container at **2 GiB**. `shared_buffers` stays small (lesson 04).

[`examples/`](examples/README.md) is an author reference. You type the repo.

---

## Curriculum

### Cluster (01–04)

1. [Why two Ansible trees](01-why-two-trees.md)
2. [Lab: nodes and an empty ops repo](02-lab-nodes.md)
3. [Autobase: what you own](03-autobase.md)
4. [Lab: deploy Patroni](04-lab-cluster.md)

### Baseline and objects (05–08)

5. [Baseline next to Patroni](05-baseline.md)
6. [Lab: role `common`](06-lab-baseline.md)
7. [Databases and roles as code](07-objects.md)
8. [Lab: shop database](08-lab-objects.md)
8b. [Lab: shop cannot connect](08b-lab-access.md)

### Failover and a change window (09–12)

9. [Switchover vs failover](09-switchover.md)
10. [Lab: planned switchover](10-lab-switchover.md)
11. [Change windows](11-change-window.md)
12. [Lab: restart replicas then the leader](12-lab-rolling.md)

### Backup, replace, incidents (13–19)

13. [Disaster kit](13-disaster-kit.md)
14. [Lab: basebackup off the node](14-lab-backup.md)
14b. [Lab: prove the kit](14b-lab-restore.md)
15. [Replace a replica](15-replace.md)
16. [Lab: pg-03 disk died](16-lab-replace.md)
17. [Runbooks](17-runbooks.md)
18. [Lab: lag and disk](18-lab-incident.md)
18b. [Lab: leader is dead](18b-lab-failover.md)
18c. [Lab: reinit a replica](18c-lab-reinit.md)
19. [Monday + finale](19-lab-audit-finale.md)

---

## What you should end up with

- Install Patroni+etcd+Postgres with Autobase and say what you must **not** edit inside the collection.
- Create `shop` / `shop_app` with `community.postgresql` and run the play twice.
- Do a **planned** switchover and a game-day failover; write to the new leader.
- Restart replicas `serial: 1`, then switchover before you touch the old leader.
- Fetch a physical backup and prove it with `pg_controldata` on a throwaway dir — not on live PGDATA.
- Close “shop_app cannot connect” via `pg_hba`, not iptables.
- Replace a replica (wipe OS, `add_node`) and, separately, `reinit` bad replica data without recycling the VM.
- Fail a Monday audit when a member is down or `shop` is missing.

## Path

```text
ansible-basic + postgresql-intermediate
        ↓
ansible-postgres-ops   ← empty LXC → Autobase → nimbus-pg
        ↓
kuber-postgres (CNPG — different stand)
postgresql-ops (pgBackRest/WAL-G depth on Compose)
```

ANXS / geerlingguy / `linux-system-roles.postgresql` are **single-instance** installers. One page in lesson 03 explains when those are enough. This course is HA, because that is the on-prem job.

## Related

| Course | Relation |
|--------|----------|
| [`postgresql-intermediate`](../postgresql-intermediate/README.md) | WAL / replica — here those ideas hit **Patroni** |
| [`postgresql-advanced`](../postgresql-advanced/README.md) 01 | Patroni theory; this course is the lab they skipped |
| [`postgresql-ops`](../postgresql-ops/README.md) | Deeper backup tools on Compose — not this stand |
| [`kuber-postgres`](../kuber-postgres/README.md) | Operator on Kubernetes, not VMs |
| [`ansible-k8s-ops`](../ansible-k8s-ops/README.md) / [`ansible-kafka-ops`](../ansible-kafka-ops/README.md) | Same ops-repo idea. **Other** bridges — do not mix RAM |
| [`ansible-mongo-ops`](../ansible-mongo-ops/README.md) | Replica set on `.59` — do not mix RAM |
| [`ansible-clickhouse-ops`](../ansible-clickhouse-ops/README.md) | ClickHouse + Keeper on `.60` — do not mix RAM |
| [`zabbix-ops`](../zabbix-ops/README.md) | Host monitoring (Zabbix 7). Bridge `.61` — do not mix RAM |
