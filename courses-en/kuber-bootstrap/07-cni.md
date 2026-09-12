# 07. CNI

Without a **Container Network Interface** plugin, the node stays `NotReady` and CoreDNS stays `Pending`. kubeadm does **not** install a CNI for you on purpose: overlay vs BGP vs cloud is your choice.

## What CNI does

```text
Pod IP from the Pod CIDR
  → veth / routing / VXLAN on the node
  → packets to Pods on other nodes
```

kube-proxy still does Service ClusterIP. CNI is **Pod-to-Pod**.

## This course: Flannel

One manifest, CIDR **`10.244.0.0/16`** — the same string you passed to `kubeadm init`.

```bash
kubectl apply -f https://github.com/flannel-io/flannel/releases/latest/download/kube-flannel.yml
```

Wait until `kube-flannel-ds` is Ready in `kube-flannel` (or `kube-system`, depending on the manifest version).

Calico is the usual “next” (NetworkPolicy). Optional later: same cluster, delete Flannel, install Calico with a matching CIDR. Do not run two CNIs.

## Interview

- `NotReady` + `NetworkPluginNotReady` → CNI missing or CrashLoop.
- Pod CIDR ≠ CNI config → no Pod IPs, mysterious timeouts.

Next: [08. Lab: join](08-lab-join.md).
