# 18. Лаба: HPA по CPU

## Подготовка

```bash
kubectl top nodes      # metrics-server должен работать
kubectl create namespace lab-hpa
kubectl config set-context --current --namespace=lab-hpa
```

## Задание 1. Развернуть приложение с requests

`web.yaml`:

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: web
spec:
  replicas: 1
  selector:
    matchLabels: { app: web }
  template:
    metadata:
      labels: { app: web }
    spec:
      containers:
        - name: app
          image: registry.k8s.io/hpa-example
          ports:
            - containerPort: 80
          resources:
            requests:
              cpu: 100m
              memory: 64Mi
            limits:
              cpu: 500m
              memory: 128Mi
---
apiVersion: v1
kind: Service
metadata:
  name: web
spec:
  selector: { app: web }
  ports:
    - port: 80
      targetPort: 80
```

```bash
kubectl apply -f web.yaml
kubectl rollout status deploy/web
kubectl top pod -l app=web
```

`registry.k8s.io/hpa-example` — крошечный php-apache, который при HTTP-запросе перемалывает CPU. Идеально для демонстрации HPA.

## Задание 2. Создать HPA

```bash
kubectl autoscale deploy web --cpu-percent=50 --min=1 --max=5
kubectl get hpa
kubectl describe hpa web | grep -A2 "Min replicas\|Max replicas\|Targets"
```

Альтернативно — манифестом:

```yaml
apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata: { name: web }
spec:
  scaleTargetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: web
  minReplicas: 1
  maxReplicas: 5
  metrics:
    - type: Resource
      resource:
        name: cpu
        target:
          type: Utilization
          averageUtilization: 50
```

## Задание 3. Дать нагрузку

В отдельной вкладке:

```bash
kubectl run -it --rm load --image=busybox --restart=Never -- sh -c \
  "while true; do wget -qO- http://web; done"
```

В первой вкладке:

```bash
kubectl get hpa web -w
```

**Что увидите** (через ~1–2 минуты):

```text
NAME   REFERENCE        TARGETS    MINPODS   MAXPODS   REPLICAS
web    Deployment/web   180%/50%   1         5         1
web    Deployment/web   180%/50%   1         5         3       ← scale up
web    Deployment/web   60%/50%    1         5         3
web    Deployment/web   60%/50%    1         5         4
web    Deployment/web   45%/50%    1         5         4
```

HPA увидел, что utilization — 180% от target = 50%, и поднял реплики, пока не пришло к ~50%.

## Задание 4. Снять нагрузку

В вкладке с `load` нажмите Ctrl+C → exit.

В первой вкладке `kubectl get hpa web -w`:

```text
web    Deployment/web   2%/50%     1   5   4    ← пока 4
... (5 минут)
web    Deployment/web   2%/50%     1   5   1    ← scale down
```

**Что заметили:** scale-down происходит **с задержкой**. По умолчанию это 5 минут (`stabilizationWindowSeconds: 300`). Это защита от «пилы».

## Задание 5. Поменять behavior

Замените HPA на манифест с явным behavior:

```yaml
apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata: { name: web }
spec:
  scaleTargetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: web
  minReplicas: 1
  maxReplicas: 5
  metrics:
    - type: Resource
      resource:
        name: cpu
        target:
          type: Utilization
          averageUtilization: 50
  behavior:
    scaleUp:
      stabilizationWindowSeconds: 0
      policies:
        - type: Percent
          value: 100
          periodSeconds: 15
    scaleDown:
      stabilizationWindowSeconds: 30
      policies:
        - type: Pods
          value: 1
          periodSeconds: 30
```

```bash
kubectl apply -f hpa.yaml
```

Снова дайте нагрузку, потом снимите. **Что увидите:** scale-down теперь начинается через 30 секунд, и по 1 поду за 30 секунд. Это медленнее, но плавнее.

## Задание 6. Что произойдёт без requests

Уберите блок `resources` из `web.yaml`:

```bash
kubectl set env deploy/web PLACEHOLDER=    # триггер для restart
kubectl edit deploy/web                    # руками удалите resources
```

```bash
kubectl describe hpa web | tail -20
```

**Что увидите:** в Events HPA появится:

```text
FailedGetResourceMetric: missing request for cpu
```

HPA не может вычислить utilization без `requests`. Верните блок resources на место.

## Уборка

```bash
kubectl delete namespace lab-hpa
kubectl config set-context --current --namespace=default
```

## Вопросы для самопроверки

1. Что обязательно должно быть на Deployment, чтобы CPU-HPA работал?
2. Зачем minReplicas нужен, если максимум — 5 реплик?
3. Как HPA считает желаемое количество реплик? (формула)
4. Что произойдёт с метрикой через 5 минут после снятия нагрузки, если `stabilizationWindowSeconds: 300`?
5. Как сделать «скейлим вверх агрессивно, вниз — плавно»?
