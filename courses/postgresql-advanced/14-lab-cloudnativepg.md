# 14. Лаба: CloudNativePG (опционально)

## Зачем эта лаба

Развернуть Postgres в Kubernetes **правильно** — через operator, не «Pod + PVC». Лаба на `mockctl` опциональна: при отсутствии кластера — tabletop сравнение CNPG vs RDS.

## Предусловия

**Путь A (K8s):**

- `mockctl up` ([INSTALL.md](../../INSTALL.md))
- `kubectl`, Helm 3

**Путь B (tabletop):**

- [13-cloud-k8s](13-cloud-k8s.md) прочитан

## Путь A — установка CNPG

```bash
helm repo add cnpg https://cloudnative-pg.github.io/charts
helm repo update
helm upgrade --install cnpg cnpg/cloudnative-pg \
  -n cnpg-system --create-namespace
```

Проверка:

```bash
kubectl get pods -n cnpg-system
```

## Минимальный Cluster

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

**Ожидание:** Cluster `Healthy`, 2 pods (primary + replica).

## Подключение

```bash
kubectl port-forward -n databases svc/course-pg-rw 5432:5432
```

```bash
psql "postgresql://app:app-secret-change-me@localhost:5432/app" -c "SELECT version();"
```

| Service | Назначение |
|---------|------------|
| `course-pg-rw` | Read-write (primary) |
| `course-pg-ro` | Read-only (replicas) |
| `course-pg-r` | Any instance (не для prod writes) |

Проверка replica:

```bash
kubectl port-forward -n databases svc/course-pg-ro 5433:5432
psql "postgresql://app:app-secret-change-me@localhost:5433/app" \
  -c "SELECT pg_is_in_recovery();"
```

## Failover tabletop (K8s)

```bash
kubectl delete pod -n databases course-pg-1 --force --grace-period=0
# имя pod из kubectl get pods
kubectl get cluster -n databases -w
```

Зафиксируйте: время switchover, новый primary pod.

## Путь B — сравнительная таблица

`docs/cnpg-vs-rds.md` — минимум 5 строк:

| Критерий | CloudNativePG | RDS Multi-AZ |
|----------|---------------|--------------|
| Где живёт | K8s cluster | AWS managed |
| Failover | Operator/Patroni | AWS DNS |
| Backup | S3 + Barman config | Automated snapshots |
| pg_hba / superuser | Полный контроль | Ограничен |
| Ops burden | K8s + operator | Низкий |
| **Ваш выбор для shop API** | | |

## Если что-то пошло не так

| Симптом | Решение |
|---------|---------|
| Cluster Pending | StorageClass, PVC |
| CrashLoop | `kubectl logs`, resources |
| No Helm | Путь B tabletop |
| Wrong password | Secret `course-pg-app` |

## Критерии успеха

- [ ] Cluster Healthy **или** таблица CNPG vs RDS
- [ ] Подключение через `-rw` service
- [ ] Понимаете `-rw` vs `-ro`
- [ ] Знаете namespace и имя Cluster

## Дальше

Финал: [15-final-project.md](15-final-project.md).
