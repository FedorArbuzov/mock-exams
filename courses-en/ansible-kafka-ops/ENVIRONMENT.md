# Environment for Ansible Kafka ops

Three **Linux nodes** that Ansible can SSH into. **Confluent Ansible** installs Kafka. **Your** playbooks in `~/nimbus-kafka` do everything after that.

This is **not** [`deploy/kafka`](../../deploy/kafka/README.md) Compose and **not** Docker Desktop Kubernetes.

The stand is **one 16 GB Ubuntu host + three LXC nodes you create in [lesson 02](02-lab-nodes.md)**. Do **not** reuse nodes or a cluster from another course.

Open lessons: **http://127.0.0.1:8091/ansible-kafka-ops/README.md**

```text
kafka-01   192.168.57.10   controller + broker
kafka-02   192.168.57.11   controller + broker
kafka-03   192.168.57.12   controller + broker
```

The Kafka bridge is **`192.168.57.0/24`**, not the `192.168.56.0/24` Kubernetes lab network. Do not publish `9092` on a public interface.

---

## What you need

| Tool | Where |
|------|--------|
| LXD / Incus | host that runs the nodes |
| Ansible ≥ 2.15 | same host |
| `confluent.platform` 7.9.x | `ansible-galaxy collection install confluent.platform:7.9.2` |
| `ansible.posix` | `authorized_key` for the users role (optional if you skip extra humans) |
| RAM | **16 GB** on the LXC host |

Windows: run Ansible **inside WSL2 Ubuntu** or SSH to the 16 GB box. Read the course in the browser on Windows.

Turn **off** Docker Desktop Kubernetes and any Compose Kafka (`deploy/kafka`) while this stand is up. Do **not** run [`ansible-k8s-ops`](../ansible-k8s-ops/ENVIRONMENT.md) in parallel.

---

## One-time: LXD profile

Kafka does **not** need privileged nesting (no kubelet, no CNI). On the 16 GB host:

```bash
sudo apt update
sudo apt install -y ansible git python3-pip python3-venv curl
ansible-galaxy collection install confluent.platform:7.9.2 ansible.posix
sudo snap install lxd
sudo lxd init --auto
sudo usermod -aG lxd "$USER"
# log out and back in
```

```bash
lxc network create kafkabr0 ipv4.address=192.168.57.1/24 ipv4.nat=true ipv6.address=none

lxc profile create kafka
lxc profile device add kafka root disk path=/ pool=default
lxc profile device add kafka eth0 nic nictype=bridged parent=kafkabr0 name=eth0
```

Creating the three containers is **[lesson 02](02-lab-nodes.md)**. Reference: [`examples/lxc-setup.sh`](examples/lxc-setup.sh).

---

## Work directory

```bash
mkdir -p ~/nimbus-kafka
```

Student files live **outside** `courses-en`. [`examples/`](examples/README.md) is an author reference.

---

## Versions

| Piece | Version |
|-------|---------|
| Confluent Ansible collection | `confluent.platform` **7.9.2** |
| Kafka | whatever 7.9.x community packages the collection installs |
| KRaft | yes — no ZooKeeper group in inventory |
| `confluent_server_enabled` | **false** (Apache Kafka packages, not Confluent Server) |

No Control Center, Schema Registry, Connect, ksqlDB. No Helm.

---

## Sanity checklist (after lesson 04)

- [ ] `ansible -i ~/nimbus-kafka/inventory/hosts.yml all -m ping` — three `pong`
- [ ] `systemctl is-active confluent-kafka` (or the unit the collection created) on all three
- [ ] `kafka-topics --bootstrap-server 192.168.57.10:9092 --list` works from a broker **or** the host if you installed the CLI there
- [ ] You can name `log.dirs` and the systemd unit without opening a Confluent role

---

## Related

| Course | When |
|--------|------|
| [`ansible-k8s-ops` ENVIRONMENT](../ansible-k8s-ops/ENVIRONMENT.md) | Other track, other bridge (`192.168.56.0/24`) |
| [`kafka-intermediate`](../kafka-intermediate/README.md) | Compose 3-broker — theory, not this stand |
