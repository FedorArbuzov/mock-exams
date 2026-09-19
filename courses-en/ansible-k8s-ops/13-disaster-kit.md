# 13. Disaster kit

An etcd snapshot without `/etc/kubernetes/pki` is a file you cannot use. Kubespray inventory that only lives on the laptop that died is the same class of mistake.

This course does **not** walk a full restore. You build a **kit** you could hand to someone: snapshot + PKI + the inventory that describes the cluster.

## What to copy

| Piece | Where it lives | Where it goes |
|-------|----------------|---------------|
| etcd snapshot | created on `node-01` | `~/nimbus-ops/backups/<stamp>/etcd.db` on the **host** |
| PKI | `/etc/kubernetes/pki/` on `node-01` | `backups/<stamp>/pki/` |
| Kubespray inventory | `~/kubespray/inventory/lab` | `backups/<stamp>/kubespray-inventory/` |
| nimbus-ops inventory | `inventory/` | same stamp dir (optional but cheap) |

`fetch` / `synchronize` from the control node. Do not leave the only snapshot on the CP disk — that disk is what you are afraid of.

## How to snapshot

On `node-01`, Kubespray left etcd as a static Pod and certs under `/etc/kubernetes/pki/etcd/`. Pattern:

```text
etcdctl snapshot save /root/etcd-snapshot.db
```

with `ETCDCTL_API=3` and the **etcd** certs (not the apiserver client cert by guesswork). After Kubespray you usually have `etcdctl` on the CP; if the binary is only in the Pod, `crictl exec` or `kubectl -n kube-system exec` on the etcd Pod.

## Prove it, do not restore it

```text
etcdutl snapshot status /path/to/etcd.db
```

(`etcdctl snapshot status` on older etcd). A hash and a revision mean the file is an etcd snapshot, not a zero-byte leftover. Put the command in the playbook (`register` + print, or a local task after `fetch`).

## Cron on the CP, fetch on the host

A daily **local** snapshot on `node-01` (`ansible.builtin.cron` or a timer) is useful if the laptop is off. It is not the kit until something **copies it off the node**. Split:

1. `playbooks/backup-cluster.yml` — snapshot now, fetch kit to `~/nimbus-ops/backups/<stamp>/`
2. cron/timer on CP — snapshot to `/var/backups/nimbus/etcd.db` (rotate 3 copies)
3. Monday [audit](19-monday.md) — cron exists; a kit dir on the host is newer than 7 days after you have been running a week (for the lab: exists and `etcdutl` is happy)

Add “kit not older than 24h” to preflight when you are ready. Lab 14 can import that as a **warning** (`failed_when: false` + debug) so the first patch window still works.

## Checklist

- [ ] Snapshot + PKI + inventory is the kit
- [ ] Kit lives on the host, not only on `node-01`
- [ ] You can explain why this course does not `etcdctl snapshot restore` in the happy path (missing **manifest** is [18b](18b-lab-etcd.md); missing **datadir** is a restore you do not run here)

Next: [14. Lab: etcd + PKI + inventory](14-lab-backup.md).
