# 06. Lab: role `common`

## Ticket

P2 — security

Every Kafka box looks like a Nimbus node: chrony, sshd without passwords. Do not restart brokers.

## Task

Role `roles/common` on `kafka`, tag `baseline`. Packages: `chrony`, `jq`, `htop`. sshd drop-in: `PasswordAuthentication no`, `PermitRootLogin no`. Handler reloads **sshd**, not Kafka.

Author picture: [`examples/roles/common`](examples/roles/common/tasks/main.yml).

```bash
cd ~/nimbus-kafka
ansible-playbook site.yml --check --diff --tags baseline
ansible-playbook site.yml --tags baseline
ansible-playbook site.yml --tags baseline
```

Second apply clean. `kafka-topics --list` still works.

## Success criteria

- [ ] chrony active on all three
- [ ] `sshd -T` shows no password / no root
- [ ] broker units still active — you did not restart them
- [ ] second playbook run is clean

Next: [07. Topics as code](07-topics.md).
