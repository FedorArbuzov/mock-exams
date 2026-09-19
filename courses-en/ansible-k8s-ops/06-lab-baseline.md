# 06. Lab: role `common`

## Ticket

P2 — security

Every box must look like a Nimbus node: chrony, a small package set, sshd without passwords or root login. Do not touch the CRI.

## Task

In `~/nimbus-ops`:

1. Role `roles/common` — `defaults`, `tasks`, `handlers` (reload sshd **once** if `sshd_config` changed).
2. Play `site.yml` (or `playbooks/site.yml` imported from `site.yml`): `hosts: k8s`, `become: true`, role `common`.
3. Tag `baseline`.

Suggested packages: `chrony`, `jq`, `htop`. Enable `chrony`. If `systemd-timesyncd` is active, stop and disable it so two NTP clients do not fight.

sshd: `PasswordAuthentication no`, `PermitRootLogin no`. Use `lineinfile` or a drop-in under `sshd_config.d` — not a full template that wipes the Ubuntu defaults.

Do **not** create extra humans yet. That is [lab 08](08-lab-users.md).

Author picture: [`examples/roles/common`](examples/roles/common/tasks/main.yml).

```bash
cd ~/nimbus-ops
ansible-playbook site.yml --check --diff --tags baseline
ansible-playbook site.yml --tags baseline
ansible-playbook site.yml --tags baseline
```

Second apply: no unexpected `changed` on apt/sshd/chrony. Handler may fire on the first run only.

## Success criteria

- [ ] `chronyc tracking` or `systemctl is-active chrony` is happy on all three
- [ ] `sshd -T` on a node shows `passwordauthentication no` and `permitrootlogin no`
- [ ] `kubectl get nodes` still three Ready — you did not restart kubelet
- [ ] second playbook run is clean

Next: [07. Access lifecycle](07-users.md).
