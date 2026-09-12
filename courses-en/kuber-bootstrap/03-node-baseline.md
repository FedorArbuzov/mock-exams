# 03. Node baseline

kubeadm will refuse a node that still has **swap**, or a kernel that cannot bridge packets for Pods. This is sysadmin work. Ansible makes it idempotent; the checklists are still yours in an interview.

## Swap

kubelet wants swap **off** (unless you explicitly enable swap in later Kubernetes — not this course).

```bash
sudo swapoff -a
# comment the swap line in /etc/fstab so it stays off after reboot
```

## Kernel

```text
overlay
br_netfilter
```

sysctl (persist):

```text
net.bridge.bridge-nf-call-iptables  = 1
net.bridge.bridge-nf-call-ip6tables = 1
net.ipv4.ip_forward                 = 1
```

Without `ip_forward` and bridge-nf, CNI looks installed and Pods still cannot talk.

## containerd, not Docker Engine

Modern kubelet talks **CRI** to **containerd**. Installing `docker.io` on the node is optional and often confusing. This course: **containerd only**, systemd cgroup driver (must match kubelet).

## Version pin

`kubeadm`, `kubelet`, `kubectl` on a node must be the **same minor**. Mix 1.31 kubeadm with 1.32 kubelet and init becomes a support nightmare.

Labs 04–10 pin **1.31**. Lesson 11 moves to **1.32**. Apt `hold` after install so `unattended-upgrades` cannot skip a minor for you.

## What the role will do (lab 04)

Role `k8s_common` on **all** hosts:

1. swap off + fstab
2. modules + sysctl
3. containerd
4. pkgs.k8s.io repo + kubeadm/kubelet/kubectl
5. `kubelet` enabled (it will crash-loop until init/join — expected)

## Checklist

- [ ] Why swap off?
- [ ] Why `ip_forward`?
- [ ] Why pin three packages together?
- [ ] Ansible vs a bash for-loop — you already answered this in ansible-basic

Next: [04. Lab: packages](04-lab-packages.md).
