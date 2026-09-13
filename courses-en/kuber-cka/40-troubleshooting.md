# 40. Troubleshooting

Start applies a **real** broken state on this cluster. You do not get the root cause.

Typical loop:

```text
kubectl get / describe / logs / events
    → node conditions
    → kubelet / containerd
    → CNI / routes / iptables
    → etcd
```

Fix the cluster. Do not delete the workload and recreate a healthy one from scratch unless that is a valid repair (it usually is not — Start seeded specific objects).

After you pass, training mode may name the root cause. CKA mode will not.

Cleanup must run before the next lab. These breaks touch kubelet, disks, and CoreDNS.

Next: [CKA 12 — Pod Pending](41-lab-cka-12-pending.md).
