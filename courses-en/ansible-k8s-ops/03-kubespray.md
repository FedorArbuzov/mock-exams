# 03. Kubespray: what you own

Kubespray is a set of Ansible roles that install containerd, kubelet, a stacked etcd, the control-plane static Pods, a CNI, and CoreDNS. You own the **inventory** and a few `group_vars`. You do not paste a mystery one-liner and walk away.

## Playbooks you will call

| Playbook | When |
|----------|------|
| `cluster.yml` | first install (lesson 04) |
| `scale.yml` | a node that is **already** in inventory but not in the cluster (lesson 16) |
| `remove-node.yml` | take a node out of the API (lesson 16) |
| `reset.yml` | wipe Kubernetes from a host (lesson 16, `--limit`) |
| `upgrade-cluster.yml` | Kubernetes minor — **out of scope** here |

Pin **Kubespray v2.27.0** and Kubernetes **1.31.x**. Mixing a random `master` clone with 1.32 packages is how people spend a Sunday on Python deps.

## Inventory groups (Kubespray names)

These names are **theirs**, not yours:

```text
kube_control_plane   node-01
etcd                 node-01
kube_node            node-01, node-02, node-03
k8s_cluster          kube_control_plane + kube_node
```

Your `nimbus-ops` groups (`k8s_cp`, `k8s_workers`) are for *your* plays. Keep both inventories. Same IPs. When membership changes, update **both** — or you will `scale.yml` a host your patch playbook does not know.

## What `cluster.yml` leaves on disk

On `node-01` you should later be able to point at:

```text
/etc/kubernetes/admin.conf
/etc/kubernetes/manifests/     kube-apiserver, etcd, scheduler, controller-manager
/etc/kubernetes/pki/
/var/lib/etcd/
```

On every node: `containerd`, `kubelet`, kubelet config, CNI binaries. If you cannot name those paths after lesson 04, you only “ran Ansible,” you did not install a cluster.

One host in `etcd` means one member. Lesson [18b](18b-lab-etcd.md) is that outage. Three stacked control planes is a different stand and more RAM.

## Python venv

Kubespray wants its own `requirements.txt`. Use a venv next to the clone. Do not `pip install --user` over the system Ansible you use for `nimbus-ops`. Two tools, two environments:

```text
system ansible  →  ~/nimbus-ops playbooks
venv ansible    →  ~/kubespray/*.yml
```

## Checklist

- [ ] You can list `cluster.yml` / `scale.yml` / `remove-node.yml` / `reset.yml`
- [ ] You know Kubespray group names differ from `nimbus-ops` group names
- [ ] You will not `pip install` Kubespray onto the system interpreter

Next: [04. Lab: install the cluster](04-lab-cluster.md).
