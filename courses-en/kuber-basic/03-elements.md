# 3. Kubernetes Building Blocks

Everything you manage in Kubernetes is an **object** (a resource). You describe the **desired state** in YAML, and controllers push the cluster toward that state.

## The core objects

| Object | What it's for |
|--------|--------|
| **Pod** | The smallest deployable unit: one or more containers sharing a network namespace and volumes. |
| **ReplicaSet** | Guarantees that **N identical Pods** are running in the cluster. |
| **Deployment** | Manages ReplicaSets: rollouts, rollbacks, scaling. In practice you write a Deployment, and the ReplicaSet gets created for you. |
| **Service** | A stable network address and load balancing for a group of Pods — Pods come and go, the Service stays put. |
| **Namespace** | Logical partitioning of objects within a single cluster (isolation, quotas, RBAC). |

## Coming up later in this course

| Object | What it's for (in brief) |
|--------|-----------------|
| **ConfigMap** | Key-value configuration (non-sensitive). |
| **Secret** | Same idea, for passwords and tokens. |
| **Job / CronJob** | One-off and scheduled tasks. |
| **Ingress** | External HTTP(S) entry point with host/path routing. |

A few more objects are worth knowing exist, even though this course doesn't build them from scratch — **PersistentVolume/PersistentVolumeClaim** (durable storage for Pods), **StatefulSet** (ordered, stateful workloads like databases), and **DaemonSet** (one Pod per node, for things like log or monitoring agents). They get proper coverage in [`kuber-intermediate`](../kuber-intermediate/README.md) — for now, just recognize the names if you see them.

## The shape every object shares

```yaml
apiVersion: <api group/version>
kind: <object type>
metadata:
  name: <name>
  namespace: <namespace, defaults to "default">
  labels:
    <key>: <value>
spec:
  # desired state — specific to each kind
status:
  # actual state, filled in by the cluster itself
```

You edit **`spec`**; **`status`** tells you what actually happened.

## Looking at objects

```bash
kubectl get pods
kubectl get deployments
kubectl get svc            # Service
kubectl get ns             # Namespace
kubectl api-resources      # every object kind available in this cluster
```

For the details on a specific object:

```bash
kubectl describe pod <name>
kubectl get pod <name> -o yaml
```
