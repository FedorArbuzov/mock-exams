# 13. Лаба: ConfigMap и Secret

Цель — научиться выносить конфиг и секреты из образа: подавать их через ENV и через файлы.

## Подготовка

```bash
kubectl create namespace lab-cs
kubectl config set-context --current --namespace=lab-cs
```

В конце вернётесь в `default` и удалите namespace.

## Задание 1. ConfigMap

Создайте ConfigMap `app-config`:

```bash
kubectl create configmap app-config \
  --from-literal=GREETING=hello \
  --from-literal=LOG_LEVEL=info
kubectl get cm app-config -o yaml
```

**Проверка:** в выводе видны оба ключа в `data:`.

## Задание 2. Под, читающий ConfigMap как ENV

Файл `pod-env.yaml`:

```yaml
apiVersion: v1
kind: Pod
metadata:
  name: env-demo
spec:
  containers:
    - name: app
      image: busybox:1.36
      command: ["sh", "-c", "env | grep -E 'GREETING|LOG_LEVEL'; sleep 3600"]
      envFrom:
        - configMapRef:
            name: app-config
```

```bash
kubectl apply -f pod-env.yaml
kubectl logs env-demo
```

**Проверка:** в логах видны `GREETING=hello` и `LOG_LEVEL=info`.

## Задание 3. ConfigMap как файлы

Создайте ConfigMap из «файла»:

```bash
kubectl create configmap nginx-page --from-literal=index.html='<h1>Hello from CM</h1>'
```

Под, который монтирует CM в `/usr/share/nginx/html`:

```yaml
apiVersion: v1
kind: Pod
metadata:
  name: nginx-cm
  labels:
    app: nginx-cm
spec:
  containers:
    - name: nginx
      image: nginx:1.27
      ports:
        - containerPort: 80
      volumeMounts:
        - name: html
          mountPath: /usr/share/nginx/html
  volumes:
    - name: html
      configMap:
        name: nginx-page
```

Проверьте:

```bash
kubectl apply -f pod-cm.yaml
kubectl exec nginx-cm -- cat /usr/share/nginx/html/index.html
kubectl port-forward pod/nginx-cm 8080:80
# в другом терминале:
curl -s localhost:8080
```

**Проверка:** возвращается `<h1>Hello from CM</h1>`.

## Задание 4. Secret через ENV

```bash
kubectl create secret generic db-secret \
  --from-literal=DB_USER=admin \
  --from-literal=DB_PASSWORD=s3cr3t
```

Pod, читающий пароль:

```yaml
apiVersion: v1
kind: Pod
metadata:
  name: secret-demo
spec:
  containers:
    - name: app
      image: busybox:1.36
      command: ["sh", "-c", "echo $DB_USER:$DB_PASSWORD; sleep 3600"]
      env:
        - name: DB_USER
          valueFrom:
            secretKeyRef:
              name: db-secret
              key: DB_USER
        - name: DB_PASSWORD
          valueFrom:
            secretKeyRef:
              name: db-secret
              key: DB_PASSWORD
```

```bash
kubectl logs secret-demo
```

**Проверка:** в логах строка `admin:s3cr3t`.

## Задание 5. Что лежит в Secret «как есть»

```bash
kubectl get secret db-secret -o yaml
```

Найдите поле `data.DB_PASSWORD`. Декодируйте:

```bash
# Linux/macOS
kubectl get secret db-secret -o jsonpath='{.data.DB_PASSWORD}' | base64 -d
# PowerShell
$b = kubectl get secret db-secret -o jsonpath='{.data.DB_PASSWORD}'
[System.Text.Encoding]::UTF8.GetString([System.Convert]::FromBase64String($b))
```

**Вывод для запоминания:** Secret хранится **в base64**, не зашифрованным. Это не «секретно» — это «отдельная категория с RBAC».

## Задание 6. Изменение ConfigMap и rollout

1. Поменяйте значение в `app-config`:
   ```bash
   kubectl create configmap app-config --from-literal=GREETING=hi --from-literal=LOG_LEVEL=debug -o yaml --dry-run=client | kubectl apply -f -
   ```
2. Загляните в Pod `env-demo`:
   ```bash
   kubectl exec env-demo -- env | grep GREETING
   ```

**Что увидите:** старое значение. ENV-переменные считываются один раз при старте контейнера.

3. Перезапустите контейнер (через delete pod, или через Deployment — `kubectl rollout restart`).

## Уборка

```bash
kubectl delete pod env-demo nginx-cm secret-demo --ignore-not-found
kubectl delete cm app-config nginx-page --ignore-not-found
kubectl delete secret db-secret --ignore-not-found
kubectl config set-context --current --namespace=default
kubectl delete ns lab-cs
```

## Вопросы для самопроверки

1. Чем `env` отличается от `envFrom`?
2. Почему «secret» в Kubernetes ≠ «зашифровано»? Что нужно для настоящего шифрования?
3. Что произойдёт с уже работающим Pod, если изменить ConfigMap, который смонтирован как том?
