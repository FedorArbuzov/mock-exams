# 22. Лаба: init container + sidecar

## Подготовка

```bash
kubectl create namespace lab-init
kubectl config set-context --current --namespace=lab-init
```

## Задание 1. Init container

`web-init.yaml`:

```yaml
apiVersion: v1
kind: Pod
metadata: { name: web-init }
spec:
  restartPolicy: Never
  initContainers:
    - name: setup
      image: busybox
      command: ["sh", "-c", "echo '<h1>hello $(date)</h1>' > /work/index.html && sleep 5"]
      volumeMounts:
        - name: html
          mountPath: /work
  containers:
    - name: nginx
      image: nginx:1.27-alpine
      ports: [{ containerPort: 80 }]
      volumeMounts:
        - name: html
          mountPath: /usr/share/nginx/html
  volumes:
    - name: html
      emptyDir: {}
```

```bash
kubectl apply -f web-init.yaml
kubectl get pod web-init -w
```

**Что увидите:**

```text
web-init   0/1   Init:0/1   0     5s
web-init   0/1   PodInitializing   0   8s
web-init   1/1   Running    0     10s
```

`Init:0/1` — фаза «выполняется первый из 1 init-контейнеров». После завершения init-а перешли в основной.

Проверим страницу:

```bash
kubectl port-forward web-init 8080:80 &
sleep 2
curl -s http://localhost:8080
kill %1
```

Должна быть `<h1>hello ...</h1>`.

## Задание 2. Init упал — что дальше

`init-fail.yaml`:

```yaml
apiVersion: v1
kind: Pod
metadata: { name: init-fail }
spec:
  restartPolicy: Always
  initContainers:
    - name: bad
      image: busybox
      command: ["sh", "-c", "echo failing; exit 1"]
  containers:
    - name: nginx
      image: nginx:1.27-alpine
```

```bash
kubectl apply -f init-fail.yaml
kubectl get pod init-fail -w
```

**Что увидите:** `Init:CrashLoopBackOff` — kubelet раз за разом пытается выполнить init-контейнер. Основной nginx не стартует.

```bash
kubectl logs init-fail -c bad
```

## Задание 3. Sidecar для логов (классический)

`web-sidecar.yaml`:

```yaml
apiVersion: v1
kind: Pod
metadata: { name: web-sidecar }
spec:
  restartPolicy: Never
  containers:
    - name: nginx
      image: nginx:1.27-alpine
      ports: [{ containerPort: 80 }]
      volumeMounts:
        - name: logs
          mountPath: /var/log/nginx
    - name: log-tailer
      image: busybox
      command: ["sh", "-c", "echo 'tailer started'; tail -F /var/log/nginx/access.log"]
      volumeMounts:
        - name: logs
          mountPath: /var/log/nginx
  volumes:
    - name: logs
      emptyDir: {}
```

```bash
kubectl apply -f web-sidecar.yaml
kubectl wait --for=condition=ready pod/web-sidecar
kubectl get pod web-sidecar
```

**Что увидите:** `READY 2/2` — два контейнера в одном поде.

```bash
kubectl logs web-sidecar -c log-tailer
```

Сейчас лог пуст (пока никто не стучался к nginx). Дёрнем nginx:

```bash
kubectl exec web-sidecar -c nginx -- wget -qO- http://localhost > /dev/null
sleep 1
kubectl logs web-sidecar -c log-tailer
```

**Что увидите:** access-лог nginx появился в выводе sidecar-а.

## Задание 4. Native sidecar (k8s 1.29+)

Только если у вас k8s 1.29 и выше. Проверка:

```bash
kubectl version | grep "Server Version"
```

Если 1.29+, попробуем:

`web-native.yaml`:

```yaml
apiVersion: v1
kind: Pod
metadata: { name: web-native }
spec:
  initContainers:
    - name: log-tailer
      image: busybox
      restartPolicy: Always
      command: ["sh", "-c", "echo native-sidecar started; sleep 99999"]
  containers:
    - name: nginx
      image: nginx:1.27-alpine
```

```bash
kubectl apply -f web-native.yaml
kubectl get pod web-native
kubectl describe pod web-native | grep -A2 "Init Containers"
```

**Что увидите:** init-container с `restartPolicy: Always` поднят и **не блокирует** запуск основного. `READY 2/2`. По спецификации он завершится **после** основного при удалении пода.

Если ваша версия 1.28-, увидите ошибку валидации (`restartPolicy` не разрешён в init).

## Задание 5. Init + sidecar вместе

```yaml
apiVersion: v1
kind: Pod
metadata: { name: full }
spec:
  restartPolicy: Never
  initContainers:
    - name: prep
      image: busybox
      command: ["sh", "-c", "echo init-done > /work/marker"]
      volumeMounts:
        - name: shared
          mountPath: /work
  containers:
    - name: app
      image: busybox
      command: ["sh", "-c", "while true; do date; sleep 5; done > /work/app.log"]
      volumeMounts:
        - name: shared
          mountPath: /work
    - name: tailer
      image: busybox
      command: ["sh", "-c", "sleep 1; tail -F /work/app.log"]
      volumeMounts:
        - name: shared
          mountPath: /work
  volumes:
    - name: shared
      emptyDir: {}
```

```bash
kubectl apply -f full.yaml
kubectl wait --for=condition=ready pod/full
kubectl logs full -c tailer
```

**Что увидите:** init выполнился, app пишет дату в файл, sidecar её отдаёт через `kubectl logs`. Это в миниатюре — паттерн «приложение + лог-сборщик» в реальных кластерах.

## Уборка

```bash
kubectl delete namespace lab-init
kubectl config set-context --current --namespace=default
```

## Вопросы для самопроверки

1. Когда выполняется init container — до, после или вместе с основными?
2. Что произойдёт, если init упал с `exit 1`?
3. Чем native sidecar (1.29+) отличается от обычного второго контейнера?
4. Как достучаться до логов конкретного контейнера в pod с двумя?
5. Как два контейнера в одном Pod-е могут «делиться» данными?
