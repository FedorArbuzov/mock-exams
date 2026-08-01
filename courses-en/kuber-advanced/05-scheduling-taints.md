# 05. Taints, tolerations, nodeSelector

## How the scheduler picks a node

1. **Filter** — discards unsuitable nodes (not enough CPU/RAM, taint without toleration, nodeSelector didn't match).
2. **Score** — ranks the remaining ones (spread, affinity, …).
3. Writes `spec.nodeName`.

## nodeSelector — the simplest filter

```yaml
spec:
  nodeSelector:
    disktype: ssd
```

The pod will only land on a node with the label `disktype=ssd`. If there are none — `Pending` forever.

```bash
kubectl label nodes minikube disktype=ssd
kubectl label nodes minikube disktype-        # remove the label
```

## Taints and Tolerations

A **taint** on a node = "no entry here, except…". A **toleration** on a pod = "I can tolerate this taint".

```bash
kubectl taint nodes minikube dedicated=special:NoSchedule
```

Format: `key=value:Effect`

| Effect | Behavior |
|---|---|
| `NoSchedule` | New pods aren't placed (existing ones stay) |
| `PreferNoSchedule` | Tries not to place, but may |
| `NoExecute` | Doesn't place + **evicts** already-running pods without a toleration |

Toleration on a pod:

```yaml
spec:
  tolerations:
    - key: dedicated
      operator: Equal
      value: special
      effect: NoSchedule
```

`operator: Exists` — tolerates any value of this key.

### Remove a taint

```bash
kubectl taint nodes minikube dedicated=special:NoSchedule-
#                                                                    ^ minus at the end
```

## Built-in taints

| Taint | When |
|---|---|
| `node.kubernetes.io/not-ready:NoSchedule` | Node is NotReady |
| `node.kubernetes.io/unreachable:NoSchedule` | Node is unreachable |
| `node.kubernetes.io/disk-pressure:NoSchedule` | Low disk space |
| `node.kubernetes.io/memory-pressure:NoSchedule` | Low memory |
| `node.kubernetes.io/pid-pressure:NoSchedule` | Low PIDs |
| `node.kubernetes.io/unschedulable` | After `kubectl cordon` |

## Cordon and Drain

```bash
kubectl cordon minikube          # NoSchedule taint, pods stay
kubectl uncordon minikube
kubectl drain minikube --ignore-daemonsets --delete-emptydir-data
```

`drain` = cordon + eviction of all pods (respecting PDB).

## nodeName — bypassing the scheduler

```yaml
spec:
  nodeName: minikube
```

The scheduler is **skipped**. Use only for debugging.

## CKA checklist

- How does a taint differ from a label?
- How do you remove a taint?
- What does `NoExecute` do vs `NoSchedule`?
- How do you forbid new pods on a node without touching the current ones?
- The drain command that ignores DaemonSets?

Lab: [07-lab-scheduling.md](07-lab-scheduling.md) together with affinity.
