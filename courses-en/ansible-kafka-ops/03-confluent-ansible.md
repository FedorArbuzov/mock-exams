# 03. Confluent Ansible: what you own

`confluent.platform` is a Galaxy collection of roles that install Java, community or Confluent Server packages, write `server.properties`, and start **systemd** units. You own the **inventory** and a few `all.vars`. You do not paste a mystery one-liner and walk away.

## Playbook you will call

```bash
ansible-playbook -i inventory/hosts.yml confluent.platform.all \
  --tags kafka_controller,kafka_broker
```

`--tags` keeps Schema Registry / Control Center **off**. Full `confluent.platform.all` without tags will try extra components if those groups exist — that is why lesson 02 left them out.

Pin **7.9.2**. Mixing `latest` 8.x with a blog post for 7.6 is how people spend a Sunday on variable names.

## Groups (their names)

| Group | This lab |
|-------|----------|
| `kafka_controller` | all three — KRaft quorum |
| `kafka_broker` | all three — serve produce/consume |
| `zookeeper` | **absent** |

Colocation (same host in both groups) is supported. Two JVMs per node: controller + broker. That is why heap must stay small.

## Variables you must set

```yaml
# inventory or group_vars/all/confluent.yml
confluent_server_enabled: false    # community Kafka, not Confluent Server
ssl_enabled: false                 # lab only — say so in the README
kafka_broker_configure_multiple_listeners: false
```

Heap (names can vary slightly by collection patch — check `docs/VARIABLES.md` inside the installed collection):

```text
kafka_controller heap ~512m
kafka_broker heap ~768m
```

If the first apply OOMs the LXC, lower heap before you add packages.

`log.dirs` default is typically `/var/lib/kafka/data`. You will need that path in [hygiene](15-runbooks.md). Do not change it in lab 04 unless you have a reason.

## What the playbook leaves on disk

On each node you should later point at:

```text
systemd unit     confluent-kafka   (community) — confirm with systemctl list-units '*kafka*'
data             /var/lib/kafka/data
controller data  /var/lib/controller/data   (typical)
config           /etc/kafka/  or /etc/confluent/
```

If you cannot name the unit and `log.dirs` after lesson 04, you only “ran Ansible.”

## Checklist

- [ ] You know `--tags kafka_controller,kafka_broker`
- [ ] `confluent_server_enabled: false` is non-negotiable for this lab
- [ ] You will not add `control_center_next_gen` on a 2 GiB LXC

Next: [04. Lab: install KRaft](04-lab-cluster.md).
