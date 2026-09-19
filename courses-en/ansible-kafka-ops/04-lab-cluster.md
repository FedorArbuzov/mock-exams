# 04. Lab: install KRaft

Install Kafka with Confluent Ansible on the three empty nodes from [lesson 02](02-lab-nodes.md). First run takes a while (Java, debs). Do **not** skip the playbook.

## Task 1. Confluent vars

In `~/nimbus-kafka` add `group_vars/all/confluent.yml` (or `all.vars` in inventory):

- `confluent_server_enabled: false`
- `ssl_enabled: false`
- `kafka_broker_configure_multiple_listeners: false`
- heap limits so two JVMs fit in 2 GiB
- `ansible_become: true` if not already in inventory

Sketch: [`examples/group_vars/all/confluent.yml`](examples/group_vars/all/confluent.yml) and [`examples/inventory/hosts.yml`](examples/inventory/hosts.yml).

Confirm collection:

```bash
ansible-galaxy collection list | grep confluent.platform
```

## Task 2. Apply

```bash
cd ~/nimbus-kafka
ansible-playbook -i inventory/hosts.yml confluent.platform.all \
  --tags kafka_controller,kafka_broker
```

If a task name mentions Control Center or Connect, **stop** — a group leaked into inventory.

## Task 3. Proof

On each host:

```bash
systemctl list-units --type=service --all | grep -iE 'kafka|confluent'
```

Write the **exact** unit names into the README (they differ between Server and community).

From `kafka-01`:

```bash
# binary name may be kafka-topics or kafka-topics.sh — tab-complete
kafka-topics --bootstrap-server 192.168.57.10:9092 --list
```

Empty list is success. `Connection refused` is not — wait for the unit, read the journal.

Optional: install the same CLI packages on the **host** so you do not SSH to produce. Not required.

## Task 4. Look at disk

On `kafka-01`:

- list `log.dirs` (from `server.properties` or the path in [03](03-confluent-ansible.md))
- `journalctl -u <broker-unit> -n 50 --no-pager`

Put both paths in `~/nimbus-kafka/README.md`.

## Success criteria

- [ ] collection 7.9.2
- [ ] three broker units active
- [ ] `--list` against `:9092` works
- [ ] no Control Center process

Next: [05. Baseline](05-baseline.md).
