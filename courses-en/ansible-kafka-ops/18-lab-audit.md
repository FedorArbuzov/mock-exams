# 18. Lab: audit

## Ticket

P3 — Monday

Prove the fleet matches the repo. Do not fix drift inside the audit playbook.

## Task

`playbooks/audit.yml`, tag `audit`. Asserts from [17](17-monday.md).

Author picture: [`examples/playbooks/audit.yml`](examples/playbooks/audit.yml).

```bash
ansible-playbook playbooks/audit.yml
```

Then break **one** control (stop chrony **or** comment sshd drop-in) on `kafka-02`. Audit must **fail**. Restore with `site.yml --tags baseline` (and start the unit if you stopped it). Audit green.

Do not leave sshd broken.

## Success criteria

- [ ] audit green on a good stand
- [ ] audit red when you break one check
- [ ] audit did not repair sshd by itself

Next: [19. Final project](19-final-project.md).
