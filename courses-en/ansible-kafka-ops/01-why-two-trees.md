# 01. Why two Ansible trees

Confluent Ansible **is** Ansible. Teams still keep a second repository. This course is that second repository.

## The job story

Nimbus needs on-prem Kafka. Three empty Linux boxes. There is no cluster yet. You install KRaft with `confluent.platform`, then you own topics, restarts, and disk. Nobody will pay you to rewrite their `kafka_broker` role. They will pay you when:

- `shop.orders` exists in git with `RF=3` and `min.insync.replicas=2`, not as a Slack one-liner;
- a CVE forces a broker restart **one at a time** while producers use `acks=all`;
- `kafka-03` disk dies and replicas must come back;
- under-replicated partitions page and the fix is a playbook, not a unique SSH novel.

That work is Ansible over SSH. It is not Helm. It is not Strimzi.

## Two trees

```text
~/.ansible/collections/.../confluent/platform/   pinned — you call playbooks
  playbooks/all.yml

~/nimbus-kafka/                                  you write this
  inventory/hosts.yml                            Confluent groups + your groups
  roles/common
  playbooks/topics.yml
  playbooks/rolling-restart.yml
  playbooks/preflight.yml
  playbooks/runbooks/
  playbooks/audit.yml
```

| Question | Answer |
|----------|--------|
| Who installs the JVM, packages, systemd units, `server.properties`? | `confluent.platform` |
| Who creates `shop.orders`? | `nimbus-kafka` |
| Who upgrades Confluent minor? | their playbook — **out of scope** here |
| Who does a Saturday OS/JVM reboot of brokers? | `nimbus-kafka` rolling restart |
| Who runs Kafka **inside** Kubernetes? | [`kuber-kafka`](../kuber-kafka/README.md) — other course |

If you find yourself editing files under the Galaxy collection, stop. Change inventory `vars` or write a playbook in `nimbus-kafka`.

## Compose vs this stand

[`kafka-intermediate`](../kafka-intermediate/README.md) already showed RF and ISR on **Docker**. Here the broker is a **systemd** process on a disk you can fill, restart, and wipe. Same CLI (`kafka-topics`, `kafka-configs`). Different failure domain.

## Checklist

- [ ] You can name two trees and what is allowed in each
- [ ] You will not claim “I wrote Confluent Ansible”
- [ ] [ENVIRONMENT.md](ENVIRONMENT.md) bridge `192.168.57.0/24` is read

Next: [02. Lab: nodes](02-lab-nodes.md).
