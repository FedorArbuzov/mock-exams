# 01. StatefulSet and Headless Service

## Why we need yet another object

`Deployment` is great at running **stateless** applications: its pods are identical and interchangeable. If a pod dies, k8s creates a new one, the name is random (`web-7d4f8b6c5d-x9p2q`), and that's completely irrelevant.

With databases, queues, and distributed systems it's a different story:

- Postgres replica 0 is the **primary**, it writes to the WAL and accepts writes.
- Postgres replica 1 is a **standby**, it pulls the WAL from replica 0.
- On restart they must come back **with the same data** and **in the same role**.

For such applications to work in Kubernetes, you need three things:

1. **Stable network names** — a client must be able to reach a specific pod (`db-0`, not a random `db-x9p2q`).
2. **Stable storage** — on restart the same disk must attach to the same pod.
3. **Ordered start and stop** — you can't bring up a replica before the primary.

This is exactly what **StatefulSet** provides.

## How StatefulSet solves this

| Property | Deployment | StatefulSet |
|---|---|---|
| Pod names | random (`web-abc123-x9p2q`) | deterministic: `name-0`, `name-1`, ... |
| Start order | parallel | strictly in sequence: `0`, then `1`, then `2` |
| Stop order | parallel | in reverse order |
| Volumes | shared, any `kind` | each pod gets its own PVC from a template |
| DNS | one shared via Service | each pod has **its own DNS address** via a Headless Service |

## Headless Service

A regular `ClusterIP` Service load-balances traffic across all endpoints — the client doesn't care which pod it lands on.

For a StatefulSet you need the opposite mode: **resolve a DNS name to a specific pod's address**. That's exactly what a **Headless Service** does:

```yaml
apiVersion: v1
kind: Service
metadata:
  name: db
spec:
  clusterIP: None       # ← this is what makes the service "headless"
  selector:
    app: db
  ports:
    - port: 5432
      targetPort: 5432
```

`clusterIP: None` means "don't hand out a virtual IP, don't load-balance". DNS now works differently:

- `db.default.svc.cluster.local` → **the list of IPs of all pods** (client-side round-robin).
- `db-0.db.default.svc.cluster.local` → **the IP of pod `db-0`** (always the same while the pod is alive).
- `db-1.db.default.svc.cluster.local` → the IP of pod `db-1`. And so on.

In other words, an application inside the cluster can explicitly say "connect to the primary `db-0`" and always reach the right place.

## Minimal StatefulSet

```yaml
apiVersion: apps/v1
kind: StatefulSet
metadata:
  name: db
spec:
  serviceName: db          # ← name of the Headless Service (see above)
  replicas: 3
  selector:
    matchLabels:
      app: db
  template:
    metadata:
      labels:
        app: db
    spec:
      containers:
        - name: postgres
          image: postgres:16
          env:
            - name: POSTGRES_PASSWORD
              value: example
          ports:
            - containerPort: 5432
          volumeMounts:
            - name: data
              mountPath: /var/lib/postgresql/data
  volumeClaimTemplates:    # ← each pod gets its OWN PVC
    - metadata:
        name: data
      spec:
        accessModes: [ReadWriteOnce]
        resources:
          requests:
            storage: 1Gi
```

What happens after `kubectl apply`:

```text
db-0   Pending  (creating PVC data-db-0, waiting for a PV)
db-0   Running
db-1   Pending  (only now, after db-0 is ready)
db-1   Running
db-2   Pending
db-2   Running
```

Pods come up **strictly one at a time**, and only once the previous one becomes `Ready`. This is critical for systems with join protocols (like Cassandra or etcd).

## volumeClaimTemplates

`volumeClaimTemplates` is a **PVC template** that expands into a separate PVC for each replica. With 3 replicas you get:

```text
data-db-0    Bound   pvc-aaa...   1Gi   ReadWriteOnce
data-db-1    Bound   pvc-bbb...   1Gi   ReadWriteOnce
data-db-2    Bound   pvc-ccc...   1Gi   ReadWriteOnce
```

The PVC name is formed as `<volumeClaimTemplate.name>-<statefulset-name>-<ordinal>`. These PVCs are **not deleted** when you delete the StatefulSet (by default), so you don't accidentally lose data.

