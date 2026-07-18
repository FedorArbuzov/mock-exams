# 07. Лаба: scheduling на minikube

## Подготовка

```bash
kubectl create namespace lab-sched
kubectl config set-context --current --namespace=lab-sched
kubectl label node minikube node-role=worker --overwrite
kubectl label node minikube topology.kubernetes.io/zone=zone-a --overwrite
```

Опционально — вторая нода (если хватает RAM):

```bash
minikube node add -p mock-exams --worker
kubectl label node mock-exams-m02 topology.kubernetes.io/zone=zone-b --overwrite
kubectl label node mock-exams-m02 node-role=worker --overwrite
kubectl get nodes --show-labels | grep zone
```

## Задание 1. nodeSelector

```yaml
apiVersion: v1
kind: Pod
metadata: { name: needs-ssd }
spec:
  nodeSelector: { disktype: ssd }
  containers:
    - name: c
      image: nginx:1.27-alpine
```

```bash
kubectl apply -f needs-ssd.yaml   # Pending — label нет
kubectl label node minikube disktype=ssd
kubectl get pod needs-ssd -w      # Running
```

## Задание 2. Taint + Toleration

```bash
kubectl taint nodes minikube dedicated=app:NoSchedule
```

```yaml
apiVersion: v1
kind: Pod
metadata: { name: no-toleration }
spec:
  containers: [{ name: c, image: busybox, command: ["sleep","3600"] }]
---
apiVersion: v1
kind: Pod
metadata: { name: with-toleration }
spec:
  tolerations:
    - key: dedicated
      operator: Equal
      value: app
      effect: NoSchedule
  containers: [{ name: c, image: busybox, command: ["sleep","3600"] }]
```

**Что увидите:** `no-toleration` — Pending, `with-toleration` — Running.

```bash
kubectl taint nodes minikube dedicated=app:NoSchedule-
```

## Задание 3. podAntiAffinity

```yaml
apiVersion: apps/v1
kind: Deployment
metadata: { name: web }
spec:
  replicas: 3
  selector: { matchLabels: { app: web } }
  template:
    metadata: { labels: { app: web } }
    spec:
      affinity:
        podAntiAffinity:
          requiredDuringSchedulingIgnoredDuringExecution:
            - labelSelector:
                matchLabels: { app: web }
              topologyKey: kubernetes.io/hostname
      containers:
        - name: c
          image: nginx:1.27-alpine
```

На **одной** ноде:

```bash
kubectl apply -f web.yaml
kubectl get pods -l app=web
```

**Что увидите:** только **1** pod Running, остальные Pending (anti-affinity не даёт 2-й на ту же ноду).

На **двух** нодах — 2 Running, 1 Pending. На трёх — все 3.

## Задание 4. topologySpreadConstraints

```yaml
apiVersion: apps/v1
kind: Deployment
metadata: { name: spread }
spec:
  replicas: 4
  selector: { matchLabels: { app: spread } }
  template:
    metadata: { labels: { app: spread } }
    spec:
      topologySpreadConstraints:
        - maxSkew: 1
          topologyKey: topology.kubernetes.io/zone
          whenUnsatisfiable: DoNotSchedule
          labelSelector: { matchLabels: { app: spread } }
      containers:
        - name: c
          image: nginx:1.27-alpine
```

```bash
kubectl apply -f spread.yaml
kubectl get pods -l app=spread -o wide
```

**Что увидите:** поды распределены по зонам (на 2 нодах — по 2 в каждой зоне).

## Задание 5. Cordon и drain (CKA)

```bash
kubectl cordon minikube
kubectl get node minikube    # SchedulingDisabled
kubectl uncordon minikube
```

## Уборка

```bash
kubectl delete namespace lab-sched
kubectl label node minikube disktype- node-role- topology.kubernetes.io/zone- 2>/dev/null
kubectl config set-context --current --namespace=default
```

## Вопросы для самопроверки

1. Почему 3 реплики с anti-affinity на hostname дают только 1 Running на одной ноде?
2. Как снять taint?
3. Чем cordon отличается от drain?
