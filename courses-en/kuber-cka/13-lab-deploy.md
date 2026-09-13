# 13. Lab: deploy Kubernetes

Install the cluster with Kubespray. This takes a while the first time (images, debs).

## Task

From `~/kuber-cka/kubespray` (venv with Kubespray requirements installed):

```text
ansible-playbook -i inventory/lab/hosts.yaml cluster.yml -b
```

When it finishes:

- copy `inventory/lab/artifacts/admin.conf` to `~/.kube/kuber-cka.conf`
- `export KUBECONFIG=$HOME/.kube/kuber-cka.conf`
- `kubectl get nodes` shows three nodes

They may not all be Ready until CNI is up — that is the next labs. The **Check** for this lesson requires the API to answer and at least the control-plane node to exist.

Do not point `KUBECONFIG` at Docker Desktop.

Next: [14. Validate control plane](14-lab-control-plane.md).
