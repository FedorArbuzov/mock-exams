# 06. Lab: role `common`

## Ticket

P2 — security

chrony + sshd without passwords. Do not restart `mongod`.

Role `roles/common` on `mongo`, tag `baseline`. Picture: [`examples/roles/common`](examples/roles/common/tasks/main.yml).

```bash
ansible-playbook site.yml --check --diff --tags baseline
ansible-playbook site.yml --tags baseline
```

Second run clean. `rs.status()` unchanged.

## Success criteria

- [ ] chrony active, sshd hardened
- [ ] `mongod` units still running
- [ ] second apply clean

Next: [07. Objects](07-objects.md).
