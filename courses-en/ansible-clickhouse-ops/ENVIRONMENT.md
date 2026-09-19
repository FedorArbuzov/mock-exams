# Environment for Ansible ClickHouse ops

Three **Linux nodes** that Ansible can SSH into. **You** install ClickHouse Server + ClickHouse Keeper from the official apt repo. **Your** playbooks in `~/nimbus-ch` do everything after that.

This is **not** Docker Compose, **not** Helm, and **not** the Altinity operator.

The stand is **one 16 GB Ubuntu host + three LXC nodes you create in [lesson 02](02-lab-nodes.md)**. Do **not** reuse nodes from another course.

Open lessons: **http://127.0.0.1:8091/ansible-clickhouse-ops/README.md**

```text
ch-01   192.168.60.10   Keeper + Server   keeper_id=1
ch-02   192.168.60.11   Keeper + Server   keeper_id=2
ch-03   192.168.60.12   Keeper + Server   keeper_id=3
```

Bridge **`192.168.60.0/24`**. Do not publish `9000` / `8123` / `9181` on a public interface.

---

## What you need

| Tool | Where |
|------|--------|
| LXD / Incus | host that runs the nodes |
| Ansible ≥ 2.15 | same host |
| `clickhouse-client` | on the nodes after lesson 04; optional on the host |
| RAM | **16 GB** |

Windows: Ansible inside WSL2 or SSH to the 16 GB box.

Turn **off** Docker Desktop Kubernetes, Compose databases, and every other `ansible-*-ops` LXC stand. **16 GB is not enough for two of these at once.**

---

## One-time: LXD profile

ClickHouse does **not** need privileged nesting.

```bash
sudo apt update
sudo apt install -y ansible git python3-pip python3-venv curl
sudo snap install lxd
sudo lxd init --auto
sudo usermod -aG lxd "$USER"
# log out and back in
```

```bash
lxc network create chbr0 ipv4.address=192.168.60.1/24 ipv4.nat=true ipv6.address=none

lxc profile create ch
lxc profile device add ch root disk path=/ pool=default
lxc profile device add ch eth0 nic nictype=bridged parent=chbr0 name=eth0
```

Containers: **[lesson 02](02-lab-nodes.md)**. Reference: [`examples/lxc-setup.sh`](examples/lxc-setup.sh).

---

## Work directory

```bash
mkdir -p ~/nimbus-ch
```

[`examples/`](examples/README.md) is an author reference. You type into `~/nimbus-ch`.

---

## Versions

| Piece | Pin |
|-------|-----|
| ClickHouse | **24.8** LTS (`24.8.x` — write the exact debs you installed) |
| Packages | `clickhouse-server`, `clickhouse-client`, `clickhouse-keeper` |
| Repo | official `https://packages.clickhouse.com/deb` |
| Cluster | name **`nimbus`**, 1 shard, 3 replicas |
| Coordination | **ClickHouse Keeper** — not ZooKeeper |
| Engine | **ReplicatedMergeTree** |

If 24.8.x is missing from `stable`, use the vendor **lts** channel or pin the last 24.8 build `apt-cache madison` shows. Do not float on `latest` (25.x / 26.x). Write the version in the README.

---

## Sanity checklist (after lesson 04)

- [ ] `ansible all -m ping` — three `pong`
- [ ] `systemctl is-active clickhouse-server` and `clickhouse-keeper` on all three
- [ ] `SELECT * FROM system.clusters WHERE cluster = 'nimbus'` — 3 replicas, 1 shard
- [ ] INSERT into a probe **ReplicatedMergeTree** works
- [ ] You can name `config.d`, Keeper `server_id`, and `/var/lib/clickhouse` without opening a Galaxy role

---

## Related

| Course | When |
|--------|------|
| [`ansible-kafka-ops` ENVIRONMENT](../ansible-kafka-ops/ENVIRONMENT.md) | Other bridge `.57` — colocated KRaft |
| [`ansible-postgres-ops` ENVIRONMENT](../ansible-postgres-ops/ENVIRONMENT.md) | Other bridge `.58` — Patroni + etcd |
| [`ansible-mongo-ops` ENVIRONMENT](../ansible-mongo-ops/ENVIRONMENT.md) | Other bridge — replica set |
| [`ansible-k8s-ops` ENVIRONMENT](../ansible-k8s-ops/ENVIRONMENT.md) | Other bridge `.56` |
| [`zabbix-ops` ENVIRONMENT](../zabbix-ops/ENVIRONMENT.md) | Other bridge `.61` — Zabbix agents |
