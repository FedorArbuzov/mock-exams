# 01. StatefulSet и Headless Service

## Зачем нужен ещё один объект

`Deployment` отлично запускает **stateless** приложения: его поды одинаковые и взаимозаменяемые. Если под умер — k8s создаст новый, имя будет случайное (`web-7d4f8b6c5d-x9p2q`), и это совершенно неважно.

С базами данных, очередями и распределёнными системами всё иначе:

- Postgres-реплика 0 — это **primary**, она пишет в WAL и принимает запись.
- Postgres-реплика 1 — это **standby**, она тянет WAL с реплики 0.
- При рестарте они должны вернуться **с теми же данными** и **в той же роли**.

Чтобы такие приложения работали в Kubernetes, нужны три вещи:

1. **Стабильные сетевые имена** — клиент должен достучаться до конкретного пода (`db-0`, а не до случайного `db-x9p2q`).
2. **Стабильное хранилище** — при перезапуске тот же диск должен подцепиться к тому же поду.
3. **Упорядоченный старт и остановка** — нельзя поднять реплику раньше primary.

Это и есть **StatefulSet**.

## Как StatefulSet это решает

| Свойство | Deployment | StatefulSet |
|---|---|---|
| Имена подов | случайные (`web-abc123-x9p2q`) | детерминированные: `name-0`, `name-1`, ... |
| Порядок старта | параллельный | строго по очереди: `0`, потом `1`, потом `2` |
| Порядок остановки | параллельный | в обратном порядке |
| Тома | shared, любой `kind` | каждому поду — свой PVC из шаблона |
| DNS | один общий через Service | у каждого пода **свой DNS-адрес** через Headless Service |

## Headless Service

Обычный `ClusterIP` Service балансирует трафик по всем эндпоинтам — клиенту не важно, в какой именно под он попал.

Для StatefulSet нужен противоположный режим: **разрешить DNS-имя в адрес конкретного пода**. Это и делает **Headless Service**:

```yaml
apiVersion: v1
kind: Service
metadata:
  name: db
spec:
  clusterIP: None       # ← это и делает service "headless"
  selector:
    app: db
  ports:
    - port: 5432
      targetPort: 5432
```

`clusterIP: None` означает «не выдавать виртуальный IP, не балансировать». DNS теперь работает иначе:

- `db.default.svc.cluster.local` → **список IP всех подов** (round-robin на стороне клиента).
- `db-0.db.default.svc.cluster.local` → **IP пода `db-0`** (всегда тот же, пока под жив).
- `db-1.db.default.svc.cluster.local` → IP пода `db-1`. И так далее.

То есть приложение внутри кластера может явно сказать: «подключись к primary `db-0`», и всегда попадёт куда нужно.

## Минимальный StatefulSet

```yaml
apiVersion: apps/v1
kind: StatefulSet
metadata:
  name: db
spec:
  serviceName: db          # ← имя Headless Service (см. выше)
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
  volumeClaimTemplates:    # ← каждый под получит СВОЙ PVC
    - metadata:
        name: data
      spec:
        accessModes: [ReadWriteOnce]
        resources:
          requests:
            storage: 1Gi
```

Что произойдёт после `kubectl apply`:

```text
db-0   Pending  (создаётся PVC data-db-0, ждёт PV)
db-0   Running
db-1   Pending  (только сейчас, после готовности db-0)
db-1   Running
db-2   Pending
db-2   Running
```

Поды поднимаются **строго по одному**, и только когда предыдущий перешёл в `Ready`. Это критично для систем с join-протоколами (типа Cassandra или etcd).

## volumeClaimTemplates

`volumeClaimTemplates` — это **шаблон PVC**, который для каждой реплики раскрывается в отдельный PVC. Если у вас 3 реплики, появятся:

```text
data-db-0    Bound   pvc-aaa...   1Gi   ReadWriteOnce
data-db-1    Bound   pvc-bbb...   1Gi   ReadWriteOnce
data-db-2    Bound   pvc-ccc...   1Gi   ReadWriteOnce
```

Имя PVC формируется как `<volumeClaimTemplate.name>-<statefulset-name>-<ordinal>`. Эти PVC **не удаляются**, когда вы удаляете StatefulSet (по дефолту), чтобы случайно не потерять данные.

