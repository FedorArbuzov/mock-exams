# 6. Создание подов с YAML

## Минимальный Pod в YAML

```yaml
apiVersion: v1
kind: Pod
metadata:
  name: nginx
  labels:
    app: nginx
spec:
  containers:
    - name: nginx
      image: nginx:1.27
      ports:
        - containerPort: 80
```

Сохраните как `pod.yaml` и примените:

```bash
kubectl apply -f pod.yaml
kubectl get pods
kubectl describe pod nginx
```

Удалить:

```bash
kubectl delete -f pod.yaml
# или
kubectl delete pod nginx
```

## Чуть более «настоящий» Pod

```yaml
apiVersion: v1
kind: Pod
metadata:
  name: web
  labels:
    app: web
    tier: frontend
spec:
  containers:
    - name: web
      image: nginx:1.27
      ports:
        - containerPort: 80
      env:
        - name: GREETING
          value: "hello"
      resources:
        requests:
          cpu: "50m"
          memory: "64Mi"
        limits:
          cpu: "200m"
          memory: "128Mi"
      readinessProbe:
        httpGet:
          path: /
          port: 80
        initialDelaySeconds: 2
        periodSeconds: 5
```

Что добавилось:

- **labels** — метки, по которым потом ищут Pod (Service, ReplicaSet используют selectors по labels).
- **env** — переменные окружения для контейнера.
- **resources.requests/limits** — сколько CPU/памяти запрашиваем и сколько максимум разрешим.
- **readinessProbe** — Pod считается готовым (`READY 1/1`) только когда HTTP-проверка прошла.

## Несколько контейнеров в одном Pod

```yaml
apiVersion: v1
kind: Pod
metadata:
  name: web-with-sidecar
spec:
  containers:
    - name: web
      image: nginx:1.27
    - name: sidecar
      image: busybox:1.36
      command: ["sh", "-c", "while true; do echo tick; sleep 5; done"]
```

Эти два контейнера видят друг друга по `localhost` и могут шарить тома.

## Полезные приёмы

**Сгенерировать YAML-шаблон:**

```bash
kubectl run nginx --image=nginx:1.27 --dry-run=client -o yaml > pod.yaml
```

**Применить и сразу посмотреть:**

```bash
kubectl apply -f pod.yaml
kubectl get pods -w   # -w следит за изменениями
```

**Получить актуальный YAML живого пода:**

```bash
kubectl get pod nginx -o yaml
```

## Что **не** стоит делать в проде

- Создавать «голый» Pod без Deployment/ReplicaSet — он не пересоздастся.
- Жёстко прибивать имя ноды или порт хоста без необходимости.
- Хранить секреты в `env: value:` — для этого есть **Secret**.
