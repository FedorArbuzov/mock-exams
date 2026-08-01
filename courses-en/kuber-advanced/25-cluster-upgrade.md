# 25. Cluster upgrade

## Upgrade order (production)

```text
1. Back up etcd
2. Upgrade the control plane (apiserver, scheduler, controller-manager, etcd)
3. Upgrade the kubelet on each node (one at a time: drain → upgrade → uncordon)
4. Upgrade kube-proxy (if separate)
5. Check workloads
```

**Never** skip more than **two minor** versions (1.27 → 1.29 OK, 1.27 → 1.30 — go to 1.29 first).

## kubeadm upgrade (typical CKA)

On the control plane node:

```bash
# 1. Plan
sudo kubeadm upgrade plan

# 2. Apply (for example, to 1.29.4):
sudo kubeadm upgrade apply v1.29.4

# 3. Drain + upgrade the kubelet on each worker:
kubectl drain <node> --ignore-daemonsets
sudo apt install kubelet=1.29.4-00 kubeadm=1.29.4-00
sudo kubeadm upgrade node
sudo systemctl restart kubelet
kubectl uncordon <node>
```

## minikube upgrade

The simplest way — change the Kubernetes version on start:

```bash
minikube stop -p mock-exams
minikube start -p mock-exams --kubernetes-version=v1.29.0
```

Or:

```bash
minikube update-check
minikube start -p mock-exams --kubernetes-version=latest
```

**Important:** `minikube delete` + `minikube start` with a new version = a **new** cluster (etcd data is lost unless backed up). For an upgrade **that preserves data** — `minikube stop` + `start --kubernetes-version=...` without delete.

## Checking versions after the upgrade

```bash
kubectl version
kubectl get nodes -o wide
minikube -p mock-exams ssh -- kubelet --version
minikube -p mock-exams ssh -- kubectl version --client
```

## API compatibility

- `apiVersion` in manifests: old versions (e.g. `extensions/v1beta1` Ingress) may be **removed**. Check:

```bash
kubectl api-resources
pluto detect-api-versions-in-use  # if pluto is installed
```

## What can break

| Problem | Solution |
|---|---|
| Admission API version changed | Update the webhook configs |
| Deprecated API removed | `kubectl convert` / pluto |
| CNI incompatible | Update the CNI to a version for the new k8s |
| containerd version | Update it together with the kubelet |

## CKA checklist

- In what order do you upgrade the control plane and workers?
- How many minor versions can you skip?
- What do you do before an upgrade?
- How do you upgrade minikube without losing data?
- The command to check the upgrade plan in kubeadm?

Lab: [26-lab-cluster-upgrade.md](26-lab-cluster-upgrade.md).
