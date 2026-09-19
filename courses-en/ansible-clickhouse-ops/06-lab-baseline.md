# 06. Lab: role `common`

## Ticket

P2 — security

chrony + sshd without passwords. Do not restart ClickHouse.

Role `roles/common` on `clickhouse`, tag `baseline`. Picture: [`examples/roles/common`](examples/roles/common/tasks/main.yml).

```bash
cd ~/nimbus-ch
ansible-playbook site.yml --check --diff --tags baseline
ansible-playbook site.yml --tags baseline
```

Second run clean. `systemctl is-active clickhouse-server clickhouse-keeper` unchanged on all three.

## Success criteria

- [ ] chrony active, sshd hardened
- [ ] Server and Keeper units still running
- [ ] second apply clean
- [ ] `common` has no notify on ClickHouse units

Next: [07. Schema](07-schema.md).
