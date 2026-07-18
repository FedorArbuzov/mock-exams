# 13. Lab: ConfigMap and Secret

The goal: pull config and secrets out of the image, feeding them in through both environment variables and files.

## Setup

```bash
kubectl create namespace lab-cs
kubectl config set-context --current --namespace=lab-cs
```

You'll switch back to `default` and delete the namespace at the end.

## Task 1. ConfigMap

Create a ConfigMap called `app-config`:

```bash
kubectl create configmap app-config \
  --from-literal=GREETING=hello \
  --from-literal=LOG_LEVEL=info
kubectl get cm app-config -o yaml
```

**Check:** both keys show up under `data:`.

## Task 2. A Pod reading the ConfigMap as environment variables

`pod-env.yaml`:

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

**Check:** the logs show `GREETING=hello` and `LOG_LEVEL=info`.

## Task 3. ConfigMap as files

Create a ConfigMap that acts like a file:

```bash
kubectl create configmap nginx-page --from-literal=index.html='<h1>Hello from CM</h1>'
```

A Pod that mounts it into `/usr/share/nginx/html`:

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

Check it:

```bash
kubectl apply -f pod-cm.yaml
kubectl exec nginx-cm -- cat /usr/share/nginx/html/index.html
kubectl port-forward pod/nginx-cm 8080:80
# in another terminal:
curl -s localhost:8080
```

**Check:** you get back `<h1>Hello from CM</h1>`.

## Task 4. Secret through an environment variable

```bash
kubectl create secret generic db-secret \
  --from-literal=DB_USER=admin \
  --from-literal=DB_PASSWORD=s3cr3t
```

A Pod that reads the password:

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

**Check:** the logs contain the line `admin:s3cr3t`.

## Task 5. What's actually stored in a Secret

```bash
kubectl get secret db-secret -o yaml
```

Find the `data.DB_PASSWORD` field, and decode it:

```bash
# Linux/macOS
kubectl get secret db-secret -o jsonpath='{.data.DB_PASSWORD}' | base64 -d

# PowerShell
$b = kubectl get secret db-secret -o jsonpath='{.data.DB_PASSWORD}'
[System.Text.Encoding]::UTF8.GetString([System.Convert]::FromBase64String($b))
```

**Worth remembering:** a Secret is stored **base64-encoded**, not encrypted. It's not really "secret" — it's just a separate category with tighter RBAC around it.

## Task 6. Editing a ConfigMap and the rollout that follows

1. Change the value in `app-config`:
   ```bash
   kubectl create configmap app-config --from-literal=GREETING=hi --from-literal=LOG_LEVEL=debug -o yaml --dry-run=client | kubectl apply -f -
   ```
2. Check inside the `env-demo` Pod:
   ```bash
   kubectl exec env-demo -- env | grep GREETING
   ```

**What you'll see:** the old value. Environment variables are read exactly once, when the container starts.

3. Restart the container (delete the Pod, or — for a Deployment — `kubectl rollout restart`).

## Cleanup

```bash
kubectl delete pod env-demo nginx-cm secret-demo --ignore-not-found
kubectl delete cm app-config nginx-page --ignore-not-found
kubectl delete secret db-secret --ignore-not-found
kubectl config set-context --current --namespace=default
kubectl delete ns lab-cs
```

## Check yourself

1. What's the difference between `env` and `envFrom`?
2. Why doesn't "Secret" in Kubernetes mean "encrypted"? What would you need for actual encryption?
3. What happens to an already-running Pod if you change a ConfigMap that's mounted as a volume?
