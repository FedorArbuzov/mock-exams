# 11. Change windows

Kubespray `upgrade-cluster.yml` moves a **Kubernetes minor**. This playbook is the other Saturday: **OS packages and a reboot**, workers only, one at a time.

## Order (memorize)

```text
preflight          ← all Ready, no DiskPressure, clocks sane
drain worker
apt (security)     ← kube* stay on hold
reboot if needed
wait SSH + kubelet Ready
uncordon
next worker
```

`serial: 1` on `k8s_workers`. Control plane is **out of this play**. A CP reboot is a different ticket and a fresh etcd snapshot.

## Preflight is a playbook, not a hope

`playbooks/preflight.yml` (or `import_tasks`) runs **before** the first drain:

| Check | How |
|-------|-----|
| three nodes Ready, none `SchedulingDisabled` you did not expect | `kubectl` on the control node (`delegate_to: localhost` or `node-01`) |
| no `DiskPressure` / `MemoryPressure` | `kubectl describe node` or `jsonpath` on conditions |
| chrony / time offset | `chronyc tracking` on each host — fail if you cannot parse a sane offset |
| kube packages still held | `dpkg --get-selections` |

If preflight fails, **do not drain**. Fix the cluster, then open the window again.

You will add “fresh disaster kit” to this list in [lesson 13](13-disaster-kit.md). For lab 12, nodes + clock + holds are enough.

## Drain

```text
kubectl drain {{ inventory_hostname }} --ignore-daemonsets --delete-emptydir-data --timeout=180s
```

DaemonSets (Calico, kube-proxy) stay — that is `--ignore-daemonsets`. With **two** workers, replicas must fit on the other worker. If you run a 3-replica Deployment pinned to one node, drain will hang; preflight will not save you from a bad PDB — still, do not `--force` as a habit.

`delegate_to: localhost` with `KUBECONFIG=~/.kube/nimbus-ops.conf`, **or** run kubectl on `node-01`. Pick one and stick to it.

## Rescue

`block/rescue` on the worker play: if uncordon never happens because kubelet is dead, **fail the play**. Do not start the next host. That is the point of `serial: 1`.

## Checklist

- [ ] OS patch ≠ Kubernetes upgrade
- [ ] CP is not in this serial loop
- [ ] rescue stops the fleet

Next: [12. Lab: preflight and patch workers](12-lab-patch.md).
