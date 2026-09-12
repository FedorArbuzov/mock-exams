# 13. What we skipped

You have a **one control-plane** lab cluster. Production self-hosted is usually more.

## HA control plane

Three (or five) cp nodes, **stacked etcd** quorum, **load balancer** in front of `:6443` (`kube-vip`, HAProxy, cloud NLB). `kubeadm init` then `kubeadm join --control-plane`. Certificates and the `--upload-certs` dance. RAM for that on a laptop is ugly; skip unless you have 16 GB and a weekend.

## MetalLB / kube-vip

`Service type: LoadBalancer` has no cloud controller here. On-prem: MetalLB or kube-vip. Theory: [`bare-metal` 09](../bare-metal/09-kubernetes-on-bare-metal.md).

## External etcd

Separate machines for etcd. More failure domains, more ops. CKA still expects stacked backup first.

## kubespray / RKE2 / Talos

**kubespray** is Ansible that already contains the roles you just wrote. Use it at work after you can explain init/join. Running only kubespray **instead** of this course is how people fail “what did kubeadm do?”.

RKE2 / k3s — distros with an opinionated installer. Talos — no SSH, API-only OS.

## EKS

You do not run `kubeadm` there. You still drain node groups, pick versions, install CNI/LB add-ons. Different course: [`aws-advanced`](../aws-advanced/README.md).

## Checklist

- [ ] You will not say “I did HA kubeadm” after this lab
- [ ] You can name kubespray without claiming this repo is kubespray

Next: [14. k3s](14-k3s.md).
