# 19. PodDisruptionBudget, rollouts, and drain

## Why

When a cluster "moves" — a node upgrade, a drain for maintenance, a scale-down of a deploy — pods can be evicted. If too many are evicted at once, the service becomes unavailable.

**PodDisruptionBudget (PDB)** is an object that says: "for this application **at least N replicas** must remain available during voluntary disruptions".

"Voluntary" disruptions are:

- `kubectl drain node`;
- automatic eviction during a node upgrade;
- a controller scale-down;
- manual deletion of a pod via kubectl.

"Involuntary" ones — hardware failure, OOM, kernel panic — are not protected by PDB (they simply cannot be prevented).

## Minimal PDB

```yaml
apiVersion: policy/v1
kind: PodDisruptionBudget
metadata:
  name: web-pdb
spec:
  selector:
    matchLabels:
      app: web
  minAvailable: 2
```

What it says: "among the pods with label `app=web`, at least **2** must always be available". If the application is scaled to 4, draining a node will allow removing up to 2 at once. If the application is scaled to 2, drain won't be able to remove anything until more replicas appear.

Alternative:

```yaml
spec:
  maxUnavailable: 1     # no more than 1 may be removed at a time
```

`maxUnavailable: 1` for a single namespace + `replicas: 3` → drain removes one, recreates it, then the next.

## `kubectl drain` behavior

```bash
kubectl drain minikube --ignore-daemonsets --delete-emptydir-data
```

`drain` =:

1. Marks the node as unschedulable (cordon).
2. Evicts all pods (via the eviction API, which **respects** PDB).
3. If the PDB doesn't allow it — drain "hangs", waiting for the deployment to recreate the other replicas on other nodes.

In minikube there is a single node, so drain is mostly for demonstration.

## RollingUpdate in a Deployment — a built-in PDB analog

During a rollout a Deployment already has **its own** constraints:

```yaml
spec:
  strategy:
    type: RollingUpdate
    rollingUpdate:
      maxUnavailable: 25%
      maxSurge: 25%
```

- `maxUnavailable` — how many replicas may be "taken away" at once (below replicas).
- `maxSurge` — how many extra replicas may be created on top (above replicas).

Example: replicas=4, maxUnavailable=1, maxSurge=1 — during a rollout there will be 3..5 pods at a time.

PDB does **not replace** this; it protects against disruptions **outside** of a rollout. If your Deployment is idle and suddenly someone runs a drain — without a PDB the Deployment won't intervene.

## When you need both

- In the Deployment — `RollingUpdate` with sensible maxSurge/maxUnavailable, so that your own deploys don't take the service down.
- + a PDB on that same Deployment, to protect against other people's disruptions (drain, auto-upgrades, load-based eviction).

## Deployment strategies more broadly

Besides `RollingUpdate` and `Recreate`, there are **canary** and **blue-green**, but a Deployment doesn't have them "out of the box" — they're implemented via several Deployments and Service / Ingress weight, or via tools (Argo Rollouts, Flagger). See [21-deployment-strategies.md](21-deployment-strategies.md) for a full walkthrough.

A manual canary example:

```text
Deployment web-stable    (replicas=9, image=v1)   ← 90% of traffic
Deployment web-canary    (replicas=1, image=v2)   ← 10% of traffic
Service web (selector: app=web)                    ← both are matched
```

## terminationGracePeriodSeconds — also about disruption

When a pod is evicted, the kubelet:

1. Sends SIGTERM.
2. Waits `terminationGracePeriodSeconds` (default 30).
3. Sends SIGKILL.

If your application takes a long time to close connections — increase the grace period. If you have nothing valuable to do at shutdown — you can decrease it so that drain finishes faster.

## Useful commands

```bash
kubectl get pdb
kubectl describe pdb web-pdb
kubectl get pdb -A           # PDBs across the whole cluster
kubectl drain <node> --ignore-daemonsets --delete-emptydir-data
kubectl uncordon <node>      # after drain — bring the node back into service

# see which pods are evictable right now:
kubectl get pdb web-pdb -o yaml | grep -E 'currentHealthy|desiredHealthy|disruptionsAllowed'
```

`disruptionsAllowed: 1` — drain can remove one replica right now.

## Checklist

- How does a PDB differ from `RollingUpdate.maxUnavailable`?
- Which kinds of disruption does a PDB **not** protect against?
- What happens to `kubectl drain` if the PDB forbids eviction?
- Can you put a PDB on a StatefulSet? What's important to keep in mind?
- Why does `terminationGracePeriodSeconds` matter for drain?

In the lab [20-lab-pdb-and-rollouts.md](20-lab-pdb-and-rollouts.md) we'll hold a Deployment steady and poke at drain.
