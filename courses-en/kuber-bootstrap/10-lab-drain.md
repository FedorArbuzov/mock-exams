# 10. Lab: drain, uncordon, extra capacity

## Task 1. Workload

```bash
kubectl create deployment drain-demo --image=nginx:1.27 --replicas=4
kubectl get pods -o wide
```

Pods should land on `w1`/`w2` (and maybe `cp` if you did not taint it). kubeadm **taints** the control-plane node `node-role.kubernetes.io/control-plane:NoSchedule` by default — good. Leave that taint.

## Task 2. Drain w1

```bash
kubectl drain w1 --ignore-daemonsets --delete-emptydir-data
kubectl get nodes
kubectl get pods -o wide
```

`w1` is `SchedulingDisabled`. nginx replicas on `w2`. DaemonSets (Flannel, kube-proxy) stay — that is `--ignore-daemonsets`.

## Task 3. Uncordon

```bash
kubectl uncordon w1
```

New pods may land on `w1` again.

## Task 4. (Optional) fourth node

If RAM allows: clone the worker in Vagrant (`w3`, `.13`), run `k8s_common` + join. If not: skip and say so in notes. Interviewers care that you **know** join is the same command.

## Success criteria

- [ ] Drain moved stateless replicas off `w1`
- [ ] You can explain why Flannel pods did not evict like nginx
- [ ] Uncordon returned `w1` to schedulable

Next: [11. Upgrade](11-lab-upgrade.md).
