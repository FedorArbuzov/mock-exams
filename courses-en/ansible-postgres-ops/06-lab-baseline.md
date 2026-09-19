# 06. Lab: role `common`

## Ticket

P2 — security

chrony + sshd without passwords. Do not restart Patroni.

Role `roles/common` on `postgres_cluster`, tag `baseline`. Picture: [`examples/roles/common`](examples/roles/common/tasks/main.yml).

```bash
ansible-playbook site.yml --check --diff --tags baseline
ansible-playbook site.yml --tags baseline
```

Second run clean. `patronictl list` unchanged.

## Success criteria

- [ ] chrony active, sshd hardened
- [ ] Patroni units still running
- [ ] second apply clean

Next: [07. Objects](07-objects.md).
