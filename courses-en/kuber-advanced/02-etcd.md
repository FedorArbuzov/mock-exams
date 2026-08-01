# 02. etcd: snapshot, backup, restore

## Why back up etcd

etcd holds the **entire state** of the cluster: all Deployments, Secrets, ConfigMaps, RBAC. Losing etcd data without a backup = losing the cluster.

An etcd backup is needed:

- before a cluster upgrade;
- before risky changes;
- on a schedule (like managed Kubernetes in the cloud).

## Where etcd lives in minikube

```bash
minikube -p mock-exams ssh
sudo ls /var/lib/minikube/etcd/
```

In production, etcd runs on separate nodes (3 or 5 for quorum). In minikube it's a single instance inside the node.

## Snapshot via `etcdctl`

`etcdctl` is the CLI for etcd. On minikube it's already available inside the node.

### Environment variables

```bash
minikube -p mock-exams ssh

export ETCDCTL_API=3
export ETCDCTL_CACERT=/var/lib/minikube/certs/etcd/ca.crt
export ETCDCTL_CERT=/var/lib/minikube/certs/etcd/server.crt
export ETCDCTL_KEY=/var/lib/minikube/certs/etcd/server.key
export ETCDCTL_ENDPOINTS=https://127.0.0.1:2379
```

### Create a snapshot

```bash
sudo etcdctl snapshot save /tmp/etcd-backup.db
sudo etcdctl snapshot status /tmp/etcd-backup.db -w table
```

`status` output:

```text
+----------+----------+------------+------------+
|   HASH   | REVISION | TOTAL KEYS | TOTAL SIZE |
+----------+----------+------------+------------+
| 1a2b3c4d |    12345 |        512 |     2.1 MB |
+----------+----------+------------+------------+
```

### Check etcd health

```bash
sudo etcdctl endpoint health
sudo etcdctl member list
```

## Restore (concept)

A restore is **not** "applied on top of" a live etcd. The CKA procedure:

1. Stop the apiserver and etcd (static pods).
2. Clear the etcd data-dir.
3. `etcdctl snapshot restore` into a new data-dir.
4. Update the etcd config (if paths/ports changed).
5. Start etcd and the apiserver.

On minikube it's simpler: `minikube stop` → restore → `minikube start`. Step by step in the [03-lab-etcd.md](03-lab-etcd.md) lab.

## Backup via cron on the control plane node

In production, often:

```bash
ETCDCTL_API=3 etcdctl snapshot save /backup/etcd-$(date +%Y%m%d-%H%M).db
```

+ copy to S3/NFS. Retention: keep the last N.

## What is **not** included in an etcd snapshot

- The contents of **PersistentVolumes** (application data on disks).
- Pod logs.
- Images in the container registry.

An etcd snapshot = only Kubernetes **metadata**. For application data — Velero ([23-velero.md](23-velero.md)).

## Useful commands

```bash
# From the host — copy the snapshot out:
minikube -p mock-exams cp minikube:/tmp/etcd-backup.db ./etcd-backup.db

# List keys (careful, lots of output):
sudo etcdctl get / --prefix --keys-only | head
```

## CKA checklist

- Which command creates a snapshot?
- Can you restore "on top of" a running etcd?
- What is stored in a snapshot, and what isn't?
- Why `ETCDCTL_API=3`?
- Where are the etcd TLS certificates in minikube?

Lab: [03-lab-etcd.md](03-lab-etcd.md).
