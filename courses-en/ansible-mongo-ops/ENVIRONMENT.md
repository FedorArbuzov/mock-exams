# Environment for Ansible MongoDB ops

Three **Linux nodes** that Ansible can SSH into. **`community.mongodb` 1.7.12** installs MongoDB 7.0 and replica set **`nimbus`**. **Your** playbooks in `~/nimbus-mongo` do everything after that — and the **same** collection’s modules do day-2 objects.

This is **not** Docker Compose Mongo, **not** Helm, and **not** a Kubernetes operator.

The stand is **one 16 GB Ubuntu host + three LXC nodes you create in [lesson 02](02-lab-nodes.md)**. Do **not** reuse nodes from another course.

Open lessons: **http://127.0.0.1:8091/ansible-mongo-ops/README.md**

```text
mongo-01   192.168.59.10   bootstrap (first rs.initiate)
mongo-02   192.168.59.11   secondary
mongo-03   192.168.59.12   secondary
```

Bridge **`192.168.59.0/24`**. Do not publish `27017` on a public interface.

---

## What you need

| Tool | Where |
|------|--------|
| LXD / Incus | host that runs the nodes |
| Ansible ≥ 2.15 | same host |
| `community.mongodb` **1.7.12** | `ansible-galaxy collection install community.mongodb:1.7.12` |
| `pymongo` (4+) | **on the targets** — modules run there |
| `mongosh` | on a member (package the repo installs) or via SSH |
| RAM | **16 GB** |

Windows: Ansible inside WSL2 or SSH to the 16 GB box.

Turn **off** Docker Desktop Kubernetes, Compose Mongo, and the k8s / Kafka / Postgres / ClickHouse LXC stands.

---

## One-time: LXD profile

MongoDB does **not** need privileged nesting.

```bash
sudo apt update
sudo apt install -y ansible git python3-pip python3-venv curl
ansible-galaxy collection install community.mongodb:1.7.12
sudo snap install lxd
sudo lxd init --auto
sudo usermod -aG lxd "$USER"
# log out and back in
```

```bash
lxc network create mongobr0 ipv4.address=192.168.59.1/24 ipv4.nat=true ipv6.address=none

lxc profile create mongo
lxc profile device add mongo root disk path=/ pool=default
lxc profile device add mongo eth0 nic nictype=bridged parent=mongobr0 name=eth0
```

Containers: **[lesson 02](02-lab-nodes.md)**. Reference: [`examples/lxc-setup.sh`](examples/lxc-setup.sh).

---

## Work directory

```bash
mkdir -p ~/nimbus-mongo
```

[`examples/`](examples/README.md) is an author reference.

---

## Versions

| Piece | Pin |
|-------|-----|
| Galaxy collection | `community.mongodb` **1.7.12** |
| MongoDB | **7.0** community — `mongodb_version: "7.0"` (collection default in 1.7.12 is **not** 7.0) |
| Replica set | **`nimbus`** |
| Sharding | **off** — do not call `mongodb_mongos` / `mongodb_config` |
| Auth | keyFile + authorization **after** `rs.initiate` |

If 1.7.12 is missing on Galaxy, stop and fix the pin. Do not float on `latest`.

---

## Sanity checklist (after lesson 04)

- [ ] `ansible all -m ping` — three `pong`
- [ ] `rs.status()` — one PRIMARY, two SECONDARY
- [ ] `mongosh` to the **PRIMARY** (not always `.10`)
- [ ] You can name `dbPath` and the `mongod` unit without opening a collection role

---

## Related

| Course | When |
|--------|------|
| [`ansible-postgres-ops` ENVIRONMENT](../ansible-postgres-ops/ENVIRONMENT.md) | Other bridge `.58` |
| [`ansible-kafka-ops` ENVIRONMENT](../ansible-kafka-ops/ENVIRONMENT.md) | Other bridge `.57` |
| [`ansible-clickhouse-ops` ENVIRONMENT](../ansible-clickhouse-ops/ENVIRONMENT.md) | Other bridge `.60` |
| [`ansible-k8s-ops` ENVIRONMENT](../ansible-k8s-ops/ENVIRONMENT.md) | Other bridge `.56` |
