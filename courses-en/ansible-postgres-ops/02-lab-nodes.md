# 02. Lab: nodes and an empty ops repo

Do **not** install Postgres yet.

## Ticket

P3 — onboarding

Create three empty LXC nodes. SSH, inventory with **Autobase group names**, README.

## Task 1. Containers

```text
pg-01   192.168.58.10
pg-02   192.168.58.11
pg-03   192.168.58.12
```

Ubuntu 22.04, `ubuntu` + your key, NOPASSWD sudo, **2 GiB** memory. Reference: [`examples/lxc-setup.sh`](examples/lxc-setup.sh).

## Task 2. Repo

```bash
mkdir -p ~/nimbus-pg/{inventory,group_vars/all,roles,playbooks/runbooks,artifacts,backups}
cd ~/nimbus-pg
ansible-galaxy collection install vitabaks.autobase:2.11.0 community.postgresql
```

`ansible.cfg` — picture: [`examples/ansible.cfg`](examples/ansible.cfg).

## Task 3. Inventory (their names)

Autobase expects **INI-style groups** (YAML children with the same names is OK if the collection accepts it — if deploy complains, use INI like their `inventory.example`):

```text
[master]
pg-01

[replica]
pg-02
pg-03

[postgres_cluster:children]
master
replica

[etcd_cluster]
pg-01
pg-02
pg-03
```

Plus `ansible_user`, key, `ansible_python_interpreter`. Sketch: [`examples/inventory/hosts.ini`](examples/inventory/hosts.ini).

`master` is **who bootstraps**. After the first failover it may no longer be the Patroni leader. Do not assume `pg-01` stays primary forever.

```bash
ansible all -m ping
ansible replica --list-hosts
```

## Task 4. README

Collection version, two-tree rule, “connect to the current leader, not always `.10`”.

## Success criteria

- [ ] three pong on `.58.10–.12`
- [ ] groups `master` / `replica` / `etcd_cluster` exist
- [ ] README written

Next: [03. Autobase](03-autobase.md).
