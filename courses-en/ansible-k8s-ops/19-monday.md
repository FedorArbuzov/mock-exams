# 19. Monday morning

Nobody installs a cluster on Monday. They ask: did anything **drift**?

`playbooks/audit.yml` is a read-mostly play: `assert` / `fail` when the company baseline is gone. It is not `site.yml`. Applying and auditing are different buttons.

## What to assert

| Check | Why |
|-------|-----|
| `PermitRootLogin` is `no` | someone “temporarily” opened it |
| `nimbus` user exists | access playbook was skipped on a new disk |
| `chrony` active | etcd / certs |
| chrony offset parseable and small | clocks drifted after a pause |
| `kubelet` hold | unattended-upgrades |
| journald drop-in exists | hygiene rolled back |
| backup cron/timer on CP | DR theatre |
| `kubeadm certs check-expiration` on CP | 90-day lab certs vs 1-year prod — still run the command |

Certificates in a fresh Kubespray cluster are **not** about to expire. The habit is the point. Write `artifacts/certs.txt`. `failed_when` if a line shows `< 30d` — on this stand it should pass.

## Clock

`chronyc tracking` output varies. A robust lab check:

- `systemctl is-active chrony` is `active`
- `chronyc tracking` rc is 0

If you parse `System time` / offset, fail only on a clearly huge number (seconds, not microseconds). Do not fail the whole Monday play because LXC NTP is 80ms off.

## `--check` is not enough

`ansible-playbook playbooks/audit.yml` should **make no required changes**. If you used `file`/`copy` to “fix” during audit, that belongs in `site.yml`. Audit reports; `site.yml` remediates.

## Checklist

- [ ] Audit ≠ apply
- [ ] Cert report is an artifact, not a guess
- [ ] Clock check does not flake on 50ms

Next: [20. Lab: audit, certs, clock](20-lab-audit.md).
