# 09. etcd snapshot and restore

On stacked etcd, the datastore is a **static Pod** on `cp`. Loss of that VM without a snapshot is loss of the cluster objects.

[`kuber-advanced` 02–03](../kuber-advanced/02-etcd.md) explains etcd on minikube. Here you snapshot **your** `/var/lib/etcd`.

## Snapshot

On `cp` (etcdctl from the etcd image or the one kubeadm installed):

```bash
sudo kubeadm snapshot  # not a real command — use etcdctl
```

The CKA-shaped flow:

```bash
sudo etcdctl --endpoints=https://127.0.0.1:2379 \
  --cacert=/etc/kubernetes/pki/etcd/ca.crt \
  --cert=/etc/kubernetes/pki/etcd/server.crt \
  --key=/etc/kubernetes/pki/etcd/server.key \
  snapshot save /root/etcd-snapshot.db
```

If `etcdctl` is missing on PATH, `crictl exec` into the etcd container, or install `etcd-client`.

## Restore (destructive)

1. `kubeadm` docs: stop kube-apiserver/etcd (move manifests out of `/etc/kubernetes/manifests` or the node is about to be restored).
2. `etcdctl snapshot restore ... --data-dir=/var/lib/etcd`
3. Fix ownership, put manifests back, wait for API.

Exact flags change slightly by version — follow [kubernetes.io kubeadm HA / backup](https://kubernetes.io/docs/tasks/administer-cluster/configure-upgrade-etcd/) for **your** minor. The skill is: **certs, endpoint, snapshot file, restore dir**.

## Lab (same page)

1. Create a ConfigMap `backup-proof` with `note=before-restore`.
2. Snapshot to `/root/etcd-snapshot.db`.
3. Delete the ConfigMap.
4. Restore from snapshot (or, if restore is too scary the first time: **prove** `snapshot status` and document the restore steps in your notes).
5. After a successful restore, `kubectl get cm backup-proof` exists again.

Full restore on a laptop often means a few minutes of API downtime. That is the point.

If you skip the actual restore, you **cannot** claim it in an interview. Prefer doing it once.

## Checklist

- [ ] Where are etcd certs on a kubeadm cp?
- [ ] Why snapshot **before** upgrade (lesson 11)?
- [ ] Stacked vs external etcd — which did we use?

Next: [10. Drain](10-lab-drain.md).
