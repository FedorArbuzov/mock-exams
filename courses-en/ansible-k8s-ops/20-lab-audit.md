# 20. Lab: audit, certs, clock

## Ticket

P3 — Monday

Prove the fleet still matches the repo. Do not “fix it in the audit playbook.”

## Task 1. Audit play

`playbooks/audit.yml`, tag `audit`:

- sshd: root login disabled, password auth disabled (same as `common`)
- user `nimbus` present
- `chrony` active; `chronyc tracking` succeeds
- `kubelet` hold
- `/etc/systemd/journald.conf.d/nimbus.conf` exists
- on `k8s_cp`: cron or timer for etcd snapshot exists

Author picture: [`examples/playbooks/audit.yml`](examples/playbooks/audit.yml).

```bash
ansible-playbook playbooks/audit.yml
```

All asserts pass.

## Task 2. Cert report

`playbooks/certs-report.yml` or a play inside audit, `run_once` on `node-01`:

```bash
kubeadm certs check-expiration
```

`register` and `copy` the stdout to `~/nimbus-ops/artifacts/certs.txt` (`delegate_to: localhost`). Fail if the command fails.

## Task 3. Break and see

On **one** worker, temporarily comment `PermitRootLogin no` (or stop `chrony`). Re-run audit — it must **fail**. Restore with `site.yml --tags baseline` (and hygiene/users if you touched those). Audit green again.

Do not leave sshd broken.

## Success criteria

- [ ] audit green on a good stand
- [ ] audit red when you break one control
- [ ] `artifacts/certs.txt` exists and mentions client/server certs
- [ ] audit play did not change sshd back by itself

Next: [21. Final project](21-final-project.md).
