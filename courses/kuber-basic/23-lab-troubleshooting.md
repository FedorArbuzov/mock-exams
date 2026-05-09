# 23. Лаба: Troubleshooting

В этой лабе вы намеренно ломаете кластер и учитесь диагностике по событиям и логам.

## Подготовка

```bash
kubectl create namespace lab-tshoot
kubectl config set-context --current --namespace=lab-tshoot
```

## Сценарий 1. Опечатка в имени образа

Манифест:

```yaml
apiVersion: apps/v1
kind: Deployment
metadata: { name: web }
spec:
  replicas: 1
  selector: { matchLabels: { app: web } }
  template:
    metadata: { labels: { app: web } }
    spec:
      containers:
        - name: web
          image: nginxx:1.27        # <-- опечатка
          ports: [{ containerPort: 80 }]
```

Примените и диагностируйте:

```bash
kubectl apply -f case1.yaml
kubectl get pods -l app=web
kubectl describe pod -l app=web | sed -n '/Events:/,$p'
```

**Задача:** найдите по `Events`, что не так. Исправьте на `nginx:1.27`, примените снова.

**Ожидаемый ответ:** `ImagePullBackOff`, в Events — `Failed to pull image`.

## Сценарий 2. CrashLoopBackOff

```yaml
apiVersion: v1
kind: Pod
metadata: { name: crash }
spec:
  containers:
    - name: app
      image: busybox:1.36
      command: ["sh","-c","echo started; exit 1"]
```

```bash
kubectl apply -f case2.yaml
kubectl get pod crash -w
kubectl logs crash --previous
kubectl describe pod crash | sed -n '/Events:/,$p'
```

**Задача:** объяснить, чем `CrashLoopBackOff` отличается от `Error`/`Completed`, почему `--previous`.

## Сценарий 3. Service без Endpoints

Deployment с метками `app=web` (исправный), но Service с другим selector:

```yaml
apiVersion: apps/v1
kind: Deployment
metadata: { name: web }
spec:
  replicas: 2
  selector: { matchLabels: { app: web } }
  template:
    metadata: { labels: { app: web } }
    spec:
      containers:
        - name: web
          image: nginx:1.27
          ports: [{ containerPort: 80 }]
---
apiVersion: v1
kind: Service
metadata: { name: web }
spec:
  selector: { app: nope }       # <-- не совпадает
  ports: [{ port: 80, targetPort: 80 }]
```

Диагностика:

```bash
kubectl get pods -l app=web
kubectl get endpoints web
kubectl describe svc web
```

**Задача:** объяснить, почему `endpoints web` пустой; починить selector.

## Сценарий 4. Pod в Pending из-за ресурсов

```yaml
apiVersion: v1
kind: Pod
metadata: { name: huge }
spec:
  containers:
    - name: web
      image: nginx:1.27
      resources:
        requests:
          memory: "100Gi"
```

```bash
kubectl apply -f case4.yaml
kubectl get pod huge
kubectl describe pod huge | sed -n '/Events:/,$p'
```

**Задача:** найти `FailedScheduling`, поправить `requests.memory` на разумное (`128Mi`).

## Сценарий 5. ReadinessProbe не проходит

```yaml
apiVersion: v1
kind: Pod
metadata: { name: notready, labels: { app: notready } }
spec:
  containers:
    - name: web
      image: nginx:1.27
      ports: [{ containerPort: 80 }]
      readinessProbe:
        httpGet: { path: /healthz, port: 80 }       # <-- такого пути нет
        initialDelaySeconds: 1
        periodSeconds: 2
```

```bash
kubectl apply -f case5.yaml
kubectl get pod notready
kubectl describe pod notready
```

**Задача:** понять, почему `READY 0/1`; поправить `path: /` (он есть у nginx).

## Сценарий 6. DNS внутри кластера

Поднимите Service `web` (исправный). Из временного Pod проверьте имя:

```bash
kubectl run tmp --rm -it --image=busybox:1.36 --restart=Never -- sh
# внутри:
nslookup web
nslookup web.lab-tshoot
nslookup web.lab-tshoot.svc.cluster.local
wget -qO- http://web
```

**Задача:** убедиться, что короткое имя резолвится только в том же NS, а полное — из любого NS.

## Сценарий 7. kubectl debug

Создайте Pod на `nginx:1.27` (без `sh`/`curl`/`bash` — на самом деле они там есть, но представим, что это distroless):

```bash
kubectl run web-debug --image=nginx:1.27
kubectl debug -it web-debug --image=busybox:1.36 --target=web-debug
# внутри:
ps aux
wget -qO- localhost:80
```

**Задача:** убедиться, что эфемерный контейнер видит процессы основного через `--target`.

## Уборка

```bash
kubectl config set-context --current --namespace=default
kubectl delete ns lab-tshoot
```

## Вопросы для самопроверки

1. Чем `kubectl logs` отличается от `kubectl logs --previous`?
2. Что значит «Endpoints пустые», и какие 2–3 причины этому могут быть?
3. Какая команда быстрее всего покажет «что произошло за последние 5 минут в namespace»?
