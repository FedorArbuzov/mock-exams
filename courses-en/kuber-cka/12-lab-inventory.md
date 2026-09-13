# 12. Lab: Kubespray inventory

Clone Kubespray and write an inventory for **this** lab — not the sample `inventory/sample` as-is.

## Task

1. Clone **v2.27.0** into `~/kuber-cka/kubespray`.
2. Copy the sample inventory to `~/kuber-cka/kubespray/inventory/lab`.
3. Declare hosts `node-01` / `node-02` / `node-03` with IPs `192.168.56.10–12`.
4. Groups:

```text
kube_control_plane   node-01
etcd                 node-01
kube_node            node-01, node-02, node-03
k8s_cluster          kube_control_plane + kube_node
```

5. In `group_vars` (names depend on the Kubespray version you cloned):

- `kube_version: v1.31.4` (or another 1.31.x the release supports)
- `container_manager: containerd`
- `kube_network_plugin: calico`

6. From the kubespray directory, `ansible -i inventory/lab/hosts.yaml all -m ping` returns `pong` for all three.

A sketched inventory lives in [`examples/inventory/hosts.yaml`](examples/inventory/hosts.yaml). Adjust to the file layout of v2.27.0.

**Check** looks for `~/kuber-cka/kubespray/inventory/lab` (or `$KUBER_CKA_DIR`) and SSH reachability.

Next: [13. Deploy Kubernetes](13-lab-deploy.md).
