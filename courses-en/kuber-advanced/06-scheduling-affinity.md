# 06. Affinity, anti-affinity, topology spread

## nodeSelector vs affinity

`nodeSelector` — a simple label match on a node. **Affinity** — more flexible: soft/hard rules, combinations, anti-affinity between pods.

## nodeAffinity

### required (hard)

```yaml
spec:
  affinity:
    nodeAffinity:
      requiredDuringSchedulingIgnoredDuringExecution:
        nodeSelectorTerms:
          - matchExpressions:
              - key: topology.kubernetes.io/zone
                operator: In
                values: [zone-a, zone-b]
```

The pod **won't start** if there's no node in zone-a or zone-b. `IgnoredDuringExecution` — if a node's label changes after the pod starts, the pod is **not evicted**.

### preferred (soft)

```yaml
preferredDuringSchedulingIgnoredDuringExecution:
  - weight: 80
    preference:
      matchExpressions:
        - key: disktype
          operator: In
          values: [ssd]
  - weight: 20
    preference:
      matchExpressions:
        - key: disktype
          operator: In
          values: [hdd]
```

The scheduler **prefers** SSD, but will also run on HDD if there's no SSD.

## podAffinity / podAntiAffinity

Rules relative to **other pods** (by labels).

### podAntiAffinity — "not next to"

```yaml
spec:
  affinity:
    podAntiAffinity:
      requiredDuringSchedulingIgnoredDuringExecution:
        - labelSelector:
            matchLabels:
              app: web
          topologyKey: kubernetes.io/hostname
```

"Don't place on the same node (`hostname`) where a pod with `app=web` already exists." A classic for HA: replicas on different nodes.

### podAffinity — "next to"

```yaml
podAffinity:
  requiredDuringSchedulingIgnoredDuringExecution:
    - labelSelector:
        matchLabels:
          app: cache
      topologyKey: kubernetes.io/hostname
```

"Only place on a node that already has cache" — locality.

## topologySpreadConstraints (the modern replacement)

```yaml
spec:
  topologySpreadConstraints:
    - maxSkew: 1
      topologyKey: topology.kubernetes.io/zone
      whenUnsatisfiable: DoNotSchedule
      labelSelector:
        matchLabels:
          app: web
```

`maxSkew: 1` — the difference in the number of pods between zones is at most 1. `DoNotSchedule` — hard; `ScheduleAnyway` — soft.

minikube has a single node — we **simulate** zones via labels:

```bash
kubectl label node minikube topology.kubernetes.io/zone=zone-a
```

For multi-node minikube:

```bash
minikube node add -p mock-exams
kubectl label node mock-exams-m02 topology.kubernetes.io/zone=zone-b
```

## Comparison table

| Mechanism | Hard/Soft | Comparison target |
|---|---|---|
| nodeSelector | Hard | node labels |
| nodeAffinity required | Hard | node labels |
| nodeAffinity preferred | Soft | node labels |
| podAntiAffinity | Hard/Soft | pod labels |
| topologySpreadConstraints | Hard/Soft | distribution by topologyKey |

## CKA checklist

- How does `requiredDuringScheduling` differ from `preferred`?
- What does `topologyKey: kubernetes.io/hostname` do in podAntiAffinity?
- Why `IgnoredDuringExecution` in the name?
- How do you spread 3 web replicas across different nodes?
- What is `maxSkew` in topologySpreadConstraints?

Lab: [07-lab-scheduling.md](07-lab-scheduling.md).
