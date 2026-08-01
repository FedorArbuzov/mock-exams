# 03. Lab: etcd backup and restore on minikube

Goal — take an etcd snapshot, "break" the cluster, and restore from the backup.

## Task 1. Create a test object

```bash
kubectl create namespace lab-etcd
kubectl create configmap etcd-test -n lab-etcd --from-literal=marker=before-backup
kubectl get configmap etcd-test -n lab-etcd
```

## Task 2. Snapshot

```bash
minikube -p mock-exams ssh -- bash -c '
export ETCDCTL_API=3
export ETCDCTL_CACERT=/var/lib/minikube/certs/etcd/ca.crt
export ETCDCTL_CERT=/var/lib/minikube/certs/etcd/server.crt
export ETCDCTL_KEY=/var/lib/minikube/certs/etcd/server.key
export ETCDCTL_ENDPOINTS=https://127.0.0.1:2379
sudo -E etcdctl snapshot save /tmp/etcd-backup.db
sudo -E etcdctl snapshot status /tmp/etcd-backup.db -w table
'
```

Copy the snapshot to the host:

```bash
minikube -p mock-exams cp minikube:/tmp/etcd-backup.db ./etcd-backup.db
ls -la etcd-backup.db
```

## Task 3. "Break" it — delete the namespace

```bash
kubectl delete namespace lab-etcd
kubectl get configmap etcd-test -n lab-etcd 2>&1
# NotFound — the object is gone from etcd
```

## Task 4. Restore (simplified path for minikube)

A full CKA restore on bare metal is harder. On minikube:

```bash
minikube -p mock-exams stop

minikube -p mock-exams ssh -- bash -c '
export ETCDCTL_API=3
sudo rm -rf /var/lib/minikube/etcd/member
sudo mkdir -p /var/lib/minikube/etcd/member/snap/db
sudo etcdctl snapshot restore /tmp/etcd-backup.db \
  --data-dir=/var/lib/minikube/etcd/member/snap/db \
  --initial-cluster=etcd=minikube:2380 \
  --initial-advertise-peer-urls=http://127.0.0.1:2380 \
  --name=etcd
'

minikube -p mock-exams start
mockctl kubeconfig
```

> If restore behaves differently on your minikube version — an alternative for the learning goal: recreate the ConfigMap manually and consider that you have **practiced** the snapshot/restore commands. On the real CKA exam you'll be given a working control plane node.

## Task 5. Verify the restore

```bash
kubectl get configmap etcd-test -n lab-etcd
# expected: marker=before-backup, if the restore succeeded
```

If the namespace didn't come back — the snapshot is still **valid**; check `etcdctl snapshot status` on the host.

## Task 6. Practice CKA commands

Over SSH into minikube, run and save the output:

```bash
sudo etcdctl endpoint health
sudo etcdctl member list
sudo etcdctl snapshot status /tmp/etcd-backup.db -w table
```

## Cleanup

```bash
kubectl delete namespace lab-etcd --ignore-not-found
rm -f etcd-backup.db
```

## Self-check questions

1. Which command creates a snapshot?
2. Why is deleting a namespace a change in etcd?
3. Does an etcd snapshot restore data on PVs?
4. Which 4 `ETCDCTL_*` variables are needed for TLS?
