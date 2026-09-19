# 12. Lab: preflight and patch workers

## Ticket

P2 — change window

CVE in the Ubuntu security pocket. Patch **workers** this window. Do not reboot `node-01`. Stop the fleet if a worker does not return Ready.

## Task 1. Preflight

`playbooks/preflight.yml` — `hosts: localhost` (or `k8s_cp` with `run_once`) plus a small play on `k8s` for chrony:

- `kubectl get nodes` using `nimbus-ops.conf` — all `Ready`
- no `DiskPressure` on any node
- `chrony` active on all three
- `kubelet` package selection is `hold` on workers (and ideally all)

Fail with a clear `ansible.builtin.fail` message. Tag `preflight`.

Author picture: [`examples/playbooks/preflight.yml`](examples/playbooks/preflight.yml).

```bash
cd ~/nimbus-ops
export KUBECONFIG=$HOME/.kube/nimbus-ops.conf
ansible-playbook playbooks/preflight.yml
```

## Task 2. Patch play

`playbooks/patch-workers.yml`:

- `hosts: k8s_workers`
- `serial: 1`
- `become: true`
- first play or `import_playbook`: preflight
- `block`:
  1. drain (`delegate_to` localhost **or** `node-01`)
  2. `apt: upgrade: safe` (or a short package list) — do **not** `unhold` kube*
  3. `reboot` when `reboot_required` exists (`/var/run/reboot-required`) **or** always reboot in the lab so you practice the wait
  4. `wait_for_connection`
  5. wait until `kubectl get node {{ inventory_hostname }}` is Ready
  6. uncordon
- `rescue`: fail, do not uncordon a dead node and continue

Tag `patch`.

A first drain **by hand** on `node-02` is allowed; Ansible must do `node-03` (and ideally both).

## Task 3. Proof

```bash
ansible-playbook playbooks/patch-workers.yml
kubectl get nodes -o wide
```

Both workers Ready and schedulable. `node-01` was not rebooted by this play (uptime / `last reboot` older than the workers is enough evidence).

## Success criteria

- [ ] preflight fails if you cordon a node first and re-run (optional drill)
- [ ] workers patched with `serial: 1`
- [ ] kubelet still held; three Ready
- [ ] README one-liner: how to open the window

Next: [13. Disaster kit](13-disaster-kit.md).
