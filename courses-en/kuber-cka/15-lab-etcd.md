# 15. Lab: validate etcd

Single-node etcd (this stand). You will snapshot and restore it later. Today you only prove it is healthy.

## Task

Confirm:

- an `etcd-*` Pod is Running in `kube-system`
- you can talk to etcd (Kubespray usually leaves `etcdctl` usage documented on the control plane — certificates under `/etc/ssl/etcd` or `/etc/kubernetes/ssl`)
- endpoint health is good

**Check** looks for a Running etcd Pod. Training mode will not print the `etcdctl` command until after you pass.

Next: [16. Validate CNI](16-lab-cni.md).
