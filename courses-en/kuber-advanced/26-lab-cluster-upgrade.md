# 26. Lab: upgrade minikube between k8s versions

## Task 1. Record the current version

```bash
kubectl version --short 2>/dev/null || kubectl version
kubectl get nodes -o wide
kubectl create ns upgrade-test
kubectl create deploy marker -n upgrade-test --image=nginx:1.27-alpine
```

Write down the `Server Version` (e.g. `v1.28.3`).

## Task 2. Back up etcd (just in case)

```bash
minikube -p mock-exams ssh -- bash -c '
export ETCDCTL_API=3
export ETCDCTL_CACERT=/var/lib/minikube/certs/etcd/ca.crt
export ETCDCTL_CERT=/var/lib/minikube/certs/etcd/server.crt
export ETCDCTL_KEY=/var/lib/minikube/certs/etcd/server.key
export ETCDCTL_ENDPOINTS=https://127.0.0.1:2379
sudo -E etcdctl snapshot save /tmp/pre-upgrade.db
'
```

## Task 3. Upgrade

Find the available versions:

```bash
minikube kubectl -- version --short
# or
minikube start --help | grep kubernetes-version
```

Upgrade (example — one minor up from the current):

```bash
minikube stop -p mock-exams
minikube start -p mock-exams --kubernetes-version=v1.29.0
mockctl kubeconfig
```

> Substitute a version **available** in your minikube (`minikube start --kubernetes-version=stable`).

## Task 4. Verify

```bash
kubectl version
kubectl get nodes
kubectl get deploy -n upgrade-test
kubectl get pods -n upgrade-test
```

**What you'll see:** the node Ready, the marker deployment in place (if you didn't do a delete).

## Task 5. Check the system pods

```bash
kubectl get pods -n kube-system
kubectl get pods -A | grep -v Running | grep -v Completed
```

All `kube-system` pods should be Running/Completed.

## Task 6. Rollback (optional)

```bash
minikube stop -p mock-exams
minikube start -p mock-exams --kubernetes-version=<old-version>
```

## Cleanup

```bash
kubectl delete namespace upgrade-test
```

## Self-check questions

1. How does `minikube stop` + `start --kubernetes-version` differ from `minikube delete`?
2. What do you check right after an upgrade?
3. Why an etcd snapshot before an upgrade?
