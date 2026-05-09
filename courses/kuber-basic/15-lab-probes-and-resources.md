# 15. Лаба: Probes и Resources

Цель — увидеть, что делают liveness/readiness и как поды реагируют на лимиты.

## Подготовка

В minikube включите metrics-server, чтобы работал `kubectl top`:

```bash
minikube -p mock-exams addons enable metrics-server
```

## Задание 1. readinessProbe

Создайте Pod, который **не сразу** готов:

```yaml
apiVersion: v1
kind: Pod
metadata:
  name: ready-demo
  labels:
    app: ready
spec:
  containers:
    - name: web
      image: nginx:1.27
      ports:
        - containerPort: 80
      readinessProbe:
        exec:
          command: ["sh", "-c", "[ -f /tmp/ready ]"]
        initialDelaySeconds: 1
        periodSeconds: 2
```

```bash
kubectl apply -f ready-demo.yaml
kubectl get pod ready-demo -w
```

**Что увидите:** `READY 0/1` — readinessProbe не проходит, файла `/tmp/ready` нет.

«Готовим» под:

```bash
kubectl exec ready-demo -- touch /tmp/ready
kubectl get pod ready-demo
```

**Проверка:** через несколько секунд `READY 1/1`.

## Задание 2. livenessProbe и рестарт

Pod, у которого liveness падает после первой минуты:

```yaml
apiVersion: v1
kind: Pod
metadata:
  name: live-demo
spec:
  containers:
    - name: app
      image: busybox:1.36
      command: ["sh", "-c", "touch /tmp/healthy; sleep 30; rm /tmp/healthy; sleep 600"]
      livenessProbe:
        exec:
          command: ["test", "-f", "/tmp/healthy"]
        initialDelaySeconds: 5
        periodSeconds: 5
        failureThreshold: 2
```

```bash
kubectl apply -f live-demo.yaml
kubectl get pod live-demo -w
```

**Что увидите:** через ~40 секунд счётчик `RESTARTS` начнёт расти — liveness фейлится, контейнер перезапускается.

```bash
kubectl describe pod live-demo | sed -n '/Events:/,$p'
```

## Задание 3. Resources и Pending

Создайте Pod с очень большим запросом памяти:

```yaml
apiVersion: v1
kind: Pod
metadata:
  name: big
spec:
  containers:
    - name: web
      image: nginx:1.27
      resources:
        requests:
          memory: "100Gi"
```

```bash
kubectl apply -f big.yaml
kubectl get pod big
kubectl describe pod big | sed -n '/Events:/,$p'
```

**Проверка:** Pod в `Pending` с событием `FailedScheduling`. Удалите его.

## Задание 4. OOMKilled

Pod, который старается взять больше памяти, чем разрешено:

```yaml
apiVersion: v1
kind: Pod
metadata:
  name: hungry
spec:
  containers:
    - name: app
      image: polinux/stress
      resources:
        requests:
          memory: "32Mi"
        limits:
          memory: "64Mi"
      command: ["stress"]
      args: ["--vm", "1", "--vm-bytes", "200M", "--vm-hang", "1"]
```

```bash
kubectl apply -f hungry.yaml
kubectl get pod hungry -w
kubectl describe pod hungry | sed -n '/Last State:/,/Events:/p'
```

**Что увидите:** `OOMKilled`, контейнер перезапускается.

Удалите.

## Задание 5. QoS-класс

Сделайте три Pod:

- **best-effort** — без requests/limits.
- **burstable** — есть requests, нет limits (или limits > requests).
- **guaranteed** — requests == limits для CPU и memory.

Посмотрите класс каждого:

```bash
for p in best-effort burstable guaranteed; do
  echo "$p: $(kubectl get pod $p -o jsonpath='{.status.qosClass}')"
done
```

**Проверка:** соответственно `BestEffort`, `Burstable`, `Guaranteed`.

## Задание 6. Метрики

```bash
kubectl top node
kubectl top pod -A
```

**Проверка:** показывается фактическое потребление CPU/памяти. Если ругается «metrics not available» — подождите минуту и повторите.

## Уборка

```bash
kubectl delete pod ready-demo live-demo big hungry best-effort burstable guaranteed --ignore-not-found
```

## Вопросы для самопроверки

1. Чем отличается результат фейла livenessProbe и readinessProbe?
2. Почему `requests` важнее `limits` для **планирования** (scheduling)?
3. Какой QoS-класс получает Pod без указания `resources`? Чем это плохо?
