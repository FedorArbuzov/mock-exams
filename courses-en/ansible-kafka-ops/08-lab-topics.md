# 08. Lab: shop topics

## Ticket

P2 — platform

`shop.orders` and `shop.dead` must exist before the app team’s demo. RF=3. `min.insync.replicas=2`. Idempotent.

## Task

`playbooks/topics.yml`, tag `topics`. Loop `nimbus_topics`. Bootstrap `192.168.57.10:9092` (or a list of all three).

Author picture: [`examples/playbooks/topics.yml`](examples/playbooks/topics.yml).

```bash
ansible-playbook playbooks/topics.yml
ansible-playbook playbooks/topics.yml
```

```bash
kafka-topics --bootstrap-server 192.168.57.10:9092 --describe --topic shop.orders
```

You want `ReplicationFactor: 3`, `Configs: min.insync.replicas=2`, three replicas listed on each partition.

## Success criteria

- [ ] both topics exist
- [ ] describe matches the YAML
- [ ] second apply does not fail (create `--if-not-exists` or equivalent)
- [ ] no topic was created by a producer as a side effect

Next: [08b. Lab: app pinned one broker](08b-lab-bootstrap.md).
