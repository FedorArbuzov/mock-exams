# 02. Lab: nodes and an empty ops repo

Do **not** install ClickHouse yet. You do **not** copy `courses-en` onto the host.

## Ticket

P3 — onboarding

Create three empty LXC nodes. SSH, inventory with **both** group names, README.

## Task 1. Containers

On the 16 GB host, after [ENVIRONMENT.md](ENVIRONMENT.md) profile `ch` exists:

```text
ch-01   192.168.60.10
ch-02   192.168.60.11
ch-03   192.168.60.12
```

Ubuntu 22.04, `ubuntu` + your key, NOPASSWD sudo, **2 GiB** memory. Reference: [`examples/lxc-setup.sh`](examples/lxc-setup.sh). Launch **this** course’s nodes — do not attach leftover Kafka / Postgres / k8s LXC.

## Task 2. Repo

```bash
mkdir -p ~/nimbus-ch/{inventory,group_vars/all,host_vars,roles,playbooks/runbooks,artifacts,backups}
cd ~/nimbus-ch
```

`ansible.cfg` — picture: [`examples/ansible.cfg`](examples/ansible.cfg).

## Task 3. Inventory

Same three hosts in **both** groups (colocated, like Kafka KRaft):

```text
clickhouse          ch-01, ch-02, ch-03
clickhouse_keeper   ch-01, ch-02, ch-03
```

Host vars: `keeper_id` **1 / 2 / 3**, `clickhouse_shard: "01"`, `clickhouse_replica` = inventory name.

`all:vars`: `ansible_user=ubuntu`, key, `ansible_python_interpreter=/usr/bin/python3`, `ansible_become: true`.

Sketch: [`examples/inventory/hosts.yml`](examples/inventory/hosts.yml).

```bash
cd ~/nimbus-ch
ansible all -m ping
ansible clickhouse --list-hosts
ansible clickhouse_keeper --list-hosts
```

Three `pong`. Three names in each group.

## Task 4. README

Five lines: ClickHouse **24.8**, official apt, `roles/cluster` is frozen after lesson 04, cluster `nimbus`, you do not run a Galaxy installer.

## Success criteria

- [ ] `lxc list` shows three RUNNING nodes on `.10–.12` of **60**
- [ ] `ansible all -m ping` → three `pong`
- [ ] `keeper_id` is 1/2/3
- [ ] README states the two-tree rule

Next: [03. Keeper and cluster](03-keeper-cluster.md).
