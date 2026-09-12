# 05. What kubeadm actually does

`kubeadm init` is not “install Kubernetes with one mystery flag”. It is a **bootstrap** of the control plane on **this** machine.

## Steps (simplified)

1. Preflight: swap, ports `6443`, `10250`, CRI, versions.
2. Generate **CA** and serving certs under `/etc/kubernetes/pki/`.
3. Write **static Pod** manifests: `kube-apiserver`, `etcd`, `kube-scheduler`, `kube-controller-manager` in `/etc/kubernetes/manifests/`. kubelet starts them.
4. Wait until the API answers.
5. Write `admin.conf`, `kubelet.conf`, bootstrap **token**, upload `kubeadm-config` ConfigMap.
6. Print `kubeadm join ...`.

etcd in this course is **stacked** (on the same VM as the API), not an external etcd cluster.

## Flags you will use

```bash
sudo kubeadm init \
  --apiserver-advertise-address=192.168.56.10 \
  --pod-network-cidr=10.244.0.0/16 \
  --kubernetes-version=v1.31.0
```

- **advertise-address** — the IP **workers** will use (the Vagrant host-only NIC, not `10.0.2.15` NAT).
- **pod-network-cidr** — must match Flannel (`10.244.0.0/16`).
- **kubernetes-version** — match the packages you pinned.

Wrong advertise-address is the classic lab: API listens on NAT IP, workers cannot join.

## After init (human)

```bash
mkdir -p $HOME/.kube
sudo cp /etc/kubernetes/admin.conf $HOME/.kube/config
sudo chown "$(id -u):$(id -g)" $HOME/.kube/config
kubectl get nodes   # cp NotReady until CNI
```

`NotReady` without CNI is **normal**. Lesson 07.

## Interview one-liners

- Static Pods: kubelet watches a directory, not a Deployment.
- Only apiserver talks to etcd.
- Join token is **short-lived**; `kubeadm token create --print-join-command` when it expires.

Next: [06. Lab: init by hand](06-lab-init.md).
