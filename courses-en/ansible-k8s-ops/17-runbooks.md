# 17. Runbooks, not heroics

ON-CALL in [`kuber-cka`](../kuber-cka/70-oncall.md) trains you to **fix the cluster**. This lesson trains you to leave a **playbook** so the next page is not a unique SSH novel.

## Playbooks

| Playbook | Job |
|----------|-----|
| `playbooks/runbooks/disk-gc.yml` | Make the node bootable / Ready: vacuum journal, prune unused images, **then** check kubelet |
| `playbooks/runbooks/gather.yml` | Do not fix anything. Fetch evidence to `~/nimbus-ops/artifacts/<stamp>/` |
| `playbooks/runbooks/cp-health.yml` | kubelet + static manifests on the CP; put lab-quarantined `etcd.yaml` back; wait `/readyz` |

`gather.yml` runs even when you already know the cause. Postmortems die when the journal rotated while you were in a meeting.

## disk-gc is allowed to be the same script as hygiene

Call `/usr/local/sbin/nimbus-disk-gc` if [lab 10](10-lab-hygiene.md) installed it. Extra steps for the incident:

- `df -h` / `crictl info` registered for the recap
- do **not** drain unless the ticket says so (DiskPressure may already have evicted)
- do **not** `reset.yml` a worker because the disk is 90%

If kubelet is dead after GC, `systemctl restart kubelet` is a last task with a comment — not the first.

## gather

From all of `k8s` (or `--limit`):

- `journalctl -u kubelet -n 200`
- `journalctl -u containerd -n 200`
- `kubectl --request-timeout=5s get nodes -o wide`, `kubectl get pods -A` (once, localhost)

`fetch` into `artifacts/`. Gitignore the directory.

The localhost `kubectl` dump must **not** fail the whole play when the API is dead (`failed_when: false`). That is the [18b](18b-lab-etcd.md) page.

## One etcd

`node-01` is the only member. Moving `etcd.yaml` out of `/etc/kubernetes/manifests` takes the API with it. Recovery is the static Pod, not `scale.yml` and not a snapshot restore (kit stays for when the **datadir** is gone — lesson 13).

## Checklist

- [ ] Incident fix and evidence are different tags
- [ ] Second run of `disk-gc` is safe
- [ ] You will not `rm -rf /var/lib/containerd` in a runbook
- [ ] You will not `cluster.yml` to “fix” a missing static manifest

Next: [18. Lab: DiskPressure](18-lab-incident.md).
