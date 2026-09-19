# 10. Lab: role `node-hygiene`

## Ticket

P3 — reliability

Last quarter a worker hit DiskPressure at 03:00. Make journald and unused images boring **before** the next page.

## Task

Role `roles/node-hygiene` on `k8s`:

1. Drop-in `/etc/systemd/journald.conf.d/nimbus.conf`:
   - `SystemMaxUse=256M`
   - `SystemKeepFree=128M`
   - handler restarts `systemd-journald`
2. Script `/usr/local/sbin/nimbus-disk-gc` (mode `0755`) that:
   - `journalctl --vacuum-size=256M` (ok if already small)
   - runs `crictl rmi --prune` only if `crictl` exists
   - does **not** delete `/var/lib/containerd` or etcd
3. systemd oneshot `nimbus-disk-gc.service` + `nimbus-disk-gc.timer` (`OnCalendar=weekly` is fine)
4. Confirm `kubelet` / `kubeadm` / `kubectl` stay on `hold`

Tag `hygiene`. Import the role from `site.yml`.

Author picture: [`examples/roles/node-hygiene`](examples/roles/node-hygiene/tasks/main.yml).

```bash
cd ~/nimbus-ops
ansible-playbook site.yml --tags hygiene
ansible-playbook site.yml --tags hygiene
```

On a node:

```bash
systemctl is-enabled nimbus-disk-gc.timer
systemctl cat systemd-journald
# or: systemd-analyze cat-config systemd-journald
sudo /usr/local/sbin/nimbus-disk-gc
```

## Success criteria

- [ ] journald drop-in present on all three
- [ ] timer enabled; oneshot runs without error
- [ ] second playbook run is clean
- [ ] `kubectl get nodes` still Ready

Next: [11. Change windows](11-change-window.md).
