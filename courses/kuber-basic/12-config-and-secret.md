# 12. ConfigMap и Secret

## Зачем

Конфиги и секреты не должны жить **внутри образа** — иначе под каждое окружение пришлось бы пересобирать контейнер. Kubernetes даёт два объекта:

- **ConfigMap** — обычные значения (URL'ы, фичефлаги, конфиги).
- **Secret** — пароли, токены, ключи. Хранится **base64-кодированным** (это **не** шифрование, это просто кодирование), и у объекта обычно более жёсткий RBAC.

> Важно: **Secret по умолчанию не шифруется**. Для шифрования в etcd нужно настроить **encryption at rest** на уровне кластера, либо хранить секреты во внешнем менеджере (Vault, AWS Secrets Manager и т.д.).

## ConfigMap: что внутри

Пары «ключ → значение». Можно хранить как короткие строки, так и целые файлы.

```yaml
apiVersion: v1
kind: ConfigMap
metadata:
  name: app-config
data:
  GREETING: "Hello from configmap"
  LOG_LEVEL: "info"
  app.properties: |
    server.port=8080
    feature.x=true
```

Создание из CLI:

```bash
kubectl create configmap app-config \
  --from-literal=GREETING=Hello \
  --from-literal=LOG_LEVEL=info

kubectl create configmap nginx-conf --from-file=./default.conf
```

## Secret: что внутри

Структурно похоже, но в `data` значения уже в base64; можно использовать `stringData`, и kubectl сам закодирует.

```yaml
apiVersion: v1
kind: Secret
metadata:
  name: db-secret
type: Opaque
stringData:
  DB_USER: "admin"
  DB_PASSWORD: "s3cr3t"
```

Из CLI:

```bash
kubectl create secret generic db-secret \
  --from-literal=DB_USER=admin \
  --from-literal=DB_PASSWORD=s3cr3t
```

Посмотреть **значение**:

```bash
kubectl get secret db-secret -o jsonpath='{.data.DB_PASSWORD}' | base64 -d
```

## Как использовать в Pod

### Как переменные окружения

```yaml
spec:
  containers:
    - name: app
      image: my-app:1.0
      env:
        - name: GREETING
          valueFrom:
            configMapKeyRef:
              name: app-config
              key: GREETING
        - name: DB_PASSWORD
          valueFrom:
            secretKeyRef:
              name: db-secret
              key: DB_PASSWORD
      envFrom:
        - configMapRef:
            name: app-config         # все ключи как ENV
        - secretRef:
            name: db-secret
```

### Как файлы (volumes)

```yaml
spec:
  containers:
    - name: app
      image: my-app:1.0
      volumeMounts:
        - name: config
          mountPath: /etc/app
        - name: tls
          mountPath: /etc/tls
          readOnly: true
  volumes:
    - name: config
      configMap:
        name: app-config             # каждый ключ -> отдельный файл
    - name: tls
      secret:
        secretName: tls-secret
```

В контейнере появятся файлы `/etc/app/GREETING`, `/etc/app/app.properties` и т.д.

## Когда что использовать

| Хочу | Что взять |
|------|-----------|
| Открытые настройки приложения | **ConfigMap** |
| Пароли / токены / ключи | **Secret** |
| Подкладывать целый файл (nginx.conf, application.properties) | ConfigMap или Secret через **volume** |
| Передавать env переменные | **env / envFrom** из ConfigMap или Secret |

## Особенности

- **Изменение** ConfigMap/Secret само по себе **не пересоздаёт** Pod. ENV-переменные читаются на старте контейнера. Файлы из volume обновятся в файловой системе пода с задержкой (обычно ~минута), но процессу всё равно надо их перечитать.
- Для гарантированного обновления приложения часто делают **rollout restart**:
  ```bash
  kubectl rollout restart deploy/web
  ```
- Имя секрета/CM **должно существовать** в том же namespace, где запускается Pod.

## Полезные команды

```bash
kubectl get cm
kubectl describe cm app-config
kubectl get secret
kubectl describe secret db-secret      # значения скрыты
kubectl get secret db-secret -o yaml   # увидите base64
```
