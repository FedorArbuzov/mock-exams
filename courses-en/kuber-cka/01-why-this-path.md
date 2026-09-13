# 01. Why this path

CKA is an **administrator** exam. A large part of the score is cluster architecture and troubleshooting: drain a node, snapshot etcd, fix kubelet, understand why a Service has no endpoints.

[`kuber-basic`](../kuber-basic/README.md) and [`mock-cka`](../mock-cka/README.md) train the API on Docker Desktop. That is necessary and not sufficient.

This course adds the other half:

| Skill | Where you practice it |
|-------|------------------------|
| Install a cluster with Ansible | Bootstrap + Kubespray |
| See Calico / CoreDNS / Ingress as real workloads | Bootstrap 06–09 |
| CKA object work on several nodes | CKA 01–11 |
| Breaks that leave the API and hit Linux | CKA 12–25 |
| Day-2 operations | CKA 26–30 |
| Sequential incidents | ON-CALL 01–20 |

Kubespray is what many teams actually run. You still need to know what it left on disk (`kubelet`, `containerd`, `/etc/kubernetes`, etcd). If you want to type `kubeadm init` yourself first, take [`kuber-bootstrap`](../kuber-bootstrap/README.md), then come back.

The shop app (frontend → backend → redis) exists only to create **dependencies**: Services, Ingress, NetworkPolicy, PVC. It is not a product.

Next: [10. Bootstrap overview](10-bootstrap-overview.md).
