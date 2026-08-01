# 17. Kubernetes: StatefulSet and Redis operators

## Intro: “we ran Redis as a Deployment — lost the data”

The pod was recreated with a new name — **emptyDir** was empty. Or two pods wrote to one PVC at once. Stateful data in Kubernetes needs a [**StatefulSet**](../kuber-intermediate/01-statefulset.md) + **stable network ID** + **PVC per pod** — or an **operator** that automates that.

## What you'll learn

- Why **not a Deployment** for Redis master.
- **Headless Service** and DNS `redis-0.redis`.
- **Operators**: Spotahome, Opstree, Redis Enterprise, crossplane.
- Redis Cluster in k8s — specifics.

---

## StatefulSet baseline

From [kuber-intermediate/01-statefulset](../kuber-intermediate/01-statefulset.md):

| Property | Why for Redis |
|----------|-------------|
| Stable pod name | `redis-0` is always the same instance |
| Ordered start | Master first, then replicas |
| PVC template | Data survives restart |

```yaml
apiVersion: v1
kind: Service
metadata:
  name: redis-headless
spec:
  clusterIP: None
  selector:
    app: redis
  ports:
    - port: 6379
---
apiVersion: apps/v1
kind: StatefulSet
metadata:
  name: redis
spec:
  serviceName: redis-headless
  replicas: 3
  selector:
    matchLabels:
      app: redis
  template:
    metadata:
      labels:
        app: redis
    spec:
      containers:
        - name: redis
          image: redis:7.2-alpine
          ports:
            - containerPort: 6379
```

**Anti-pattern:** one Deployment + one RWO PVC — the second pod won’t mount.

---

## Sentinel / replication in k8s

- **Master label** via operator or helm chart.
- **Sentinel** as sidecar or separate StatefulSet.
- **Read** vs **write** Service (or proxy).

---

## Redis Cluster in k8s

| Approach | Comment |
|--------|-------------|
| 6 StatefulSets / 1 STS replicas:6 | Need **cluster-aware** clients |
| HostNetwork | Sometimes for bus ports |
| Operator | Auto `CLUSTER MEET`, resharding UI |

**Pod IP vs DNS:** clients must get a **reachable** announce IP (`cluster-announce-ip` as in [docker-compose.cluster.yml](../../deploy/redis/docker-compose.cluster.yml)).

---

## Operators (overview)

| Operator | Note |
|----------|---------|
| Spotahome redis-operator | Sentinel, failover |
| Opstree / OT-CONTAINER-KIT | Cluster, monitoring |
| Redis Enterprise | Commercial, active-active |
| Helm bitnami/redis | Quick start; check production readiness |

An operator should provide: backup hooks, upgrade strategy, PDB, anti-affinity.

---

## Resources and security

```yaml
resources:
  requests:
    memory: "8Gi"
  limits:
    memory: "8Gi"   # no overcommit for Redis
```

- **Secret** for ACL password.
- **NetworkPolicy** — only app namespace → 6379.
- Don’t mount **docker.sock** ([linux-advanced: docker socket](../linux-advanced/25-docker-socket.md)).

---

## Managed alternative

If SRE capacity is low — **ElastiCache** in VPC + security groups is simpler than self-hosted Cluster in k8s ([16](16-valkey-stack.md)).

---

## In the interview

“How do you run Redis in k8s?” — StatefulSet + PVC + headless **or** managed + **not** a Deployment for state.

---

## Summary

1. The link to [StatefulSet](../kuber-intermediate/01-statefulset.md) is mandatory.
2. Cluster in k8s — **networking and announce** are the main pain.
3. Operators save failover/backup work; they don’t replace key design.

**Next:** [18. Capstone](18-capstone.md).
