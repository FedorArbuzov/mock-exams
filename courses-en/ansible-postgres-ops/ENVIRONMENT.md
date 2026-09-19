# Environment for Ansible Postgres ops

Three **Linux nodes** that Ansible can SSH into. **Autobase** (`vitabaks.autobase`) installs Patroni + etcd + PostgreSQL. **Your** playbooks in `~/nimbus-pg` do everything after that.

This is **not** [`deploy/postgres`](../../deploy/postgres/README.md) and **not** Docker Desktop Kubernetes.

The stand is **one 16 GB Ubuntu host + three LXC nodes you create in [lesson 02](02-lab-nodes.md)**. Do **not** reuse nodes from another course.

Open lessons: **http://127.0.0.1:8091/ansible-postgres-ops/README.md**

```text
pg-01   192.168.58.10   bootstrap master + etcd
pg-02   192.168.58.11   replica + etcd
pg-03   192.168.58.12   replica + etcd
```

Bridge **`192.168.58.0/24`**. Do not publish `5432` on a public interface.

---

## What you need

| Tool | Where |
|------|--------|
| LXD / Incus | host that runs the nodes |
| Ansible ≥ 2.15 (collection asks 2.15+) | same host |
| `vitabaks.autobase` 2.11.0 | `ansible-galaxy collection install vitabaks.autobase:2.11.0` |
| `community.postgresql` | databases / roles |
| `psql` | on the host **or** via SSH to the leader |
| RAM | **16 GB** |

Windows: Ansible inside WSL2 or SSH to the 16 GB box.

Turn **off** Docker Desktop Kubernetes, Compose Postgres, and the k8s/Kafka LXC stands.

---

## One-time: LXD profile

Postgres does **not** need privileged nesting.

```bash
sudo apt update
sudo apt install -y ansible git python3-pip python3-venv curl postgresql-client
ansible-galaxy collection install vitabaks.autobase:2.11.0 community.postgresql
sudo snap install lxd
sudo lxd init --auto
sudo usermod -aG lxd "$USER"
```

```bash
lxc network create pgbr0 ipv4.address=192.168.58.1/24 ipv4.nat=true ipv6.address=none

lxc profile create pg
lxc profile device add pg root disk path=/ pool=default
lxc profile device add pg eth0 nic nictype=bridged parent=pgbr0 name=eth0
```

Containers: **[lesson 02](02-lab-nodes.md)**. Reference: [`examples/lxc-setup.sh`](examples/lxc-setup.sh).

---

## Work directory

```bash
mkdir -p ~/nimbus-pg
```

[`examples/`](examples/README.md) is an author reference.

---

## Versions

| Piece | Pin |
|-------|-----|
| Autobase collection | `vitabaks.autobase` **2.11.0** (older name: vitabaks/postgresql_cluster) |
| PostgreSQL | **16** unless the collection default is newer — set it explicitly |
| DCS | etcd on all three |
| HAProxy | **off** (`with_haproxy_load_balancing: false`) |
| `pgbackrest_install` | off until [lesson 13](13-disaster-kit.md); first kit is `pg_basebackup` |

If 2.11.0 is missing on Galaxy, use the latest **2.11.x** or **2.10.x** and write the version in the README. Do not float on `latest`.

---

## Sanity checklist (after lesson 04)

- [ ] `ansible all -m ping` — three `pong`
- [ ] `patronictl list` — one Leader, two Replica, State running
- [ ] `psql` to the **leader** IP as a superuser the installer created
- [ ] You can name PGDATA and the Patroni unit without opening an Autobase role

---

## Related

| Course | When |
|--------|------|
| [`kuber-postgres` ENVIRONMENT](../kuber-postgres/ENVIRONMENT.md) | Other track: CNPG |
| [`ansible-kafka-ops` ENVIRONMENT](../ansible-kafka-ops/ENVIRONMENT.md) | Other bridge `.57` |
