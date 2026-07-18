# 6. Writing Pods in YAML

## The smallest possible Pod

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

Save this as `pod.yaml` and apply it:

```bash
kubectl apply -f pod.yaml
kubectl get pods
kubectl describe pod nginx
```

Delete it:

```bash
kubectl delete -f pod.yaml
# or
kubectl delete pod nginx
```

## A slightly more realistic Pod

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

What's new here:

- **labels** — the tags other objects (Services, ReplicaSets) use to find this Pod through a selector.
- **env** — environment variables passed into the container.
- **resources.requests/limits** — how much CPU/memory we're asking for, and the ceiling we'll allow.
- **readinessProbe** — the Pod only counts as ready (`READY 1/1`) once the HTTP check succeeds.

## Multiple containers in one Pod

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

These two containers can see each other over `localhost` and can share volumes.

## A few handy tricks

**Generate a YAML template:**

```bash
kubectl run nginx --image=nginx:1.27 --dry-run=client -o yaml > pod.yaml
```

**Apply and watch it come up:**

```bash
kubectl apply -f pod.yaml
kubectl get pods -w   # -w keeps watching for changes
```

**Pull the live YAML of a running Pod:**

```bash
kubectl get pod nginx -o yaml
```

## Things to avoid in production

- A bare Pod with no Deployment/ReplicaSet behind it — it won't come back if it dies.
- Hardcoding a node name or a host port unless you genuinely need to.
- Putting secrets in `env: value:` directly — that's what **Secret** objects are for.
