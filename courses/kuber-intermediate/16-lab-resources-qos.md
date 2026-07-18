# 16. Лаба: эксперимент с resources, QoS и eviction

## Подготовка

Нужен включённый `metrics-server` (он поднят `mockctl up`). Проверим:

```bash
kubectl top nodes
kubectl top pods -A | head
```

Если ошибка — `minikube -p mock-exams addons enable metrics-server` и подождать минуту.

```bash
kubectl create namespace lab-qos
kubectl config set-context --current --namespace=lab-qos
```

## Задание 1. Три QoS-класса

Применим одновременно три пода с разными настройками.

`qos-pods.yaml`:

```yaml
apiVersion: v1
kind: Pod
metadata: { name: qos-besteffort }
spec:
  restartPolicy: Never
  containers:
    - name: c
      image: busybox
      command: ["sleep", "3600"]
---
apiVersion: v1
kind: Pod
metadata: { name: qos-burstable }
spec:
  restartPolicy: Never
  containers:
    - name: c
      image: busybox
      command: ["sleep", "3600"]
      resources:
        requests:  { cpu: 50m,  memory: 32Mi }
        limits:    { cpu: 100m, memory: 64Mi }
---
apiVersion: v1
kind: Pod
metadata: { name: qos-guaranteed }
spec:
  restartPolicy: Never
  containers:
    - name: c
      image: busybox
      command: ["sleep", "3600"]
      resources:
        requests:  { cpu: 50m, memory: 32Mi }
        limits:    { cpu: 50m, memory: 32Mi }
```

```bash
kubectl apply -f qos-pods.yaml
sleep 3
for p in qos-besteffort qos-burstable qos-guaranteed; do
  printf '%-18s %s\n' "$p" "$(kubectl get pod $p -o jsonpath='{.status.qosClass}')"
done
```

**Что увидите:**

```text
qos-besteffort     BestEffort
qos-burstable      Burstable
qos-guaranteed     Guaranteed
```

## Задание 2. OOMKilled

`oom.yaml`:

```yaml
apiVersion: v1
kind: Pod
metadata: { name: oom-test }
spec:
  restartPolicy: OnFailure
  containers:
    - name: hog
      image: polinux/stress
      command: ["stress"]
      args: ["--vm", "1", "--vm-bytes", "200M", "--vm-keep", "--timeout", "30s"]
      resources:
        requests:  { memory: 64Mi, cpu: 50m }
        limits:    { memory: 128Mi, cpu: 100m }
```

```bash
kubectl apply -f oom.yaml
kubectl get pod oom-test -w
```

**Что увидите:** под несколько раз `Running` → `Error` (OOMKilled) → перезапуск. Через `kubectl describe`:

```text
Last State: Terminated
  Reason:    OOMKilled
  Exit Code: 137
```

`stress` пытается выделить 200 МБ RSS, но `limits.memory: 128Mi` не даёт. Ядро убивает процесс. kubelet перезапускает.

## Задание 3. CPU throttling — не kill

`cpu-hog.yaml`:

```yaml
apiVersion: v1
kind: Pod
metadata: { name: cpu-hog }
spec:
  restartPolicy: Never
  containers:
    - name: hog
      image: polinux/stress
      command: ["stress", "--cpu", "2", "--timeout", "60s"]
      resources:
        requests: { cpu: 100m, memory: 32Mi }
        limits:   { cpu: 200m, memory: 64Mi }
```

```bash
kubectl apply -f cpu-hog.yaml
sleep 5
kubectl top pod cpu-hog
```

**Что увидите:** под пытается съесть 2 CPU, но реально использует ~200m (limits-кеп). Это и есть **throttling** — программа не падает, она ждёт квантов.

```bash
kubectl describe pod cpu-hog | grep -A2 State
```

State `Running`, никаких kill-сигналов.

## Задание 4. Pending по нехватке ресурсов

Узнайте, сколько CPU всего в ноде:

```bash
kubectl describe node $(kubectl get nodes -o name | head -1) | grep -A4 "Allocatable\|Allocated"
```

Создайте под, запрашивающий заведомо больше:

`giant.yaml`:

```yaml
apiVersion: v1
kind: Pod
metadata: { name: giant }
spec:
  restartPolicy: Never
  containers:
    - name: c
      image: busybox
      command: ["sleep", "3600"]
      resources:
        requests:
          cpu: "20"
          memory: 16Gi
```

```bash
kubectl apply -f giant.yaml
kubectl get pod giant
kubectl describe pod giant | grep -A5 Events
```

**Что увидите:** под в `Pending`, в Events:

```text
0/1 nodes are available: Insufficient cpu, Insufficient memory.
```

Уменьшите `requests` до посильных значений и убедитесь, что под перешёл в `Running`.

## Задание 5. ResourceQuota

```yaml
apiVersion: v1
kind: ResourceQuota
metadata: { name: q }
spec:
  hard:
    requests.cpu: "500m"
    requests.memory: 512Mi
    pods: "5"
```

```bash
kubectl apply -f resourcequota.yaml
kubectl describe quota q
```

Создайте 6 одинаковых подов с `requests.cpu: 100m` — последний не пройдёт:

```bash
for i in $(seq 1 6); do
  kubectl run small-$i --image=busybox --restart=Never \
    --overrides='{"spec":{"containers":[{"name":"c","image":"busybox","command":["sleep","3600"],"resources":{"requests":{"cpu":"100m","memory":"32Mi"}}}]}}' \
    -- sleep 3600 || echo "small-$i blocked"
done
```

**Что увидите:** `pods: 5/5` или `requests.cpu: 500m/500m` — следующее создание падает с `exceeded quota`.

## Задание 6. LimitRange — defaults

```yaml
apiVersion: v1
kind: LimitRange
metadata: { name: defaults }
spec:
  limits:
    - type: Container
      default:        { cpu: 200m, memory: 256Mi }
      defaultRequest: { cpu: 100m, memory: 128Mi }
```

```bash
kubectl apply -f limitrange.yaml
kubectl run no-resources --image=busybox -- sleep 3600
kubectl get pod no-resources -o jsonpath='{.spec.containers[0].resources}'
```

**Что увидите:** под, который не указал ресурсы, получил их **из LimitRange по умолчанию**. Это и есть «защита от BestEffort случайно».

## Уборка

```bash
kubectl delete namespace lab-qos
kubectl config set-context --current --namespace=default
```

## Вопросы для самопроверки

1. Какой QoS получит под с `requests=limits` для CPU **и** memory?
2. Что произойдёт с контейнером при превышении `limits.cpu`? `limits.memory`?
3. Чем `LimitRange` отличается от `ResourceQuota`?
4. В каком статусе будет под, если он запросил больше ресурсов, чем есть на ноде?
5. Когда стоит поставить `limits == requests` в production?
