# 14. Lab: validate control plane

Prove the control plane is a real set of static Pods, not “kubectl works sometimes”.

## Task

Show that all of the following are true:

- Kubernetes API is reachable with `~/.kube/kuber-cka.conf`
- `kube-apiserver`, `kube-controller-manager`, `kube-scheduler` are Running on `node-01`
- kubelet and containerd are active on `node-01`
- `kubectl get --raw='/readyz?verbose'` does not report a failed check you cannot explain

**Check** asserts API + those three kube-system Pods.

Next: [15. Validate etcd](15-lab-etcd.md).
