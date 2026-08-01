# 12. ConfigMap and Secret

## Why this matters

Config and secrets shouldn't live **inside the image** — otherwise you'd need to rebuild the container for every environment. Kubernetes gives you two objects for this:

- **ConfigMap** — ordinary values (URLs, feature flags, config files).
- **Secret** — passwords, tokens, keys. Stored **base64-encoded** (that's **not** encryption, just encoding), and the object type usually comes with stricter RBAC around it.

> Important: **Secrets are not encrypted by default.** To actually encrypt them at rest in etcd, you need to configure **encryption at rest** at the cluster level, or keep secrets in an external manager (Vault, AWS Secrets Manager, etc.). For hands-on Vault + **Kubernetes auth**, see [secrets-basic/10-kubernetes-vault](../secrets-basic/10-kubernetes-vault.md) ([`deploy/vault`](../../deploy/vault/README.md)).

## ConfigMap: what's inside

Key-value pairs. Values can be short strings or entire files.

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

Creating one from the CLI:

```bash
kubectl create configmap app-config \
  --from-literal=GREETING=Hello \
  --from-literal=LOG_LEVEL=info

kubectl create configmap nginx-conf --from-file=./default.conf
```

## Secret: what's inside

Structurally similar, but the values under `data` are already base64-encoded. You can also use `stringData`, and kubectl encodes it for you.

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

From the CLI:

```bash
kubectl create secret generic db-secret \
  --from-literal=DB_USER=admin \
  --from-literal=DB_PASSWORD=s3cr3t
```

Reading back the actual **value**:

```bash
# bash / zsh
kubectl get secret db-secret -o jsonpath='{.data.DB_PASSWORD}' | base64 -d

# PowerShell
$b = kubectl get secret db-secret -o jsonpath='{.data.DB_PASSWORD}'
[System.Text.Encoding]::UTF8.GetString([System.Convert]::FromBase64String($b))
```

## Using them inside a Pod

### As environment variables

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
            name: app-config         # every key becomes an env var
        - secretRef:
            name: db-secret
```

### As files (volumes)

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
        name: app-config             # each key becomes its own file
    - name: tls
      secret:
        secretName: tls-secret
```

Inside the container you'll now have files like `/etc/app/GREETING`, `/etc/app/app.properties`, and so on.

## Which one to reach for

| You want | Use |
|------|-----------|
| Plain application settings | **ConfigMap** |
| Passwords / tokens / keys | **Secret** |
| To mount a whole file (nginx.conf, application.properties) | ConfigMap or Secret via a **volume** |
| To pass environment variables | **env / envFrom**, sourced from a ConfigMap or Secret |

## A few things to know

- **Editing** a ConfigMap or Secret doesn't recreate the Pod on its own. Environment variables are read once, at container startup. Files mounted from a volume do eventually update on disk (usually within about a minute), but the running process still has to notice and re-read them.
- To force an update, teams often just do a **rollout restart**:
  ```bash
  kubectl rollout restart deploy/web
  ```
- The ConfigMap/Secret name **has to exist** in the same namespace as the Pod that references it.

## Commands worth knowing

```bash
kubectl get cm
kubectl describe cm app-config
kubectl get secret
kubectl describe secret db-secret      # values are hidden
kubectl get secret db-secret -o yaml   # you'll see the base64
```
