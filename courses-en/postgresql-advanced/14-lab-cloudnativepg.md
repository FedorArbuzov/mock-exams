# 14. Lab: CloudNativePG (optional)

## Why this lab

Deploy Postgres in Kubernetes **the right way** — via an operator, not "Pod + PVC". The lab on `mockctl` is optional: if there's no cluster — a tabletop comparison of CNPG vs RDS.

## Prerequisites

**Path A (K8s):**

- `mockctl up` ([INSTALL.md](../../INSTALL.md))
- `kubectl`, Helm 3

**Path B (tabletop):**

- [13-cloud-k8s](13-cloud-k8s.md) read

## Path A — installing CNPG

```bash
helm repo add cnpg https://cloudnative-pg.github.io/charts
helm repo update
helm upgrade --install cnpg cnpg/cloudnative-pg \
  -n cnpg-system --create-namespace
```

Verification:

```bash
kubectl get pods -n cnpg-system
```

## Minimal Cluster

`course-pg-cluster.yaml`:

```yaml
apiVersion: postgresql.cnpg.io/v1
kind: Cluster
metadata:
  name: course-pg
  namespace: databases
spec:
  instances: 2
  storage:
    size: 5Gi
  bootstrap:
    initdb:
      database: app
      owner: app
      secret:
        name: course-pg-app
---
apiVersion: v1
kind: Secret
metadata:
  name: course-pg-app
  namespace: databases
type: kubernetes.io/basic-auth
stringData:
  username: app
  password: app-secret-change-me
```

```bash
kubectl create namespace databases
kubectl apply -f course-pg-cluster.yaml
kubectl get cluster -n databases
kubectl get pods -n databases -l cnpg.io/cluster=course-pg
```

**Expected:** Cluster `Healthy`, 2 pods (primary + replica).

## Connecting

```bash
kubectl port-forward -n databases svc/course-pg-rw 5432:5432
```

```bash
psql "postgresql://app:app-secret-change-me@localhost:5432/app" -c "SELECT version();"
```

| Service | Purpose |
|---------|------------|
| `course-pg-rw` | Read-write (primary) |
| `course-pg-ro` | Read-only (replicas) |
| `course-pg-r` | Any instance (not for prod writes) |

Check the replica:

```bash
kubectl port-forward -n databases svc/course-pg-ro 5433:5432
psql "postgresql://app:app-secret-change-me@localhost:5433/app" \
  -c "SELECT pg_is_in_recovery();"
```

## Failover tabletop (K8s)

```bash
kubectl delete pod -n databases course-pg-1 --force --grace-period=0
# the pod name from kubectl get pods
kubectl get cluster -n databases -w
```

Record: switchover time, the new primary pod.

## Path B — comparison table

`docs/cnpg-vs-rds.md` — at least 5 rows:

| Criterion | CloudNativePG | RDS Multi-AZ |
|----------|---------------|--------------|
| Where it lives | K8s cluster | AWS managed |
| Failover | Operator/Patroni | AWS DNS |
| Backup | S3 + Barman config | Automated snapshots |
| pg_hba / superuser | Full control | Restricted |
| Ops burden | K8s + operator | Low |
| **Your choice for the shop API** | | |

## If something goes wrong

| Symptom | Solution |
|---------|---------|
| Cluster Pending | StorageClass, PVC |
| CrashLoop | `kubectl logs`, resources |
| No Helm | Path B tabletop |
| Wrong password | Secret `course-pg-app` |

## Success criteria

- [ ] Cluster Healthy **or** a CNPG vs RDS table
- [ ] Connection via the `-rw` service
- [ ] You understand `-rw` vs `-ro`
- [ ] You know the namespace and the Cluster name

## Next

Finale: [15-final-project.md](15-final-project.md).
