# 14. Lab: etcd + PKI + inventory

## Ticket

P2 — DR

If `node-01` dies tonight we have a Slack thread and an old screenshot. Make a disaster kit on the control node and a daily snapshot job on the CP.

## Task 1. Backup playbook

`playbooks/backup-cluster.yml`, tag `backup`:

1. On `k8s_cp`: write an etcd snapshot to `/root/etcd-snapshot.db` (or `/var/backups/nimbus/etcd.db`)
2. `fetch` that file to `~/nimbus-ops/backups/<stamp>/etcd.db`
3. `fetch` `/etc/kubernetes/pki/` (directory) to `backups/<stamp>/pki/`
4. Copy `~/kubespray/inventory/lab` into `backups/<stamp>/kubespray-inventory/` (`delegate_to: localhost` + `copy`/`synchronize`)
5. On localhost: run `etcdutl snapshot status` **or** `etcdctl snapshot status` on the fetched file — fail if the command errors

`stamp` = `ansible_date_time.iso8601_basic_short` or `{{ lookup('pipe', 'date +%Y%m%d-%H%M%S') }}` on localhost. Do not commit `backups/` — add it to `.gitignore`.

Author picture: [`examples/playbooks/backup-cluster.yml`](examples/playbooks/backup-cluster.yml).

```bash
cd ~/nimbus-ops
ansible-playbook playbooks/backup-cluster.yml
ls -la backups/
```

## Task 2. Cron or timer on the CP

Idempotent `cron` (or a systemd timer) as root on `node-01`: snapshot to `/var/backups/nimbus/etcd-$(date +\%F).db` once a day. The job may be a small script you `copy`. Keep 3 days if you want; not required.

Re-run the playbook: cron line `changed=0`.

## Task 3. README

Document:

- how to take a kit
- that restore is a **separate** procedure (link CKA 30 or kubeadm docs)
- `.gitignore` for `backups/` and `artifacts/`

## Success criteria

- [ ] `backups/<stamp>/` has `etcd.db`, `pki/`, Kubespray inventory
- [ ] snapshot status succeeds
- [ ] cron/timer present on `node-01`
- [ ] `pki` is **not** in git

Next: [14b. Lab: restore order](14b-lab-restore-talk.md).
