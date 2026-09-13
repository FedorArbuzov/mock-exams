# 10. Bootstrap overview

Until lesson 19 you are **building** the stand. Those labs may tell you which files to create. From CKA 01 the opposite is true: no recipes.

## Target

```text
node-01  control-plane, etcd, Calico, CoreDNS
node-02  worker
node-03  worker
        ↓
   Ingress controller
        ↓
   shop/frontend → shop/backend → shop/redis
```

## Sequence

1. Linux nodes + SSH ([11](11-lab-nodes.md))
2. Kubespray inventory ([12](12-lab-inventory.md))
3. `cluster.yml` ([13](13-lab-deploy.md))
4. Prove control plane, etcd, CNI, CoreDNS ([14](14-lab-control-plane.md)–[17](17-lab-coredns.md))
5. Shop app + Ingress ([18](18-lab-app.md)–[19](19-lab-ingress.md))

## Kubespray in one paragraph

Kubespray is Ansible roles that install containerd, kubelet, a control plane, etcd, a CNI, and CoreDNS. You own the **inventory** and a few `group_vars`. You do not paste a mystery one-liner and walk away — later labs will break kubelet and Calico on purpose.

Pin **Kubespray v2.27.0** and Kubernetes **1.31.x** unless a later lab tells you to upgrade.

Next: [11. Lab: Linux nodes](11-lab-nodes.md).