В minikube StorageClass по умолчанию называется `standard`, провайдер — `k8s.io/minikube-hostpath`. Тома живут на ноде в `/tmp/hostpath-provisioner`. Это работает «как настоящие PV» для целей обучения, но физически файлы лежат внутри контейнера minikube.

## Стратегии обновления

```yaml
spec:
  updateStrategy:
    type: RollingUpdate    # default
    rollingUpdate:
      partition: 0
```

`RollingUpdate` обновляет поды **в обратном порядке**: `db-2` → `db-1` → `db-0`. Между подами ждёт `Ready`. Это даёт «сначала обновим standby, в последнюю очередь — primary».

`partition` — индекс, **до** которого не трогать. `partition: 1` означает «обнови только реплики с индексом ≥ 1». Полезно для канареечных релизов и для того, чтобы primary (db-0) не обновлялась автоматически.

`OnDelete` — стратегия «обновляй только при ручном удалении пода». Иногда применяют для очень чувствительных к перезапуску приложений.

## Масштабирование

```bash
kubectl scale sts db --replicas=5
```

Поднимает 4 и 3, по одному, в правильном порядке. При уменьшении — гасит **с конца**: 4, потом 3, потом 2.

**Внимание:** при scale down PVC реплики **не удаляются**. Если потом отскейлите обратно — под подцепит свой старый диск с данными. Удалять PVC нужно вручную или политикой `persistentVolumeClaimRetentionPolicy` (см. ниже).

## persistentVolumeClaimRetentionPolicy (k8s 1.27+)

Можно настроить, что делать с PVC при scale down или удалении StatefulSet:

```yaml
spec:
  persistentVolumeClaimRetentionPolicy:
    whenScaled: Retain         # или Delete
    whenDeleted: Retain        # или Delete
```

В старых версиях этого нет — там PVC всегда «живёт» дольше, чем StatefulSet.

## Когда StatefulSet **не** нужен

- **Stateless web** — берите Deployment, он проще.
- **Job/CronJob** — для разовых или периодических задач.
- **Приложение, у которого state — снаружи** (S3, RDS, managed Redis) — это снова Deployment, никаких stable identity не нужно. Self-hosted Redis в K8s (operator vs StatefulSet) — [redis-advanced/17-k8s-operators](../redis-advanced/17-k8s-operators.md).

StatefulSet — это **не «БД-объект»**, это «объект для приложений со stable identity и/или persistent storage». Часто применяется к Postgres, Cassandra, etcd, Kafka, Elasticsearch, RabbitMQ — но точно так же может пригодиться для любой системы с таким требованием.

## DNS в StatefulSet — ещё раз кратко

Если ваш Headless Service называется `db` в namespace `prod` и есть 3 реплики:

```text
db.prod.svc.cluster.local            → 10.0.1.5  10.0.1.6  10.0.1.7
db-0.db.prod.svc.cluster.local        → 10.0.1.5
db-1.db.prod.svc.cluster.local        → 10.0.1.6
db-2.db.prod.svc.cluster.local        → 10.0.1.7
```

Внутри кластера в `/etc/resolv.conf` подов есть search-list с `<namespace>.svc.cluster.local`, поэтому достаточно писать `db-0.db`.

## Полезные команды

```bash
kubectl get sts                         # список StatefulSet
kubectl get pods -l app=db -o wide      # имена подов и IP
kubectl get pvc                         # PVC, созданные шаблоном
kubectl describe sts db                 # события, рестарт, scale
kubectl rollout status sts/db
kubectl rollout history sts/db
kubectl scale sts db --replicas=2       # уменьшить (db-2 умрёт)
kubectl exec -it db-0 -- bash           # зайти в конкретный под по имени
```

## Чек-лист «понял ли я StatefulSet»

- Зачем `serviceName` в spec и почему для него нужен Headless Service.
- Какое имя у пода с индексом 1 в StatefulSet `kafka` — `kafka-1`.
- Что лежит в PVC `data-db-0` после `kubectl delete pod db-0`. (Подсказка: то же, что и было — под пересоздастся и подцепит тот же диск.)
- В каком порядке поды останавливаются при `kubectl delete sts db`.
- Чем `OnDelete` отличается от `RollingUpdate`.

В лабе [02-lab-statefulset.md](02-lab-statefulset.md) поднимем настоящий Postgres-кластер из 3 реплик и проверим всё это руками.
