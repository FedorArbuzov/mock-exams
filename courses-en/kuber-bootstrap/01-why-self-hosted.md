# 01. Why self-hosted

Interviews that ask “did you administer Kubernetes?” usually mean: **did you own a control plane**, not “did you `kubectl apply` a Deployment”.

## Three different yeses

| What you ran | What you can claim |
|--------------|-------------------|
| Docker Desktop / minikube / kind | User of a cluster someone (or a laptop product) already started |
| **kubeadm on VMs** (this course) | Installed apiserver, etcd, kubelet; joined nodes; backup; upgrade |
| EKS / GKE / AKS | Administered **workers and add-ons**; AWS owns etcd |

[`kuber-basic`](../kuber-basic/README.md) is the first row. [`aws-advanced`](../aws-advanced/README.md) 13–18 is the third. This course is the **middle** row — the one CKA still weights and on-prem platforms still hire for.

## What you will install

```text
kube-apiserver, etcd, scheduler, controller-manager   ← static Pods on cp
kubelet + containerd                                  ← every node
kube-proxy + CNI (Flannel)                            ← overlay
```

`kubeadm` writes manifests and certificates. **You** still choose CIDR, CNI, versions, and when to drain.

## Ansible’s job

[`ansible-basic`](../ansible-basic/README.md) already taught inventory and roles. Here Ansible:

- disables swap, loads kernel modules, installs containerd and the kube* packages;
- later: join and rolling upgrade (`serial: 1`).

Ansible does **not** invent the control plane. First `kubeadm init` is **by hand** (lesson 06) so you can explain the output on a call.

## When not to self-host

- One team, no on-prem mandate → EKS is usually cheaper in people-time.
- You only needed a laptop API → stay on Docker Desktop.
- You run a playbook you cannot explain (kubespray without kubeadm) → interview dies at “what does init do?”

## Checklist

- [ ] You can separate “used kubectl” from “installed the API”
- [ ] You know this course needs **VMs**, not `docker-desktop`
- [ ] [ENVIRONMENT.md](ENVIRONMENT.md) RAM and Windows/WSL notes are read

Next: [02. Lab: three VMs](02-lab-vms.md).
