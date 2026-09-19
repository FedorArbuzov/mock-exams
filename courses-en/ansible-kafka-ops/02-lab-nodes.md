# 02. Lab: nodes and an empty ops repo

Do **not** install Kafka yet. You do **not** copy `courses-en` onto the host.

## Ticket

P3 — onboarding

Create three empty LXC nodes. Get SSH, an inventory, and a README that says who owns what.

## Task 1. Three containers

On the 16 GB host, after [ENVIRONMENT.md](ENVIRONMENT.md) profile `kafka` exists:

```text
kafka-01   192.168.57.10
kafka-02   192.168.57.11
kafka-03   192.168.57.12
```

Each node: Ubuntu 22.04, SSH as `ubuntu` with your key, `sudo` without a password. Cap memory at **2 GiB**.

Reference: [`examples/lxc-setup.sh`](examples/lxc-setup.sh). Type them. Launch **this** course’s nodes — do not attach leftover Kubernetes LXC.

## Task 2. Repo skeleton

```bash
mkdir -p ~/nimbus-kafka/{inventory,group_vars/all,host_vars,roles,playbooks/runbooks,artifacts}
cd ~/nimbus-kafka
```

`ansible.cfg`: inventory path, `host_key_checking = False` for the lab. Picture: [`examples/ansible.cfg`](examples/ansible.cfg).

```bash
ansible-galaxy collection install confluent.platform:7.9.2 ansible.posix
```

## Task 3. Inventory (both group languages)

`inventory/hosts.yml` must contain Confluent group names **and** a group you will use for `common`:

```text
kafka_controller   kafka-01, kafka-02, kafka-03
kafka_broker       kafka-01, kafka-02, kafka-03
kafka              children: kafka_broker
```

`all:vars`: `ansible_user=ubuntu`, key, `ansible_python_interpreter=/usr/bin/python3`, `ansible_become: true`.

Do **not** add Schema Registry / Connect / Control Center groups.

```bash
cd ~/nimbus-kafka
ansible all -m ping
ansible kafka_broker --list-hosts
```

Three `pong`. Three broker names.

## Task 4. README

Five lines: Confluent collection version, this repo owns topics/restarts/runbooks, bootstrap `192.168.57.10:9092`, you do not edit Galaxy roles.

## Success criteria

- [ ] `lxc list` shows three RUNNING nodes on `.10–.12` of **57**
- [ ] `ansible all -m ping` → three `pong`
- [ ] README states the two-tree rule

Next: [03. Confluent Ansible](03-confluent-ansible.md).
