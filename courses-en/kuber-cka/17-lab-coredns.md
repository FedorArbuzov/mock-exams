# 17. Lab: validate CoreDNS

Cluster DNS must resolve Service names.

## Task

Confirm:

- CoreDNS Pods in `kube-system` are Ready
- Service `kube-dns` (or `coredns`) exists in `kube-system`
- a probe Pod can resolve `kubernetes.default.svc.cluster.local`

**Check** runs those assertions (including a DNS probe).

Next: [18. Deploy the shop app](18-lab-app.md).