In minikube the default StorageClass is called `standard`, the provisioner is `k8s.io/minikube-hostpath`. Volumes live on the node under `/tmp/hostpath-provisioner`. This works "like real PVs" for learning purposes, but physically the files sit inside the minikube container.

## Update strategies

```yaml
spec:
  updateStrategy:
    type: RollingUpdate    # default
    rollingUpdate:
      partition: 0
```

`RollingUpdate` updates pods **in reverse order**: `db-2` → `db-1` → `db-0`. Between pods it waits for `Ready`. This gives you "update the standby first, the primary last".

`partition` is the index **below** which pods are not touched. `partition: 1` means "update only replicas with index ≥ 1". Useful for canary releases and for keeping the primary (db-0) from updating automatically.

`OnDelete` is the "update only when the pod is manually deleted" strategy. Sometimes used for applications that are very sensitive to restarts.

## Scaling

```bash
kubectl scale sts db --replicas=5
```

Brings up 4 and 3, one at a time, in the correct order. When scaling down it terminates **from the end**: 4, then 3, then 2.

**Note:** on scale down the replicas' PVCs are **not deleted**. If you later scale back up, the pod will reattach its old disk with the data. To delete PVCs you must do so manually or via the `persistentVolumeClaimRetentionPolicy` policy (see below).

## persistentVolumeClaimRetentionPolicy (k8s 1.27+)

You can configure what to do with PVCs on scale down or when deleting the StatefulSet:

```yaml
spec:
  persistentVolumeClaimRetentionPolicy:
    whenScaled: Retain         # or Delete
    whenDeleted: Retain        # or Delete
```

Older versions don't have this — there the PVC always "outlives" the StatefulSet.

## When you do **not** need a StatefulSet

- **Stateless web** — use a Deployment, it's simpler.
- **Job/CronJob** — for one-off or periodic tasks.
- **An application whose state is external** (S3, RDS, managed Redis) — that's a Deployment again, no stable identity needed. Self-hosted Redis in K8s (operator vs StatefulSet) — [redis-advanced/17-k8s-operators](../redis-advanced/17-k8s-operators.md).

A StatefulSet is **not a "DB object"**, it's an "object for applications with stable identity and/or persistent storage". It's often applied to Postgres, Cassandra, etcd, Kafka, Elasticsearch, RabbitMQ — but it can just as well be useful for any system with that requirement.

## DNS in a StatefulSet — once more, briefly

If your Headless Service is called `db` in namespace `prod` and there are 3 replicas:

```text
db.prod.svc.cluster.local            → 10.0.1.5  10.0.1.6  10.0.1.7
db-0.db.prod.svc.cluster.local        → 10.0.1.5
db-1.db.prod.svc.cluster.local        → 10.0.1.6
db-2.db.prod.svc.cluster.local        → 10.0.1.7
```

Inside the cluster, the pods' `/etc/resolv.conf` has a search list with `<namespace>.svc.cluster.local`, so it's enough to write `db-0.db`.

## Useful commands

```bash
kubectl get sts                         # list StatefulSets
kubectl get pods -l app=db -o wide      # pod names and IPs
kubectl get pvc                         # PVCs created by the template
kubectl describe sts db                 # events, restarts, scaling
kubectl rollout status sts/db
kubectl rollout history sts/db
kubectl scale sts db --replicas=2       # scale down (db-2 will die)
kubectl exec -it db-0 -- bash           # exec into a specific pod by name
```

## Checklist "do I understand StatefulSet"

- Why `serviceName` is in the spec and why it needs a Headless Service.
- What the name of the pod with index 1 is in the `kafka` StatefulSet — `kafka-1`.
- What's in the PVC `data-db-0` after `kubectl delete pod db-0`. (Hint: the same as before — the pod is recreated and reattaches the same disk.)
- In what order pods stop on `kubectl delete sts db`.
- How `OnDelete` differs from `RollingUpdate`.

In the lab [02-lab-statefulset.md](02-lab-statefulset.md) we'll bring up a real 3-replica Postgres cluster and verify all of this by hand.
