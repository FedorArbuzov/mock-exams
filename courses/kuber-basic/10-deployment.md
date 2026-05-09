# 10. Deployment

## Что это

**Deployment** — самый часто используемый объект для запуска приложений без состояния (stateless). Он:

- Создаёт и управляет **ReplicaSet**.
- Поддерживает нужное **число реплик**.
- Делает **rolling update** (плавное обновление) и **rollback** (откат).
- Позволяет ставить и снимать **на паузу** деплой.

Иерархия:

```
Deployment  -->  ReplicaSet  -->  Pods
```

Когда вы меняете шаблон в Deployment, он создаёт **новый ReplicaSet** под новой версией и постепенно переключает поды.

## Минимальный Deployment

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: web
  labels:
    app: web
spec:
  replicas: 3
  selector:
    matchLabels:
      app: web
  template:
    metadata:
      labels:
        app: web
    spec:
      containers:
        - name: nginx
          image: nginx:1.27
          ports:
            - containerPort: 80
```

```bash
kubectl apply -f deploy.yaml
kubectl get deploy
kubectl get rs
kubectl get pods -l app=web
```

## Стратегии обновления

В `spec.strategy.type`:

- **RollingUpdate** (по умолчанию) — постепенно поднимает новые поды и гасит старые. Управляется параметрами:
  - `maxSurge` — на сколько *сверх* `replicas` можно создать новых временно.
  - `maxUnavailable` — сколько может быть недоступных в момент обновления.
- **Recreate** — сначала убивает все старые, потом создаёт новые. Просто, но с простоем.

```yaml
spec:
  strategy:
    type: RollingUpdate
    rollingUpdate:
      maxSurge: 1
      maxUnavailable: 0
```

## Обновление образа и откат

Поменять образ:

```bash
kubectl set image deploy/web nginx=nginx:1.27.1
kubectl rollout status deploy/web
```

История релизов:

```bash
kubectl rollout history deploy/web
kubectl rollout history deploy/web --revision=2
```

Откат:

```bash
kubectl rollout undo deploy/web                 # к предыдущей версии
kubectl rollout undo deploy/web --to-revision=1
```

Пауза/продолжение:

```bash
kubectl rollout pause deploy/web
kubectl rollout resume deploy/web
```

## Масштабирование

```bash
kubectl scale deploy/web --replicas=5
```

или меняем `replicas` в YAML и `kubectl apply -f`.

## Полезные команды

```bash
kubectl get deploy
kubectl describe deploy web
kubectl get rs -l app=web         # увидите старые и новый RS
kubectl get pods -l app=web -o wide
kubectl logs deploy/web           # логи случайного пода Deployment
```

## Когда Deployment **не** подходит

- Для приложений со «состоянием» (БД, очереди, нужны стабильные имена/тома) — **StatefulSet**.
- Для агентов «по одному на ноду» (логи, мониторинг) — **DaemonSet**.
- Для разовых задач — **Job**, для расписания — **CronJob**.
