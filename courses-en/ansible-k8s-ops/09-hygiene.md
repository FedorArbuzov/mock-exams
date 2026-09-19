# 09. Disk and journal before the ticket

DiskPressure is a kubelet eviction signal. On a lab LXC it usually means **journal** and **unused images**, not “the PVC filled the node.” The incident playbook in [lesson 18](18-lab-incident.md) is the emergency. This role is the **prevention** you wish you had shipped first.

## What fills a node

| Source | Typical path | What to do |
|--------|----------------|------------|
| systemd journal | `/var/log/journal` | `journald` drop-in: `SystemMaxUse`, `SystemKeepFree` |
| containerd images | `/var/lib/containerd` | timer: unused image prune — **not** `rm -rf` |
| kubelet eviction leftovers | `/var/log/pods`, `/var/log/containers` | logrotate if files exist; journal already covers kubelet on Ubuntu |
| your own `dd` in a panic | `/var/tmp` | do not do that in prod; lab 18 will |

Kubespray does not ship a company prune timer. You do.

## journald

A drop-in, not a full rewrite of `/etc/systemd/journald.conf`:

```text
/etc/systemd/journald.conf.d/nimbus.conf
```

Restart `systemd-journald` from a handler when the drop-in changes. Vacuum in the **runbook**, not on every `site.yml` — a weekly timer or the incident play is enough.

## containerd prune

`crictl rmi --prune` (or `crictl rmi --prune=all` only if you know what you are deleting) belongs in a **oneshot** systemd unit + timer (`OnCalendar=weekly` is enough for the lab). The unit must be a no-op when `crictl` is missing so you can apply hygiene before you forget.

Never prune **in** `common` as a regular task with `changed_when: true` — every Monday CI would “change” the cluster.

## Hold kube packages

Kubespray already `hold`s `kubeadm` / `kubelet` / `kubectl`. Your hygiene role may **assert** the hold (`dpkg_selections`) so an `unattended-upgrades` surprise does not skip a minor. Do not `unhold` here.

## Checklist

- [ ] Prevention (timer + journald) vs emergency (`disk-gc`) are different playbooks
- [ ] You will not `rm -rf /var/lib/containerd`
- [ ] Prune is a timer, not a task that always reports changed

Next: [10. Lab: role `node-hygiene`](10-lab-hygiene.md).
