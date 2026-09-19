# Environment for Zabbix ops

A **Zabbix 7.0 LTS** server on the 16 GB host (Docker Compose) and **three small LXC nodes** that run `zabbix-agent2`. Your Ansible repo (`~/nimbus-zabbix`) owns the agents. You click the web UI for hosts, triggers, maintenance, and actions.

This is **not** Prometheus, **not** Grafana, and **not** `kube-prometheus-stack`.

The stand is **one 16 GB Ubuntu host + three LXC nodes you create in [lesson 02](02-lab-stand.md)**. Do **not** reuse nodes from another course.

Open lessons: **http://127.0.0.1:8091/zabbix-ops/README.md**

```text
host          192.168.61.1    Compose: Postgres + zabbix-server + web :8080
node-01       192.168.61.10   zabbix-agent2
node-02       192.168.61.11   zabbix-agent2
node-03       192.168.61.12   zabbix-agent2
```

Bridge **`192.168.61.0/24`**. Do not publish `8080` / `10051` on a public interface.

---

## What you need

| Tool | Where |
|------|--------|
| LXD / Incus | host that runs the nodes |
| Docker Engine + Compose v2 | **same host** — Zabbix server only |
| Ansible ≥ 2.15 | same host |
| Browser | Zabbix UI at `http://<host>:8080` |
| RAM | **16 GB** |

Windows: Ansible, LXD, and Compose **on the 16 GB Ubuntu box** (or WSL2 only if that box *is* the LXD host). Read the course in the browser on Windows.

Turn **off** Docker Desktop Kubernetes, the observability Compose stack, and every `ansible-*-ops` LXC stand. **16 GB is not enough for Zabbix + Kafka/K8s/Postgres at once.** This stand is lighter (~2 GB Compose + 3×512 MiB LXC) but the other courses are not.

---

## One-time: LXD profile

Agents do **not** need privileged nesting.

```bash
sudo apt update
sudo apt install -y ansible git python3-pip curl ca-certificates
sudo snap install lxd
sudo lxd init --auto
sudo usermod -aG lxd "$USER"
# log out and back in
```

Docker Engine if it is missing: follow current Docker docs for Ubuntu. You need `docker compose version` (plugin v2), not only `docker-compose`.

```bash
lxc network create zbxbr0 ipv4.address=192.168.61.1/24 ipv4.nat=true ipv6.address=none

lxc profile create zbx
lxc profile device add zbx root disk path=/ pool=default
lxc profile device add zbx eth0 nic nictype=bridged parent=zbxbr0 name=eth0
```

Containers: **[lesson 02](02-lab-stand.md)**. Reference: [`examples/lxc-setup.sh`](examples/lxc-setup.sh).

---

## Work directory

```bash
mkdir -p ~/nimbus-zabbix
```

[`examples/`](examples/README.md) is an author reference. You type into `~/nimbus-zabbix`.

---

## Versions (pin these unless a lab says otherwise)

| Piece | Pin |
|-------|-----|
| Zabbix | **7.0 LTS** |
| Server image | `zabbix/zabbix-server-pgsql:alpine-7.0-latest` |
| Web image | `zabbix/zabbix-web-nginx-pgsql:alpine-7.0-latest` |
| Database | `postgres:16-alpine` |
| Agent | `zabbix-agent2` from `repo.zabbix.com` **7.0** on Ubuntu 22.04 |
| UI | `http://<host-ip>:8080` — first login `Admin` / `zabbix` |

After the first `docker compose pull`, write the **image digests** in your README. Do not float onto 7.2/7.4 mid-course.

Compose lab passwords stay in git. That is the lab. In production they are Vault.

---

## Sanity checklist (after lesson 02)

- [ ] `ansible all -m ping` — three `pong`
- [ ] `docker compose ps` in `~/nimbus-zabbix/compose` — server, web, postgres **healthy / running**
- [ ] Browser opens the Zabbix login page
- [ ] `systemctl is-active zabbix-agent2` on all three nodes
- [ ] You can say host / item / trigger / action without opening the UI

---

## Related

| Course | When |
|--------|------|
| [`ansible-basic` ENVIRONMENT](../ansible-basic/ENVIRONMENT.md) | Inventory, roles, handlers — this course **uses** them |
| [`observability-basic` ENVIRONMENT](../observability-basic/ENVIRONMENT.md) | Other product: Prometheus. Other Compose project — do not mix RAM |
| [`ansible-clickhouse-ops` ENVIRONMENT](../ansible-clickhouse-ops/ENVIRONMENT.md) | Other bridge `.60` |
| [`ansible-k8s-ops` ENVIRONMENT](../ansible-k8s-ops/ENVIRONMENT.md) | Other bridge `.56` |
