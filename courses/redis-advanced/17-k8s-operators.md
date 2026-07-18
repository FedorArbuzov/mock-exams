# 17. Kubernetes: StatefulSet и операторы Redis

## Введение: «запустили Redis как Deployment — потеряли данные»

Pod пересоздался с новым именем — **emptyDir** пуст. Или два pod одновременно писали в один PVC. Stateful data в Kubernetes требует [**StatefulSet**](../kuber-intermediate/01-statefulset.md) + **stable network ID** + **PVC per pod** — или **оператор**, который это автоматизирует.

## Что вы узнаете

- Почему **не Deployment** для Redis master.
- **Headless Service** и DNS `redis-0.redis`.
- **Operators**: Spotahome, Opstree, Redis Enterprise, crossplane.
- Redis Cluster в k8s — особенности.

---

## StatefulSet baseline

Из [kuber-intermediate/01-statefulset](../kuber-intermediate/01-statefulset.md):

| Свойство | Зачем Redis |
|----------|-------------|
| Stable pod name | `redis-0` всегда тот же инстанс |
| Ordered start | Сначала master, потом replicas |
| PVC template | Данные переживают restart |

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

**Anti-pattern:** один Deployment + один PVC RWO — второй pod не mount.

---

## Sentinel / replication в k8s

- **Master label** через operator или helm chart.
- **Sentinel** как sidecar или отдельный StatefulSet.
- Service **read** vs **write** (или proxy).

---

## Redis Cluster в k8s

| Подход | Комментарий |
|--------|-------------|
| 6 StatefulSets / 1 STS replicas:6 | Нужны **cluster-aware** clients |
| HostNetwork | Иногда для bus ports |
| Operator | Авто `CLUSTER MEET`, resharding UI |

**Pod IP vs DNS:** клиенты должны получать **достижимые** announce IP (`cluster-announce-ip` как в [docker-compose.cluster.yml](../../deploy/redis/docker-compose.cluster.yml)).

---

## Operators (обзор)

| Operator | Заметка |
|----------|---------|
| Spotahome redis-operator | Sentinel, failover |
| Opstree / OT-CONTAINER-KIT | Cluster, monitoring |
| Redis Enterprise | Commercial, active-active |
| Helm bitnami/redis | Быстрый старт, проверять production readiness |

Оператор должен: backup hooks, upgrade strategy, PDB, anti-affinity.

---

## Resources и security

```yaml
resources:
  requests:
    memory: "8Gi"
  limits:
    memory: "8Gi"   # без overcommit на Redis
```

- **Secret** для ACL password.
- **NetworkPolicy** — только namespace app → 6379.
- Не монтировать **docker.sock** ([linux-advanced: docker socket](../linux-advanced/25-docker-socket.md)).

---

## Managed alternative

Если SRE мало — **ElastiCache** в VPC + security groups проще, чем self-hosted Cluster в k8s ([16](16-valkey-stack.md)).

---

## На собеседовании

«Как Redis в k8s?» — StatefulSet + PVC + headless **или** managed + **не** Deployment для state.

---

## Резюме

1. Связка с [StatefulSet](../kuber-intermediate/01-statefulset.md) обязательна.
2. Cluster в k8s — **сеть и announce** — главная боль.
3. Operators экономят failover/backup, не отменяют key design.

**Дальше:** [18. Capstone](18-capstone.md).
