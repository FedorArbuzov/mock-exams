# 02. Lab: nodes and an empty ops repo

Do **not** install MongoDB yet.

## Ticket

P3 — onboarding

Create three empty LXC nodes. SSH, inventory, README.

## Task 1. Containers

```text
mongo-01   192.168.59.10
mongo-02   192.168.59.11
mongo-03   192.168.59.12
```

Ubuntu 22.04, `ubuntu` + your key, NOPASSWD sudo, **2 GiB** memory. Reference: [`examples/lxc-setup.sh`](examples/lxc-setup.sh).

## Task 2. Repo

```bash
mkdir -p ~/nimbus-mongo/{inventory,group_vars/all,roles,playbooks/runbooks,artifacts,backups,collections}
cd ~/nimbus-mongo
ansible-galaxy collection install -r collections/requirements.yml
```

`ansible.cfg` — picture: [`examples/ansible.cfg`](examples/ansible.cfg). Pin **1.7.12** in `collections/requirements.yml`.

## Task 3. Inventory

Groups **`mongo`** (all three) and **`mongo_rs`** (same three — the replica set). Sketch: [`examples/inventory/hosts.yml`](examples/inventory/hosts.yml).

`nimbus_bootstrap` is **who runs `rs.initiate`**. After the first stepDown it may no longer be PRIMARY. Do not assume `mongo-01` stays primary forever.

```bash
ansible all -m ping
ansible mongo_rs --list-hosts
```

## Task 4. README

Collection version, two-tree rule, “connect to the current PRIMARY, not always `.10`”.

## Success criteria

- [ ] three pong on `.59.10–.12`
- [ ] groups `mongo` / `mongo_rs` exist
- [ ] README written

Next: [03. community.mongodb](03-community-mongodb.md).
