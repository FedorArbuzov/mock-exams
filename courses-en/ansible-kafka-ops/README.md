# Ansible — Kafka ops

Hands-on **day-0 + day-2** on three Linux nodes: **Confluent Ansible** (`confluent.platform`) installs a KRaft Kafka cluster, then **your** repo (`nimbus-kafka`) owns topics, rolling restarts, broker replace, and runbooks.

This is **not** Docker Compose, **not** Strimzi, and **not** Control Center. You call a pinned collection. Everything else is playbooks you can explain.

**Time:** ~12–16 hours + **1–2 hours** finale.  
**Prerequisites:** [`ansible-basic`](../ansible-basic/README.md) and [`kafka-intermediate`](../kafka-intermediate/README.md) (RF, ISR, `acks=all`, `min.insync.replicas`). You **build the stand in this course**: three empty LXC nodes, then Confluent Ansible, then `nimbus-kafka`. Do not reuse Compose or a Strimzi cluster.

> There is **no** Interactive Check. Each lab has success criteria; the finale uses [`examples/scripts/verify.sh`](examples/scripts/verify.sh) as an author picture.

Setup: **[ENVIRONMENT.md](ENVIRONMENT.md)** · UI: **http://127.0.0.1:8091/ansible-kafka-ops/README.md**

---

## How to take this course

1. **ENVIRONMENT.md** once — tools and the LXD profile. No Kafka yet.
2. **Read** the theory page.
3. **Do** the lab on the 16 GB host. Lesson 02 creates three empty nodes. Lesson 04 runs `confluent.platform.all`. Then you write `~/nimbus-kafka`.
4. **Check** the lesson checklist. Second playbook run should be mostly `changed=0` unless the ticket restarts a broker.

Do **not** run [`ansible-k8s-ops`](../ansible-k8s-ops/README.md) on the same host at the same time — RAM.

---

## Local stand

```text
host (LXD)      Ansible + kafka CLI tools
kafka-01  .10   KRaft controller + broker
kafka-02  .11   KRaft controller + broker
kafka-03  .12   KRaft controller + broker
```

Three **colocated** KRaft nodes (each host is in `kafka_controller` **and** `kafka_broker`). That is a real small-cluster layout. No ZooKeeper. No Schema Registry, Connect, or Control Center.

| Piece | Role |
|-------|------|
| LXD / Incus | three Ubuntu 22.04 nodes on `192.168.57.0/24` |
| Ansible ≥ 2.15 | on the host |
| `confluent.platform` 7.9.x | Galaxy collection — you do not edit its roles |
| Workspace | `~/nimbus-kafka` |

**RAM:** **16 GB** on the LXD host. Cap each container at **2 GiB**. Heap stays small (lesson 04). Turn **off** Docker Desktop Kubernetes.

[`examples/`](examples/README.md) is an author reference. You type the repo.

---

## Curriculum

### Cluster (01–04)

1. [Why two Ansible trees](01-why-two-trees.md)
2. [Lab: nodes and an empty ops repo](02-lab-nodes.md)
3. [Confluent Ansible: what you own](03-confluent-ansible.md)
4. [Lab: install KRaft](04-lab-cluster.md)

### Baseline and topics (05–08)

5. [Baseline next to the brokers](05-baseline.md)
6. [Lab: role `common`](06-lab-baseline.md)
7. [Topics as code](07-topics.md)
8. [Lab: shop topics](08-lab-topics.md)
8b. [Lab: app pinned one broker](08b-lab-bootstrap.md)

### Failure and a change window (09–12)

9. [ISR on real processes](09-isr.md)
10. [Lab: stop a broker](10-lab-failover.md)
11. [Rolling restart](11-rolling.md)
12. [Lab: restart one at a time](12-lab-rolling.md)

### Replace and incidents (13–19)

13. [Replace a broker](13-replace.md)
14. [Lab: kafka-03 disk died](14-lab-replace.md)
15. [Runbooks](15-runbooks.md)
16. [Lab: URP and disk](16-lab-incident.md)
16b. [Lab: min.isr trap](16b-lab-min-isr.md)
16c. [Lab: preferred leaders](16c-lab-preferred-leader.md)
17. [Monday morning](17-monday.md)
18. [Lab: audit](18-lab-audit.md)
19. [Final project](19-final-project.md)

---

## What you should end up with

- Install a 3-node KRaft cluster with Confluent Ansible and say what you must **not** edit inside the collection.
- Declare topics from inventory (`RF=3`, `min.insync.replicas=2`) and apply them twice without errors.
- Survive an app that pinned one bootstrap IP; the client list is three brokers.
- Survive a broker stop and see under-replicated partitions recover.
- See `acks=all` die when `min.insync.replicas=3` and one broker is down — restore from `topics.yml`.
- Restart brokers `serial: 1` only after URP is zero; put preferred leaders back without another bounce.
- Replace a node: wipe OS, re-run the installer, put replicas back.
- Close a Disk / URP page with a playbook you can run twice.

## Path

```text
ansible-basic + kafka-intermediate
        ↓
ansible-kafka-ops   ← empty LXC → Confluent Ansible → nimbus-kafka
        ↓
kuber-kafka (Strimzi — different stand)
```

[`kafka-basic`](../kafka-basic/README.md) / [`kafka-intermediate`](../kafka-intermediate/README.md) are Compose. [`kuber-kafka`](../kuber-kafka/README.md) is an operator. This course is **VMs + systemd + Ansible**, like production on-prem Kafka.

## Related

| Course | Relation |
|--------|----------|
| [`ansible-basic`](../ansible-basic/README.md) | Inventory, roles, `serial`, tags |
| [`kafka-intermediate`](../kafka-intermediate/README.md) | RF / ISR / alter — here those commands hit **real** brokers |
| [`ansible-k8s-ops`](../ansible-k8s-ops/README.md) | Same ops-repo idea for Kubernetes. **Other** LXC network — do not mix RAM |
| [`kuber-kafka`](../kuber-kafka/README.md) | Kafka **on** Kubernetes (Strimzi), not this installer |
| [`ansible-postgres-ops`](../ansible-postgres-ops/README.md) | Same ops-repo idea for **Patroni**. Bridge `.58` — do not mix RAM |
| [`ansible-mongo-ops`](../ansible-mongo-ops/README.md) | Replica set on `.59` — do not mix RAM |
| [`ansible-clickhouse-ops`](../ansible-clickhouse-ops/README.md) | ClickHouse + Keeper on `.60` — do not mix RAM |
| [`zabbix-ops`](../zabbix-ops/README.md) | Host monitoring (Zabbix 7). Bridge `.61` — do not mix RAM |
