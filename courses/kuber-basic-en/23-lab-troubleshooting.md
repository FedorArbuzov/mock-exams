# 23. Lab: Troubleshooting

In this lab you'll deliberately break the cluster and practice diagnosing it through events and logs.

## Setup

```bash
kubectl create namespace lab-tshoot
kubectl config set-context --current --namespace=lab-tshoot
```

## Scenario 1. A typo in the image name

Manifest:

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
          image: nginxx:1.27        # <-- typo
          ports: [{ containerPort: 80 }]
```

Apply it and diagnose:

```bash
kubectl apply -f case1.yaml
kubectl get pods -l app=web
kubectl describe pod -l app=web
```

**Task:** find what's wrong by reading the **Events** section at the bottom of the `describe` output. Fix the image to `nginx:1.27` and apply again.

**Expected answer:** `ImagePullBackOff`, with a `Failed to pull image` event.

## Scenario 2. CrashLoopBackOff

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
kubectl describe pod crash
```

**Task:** explain how `CrashLoopBackOff` differs from `Error`/`Completed`, and why you need `--previous` here.

## Scenario 3. A Service with no Endpoints

A perfectly healthy Deployment labeled `app=web`, but a Service with a different selector:

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
  selector: { app: nope }       # <-- doesn't match
  ports: [{ port: 80, targetPort: 80 }]
```

Diagnose it:

```bash
kubectl get pods -l app=web
kubectl get endpoints web
kubectl describe svc web
```

**Task:** explain why `endpoints web` is empty, and fix the selector.

## Scenario 4. A Pod stuck Pending because of resources

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
kubectl describe pod huge
```

**Task:** find the `FailedScheduling` event, then bring `requests.memory` down to something reasonable (`128Mi`).

## Scenario 5. A readinessProbe that never passes

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
        httpGet: { path: /healthz, port: 80 }       # <-- this path doesn't exist
        initialDelaySeconds: 1
        periodSeconds: 2
```

```bash
kubectl apply -f case5.yaml
kubectl get pod notready
kubectl describe pod notready
```

**Task:** work out why it's stuck at `READY 0/1`, then fix the path to `/` (which nginx actually serves).

## Scenario 6. DNS inside the cluster

Bring up a working `web` Service. From a throwaway Pod, check name resolution:

```bash
kubectl run tmp --rm -it --image=busybox:1.36 --restart=Never -- sh
# inside:
nslookup web
nslookup web.lab-tshoot
nslookup web.lab-tshoot.svc.cluster.local
wget -qO- http://web
```

**Task:** confirm that the short name only resolves within the same namespace, while the fully-qualified name resolves from anywhere.

## Scenario 7. kubectl debug

Create a Pod running `nginx:1.27`. Imagine, for the sake of this exercise, that it's a minimal image with no shell or debugging tools baked in (the real `nginx:1.27` image does actually have `sh`/`curl`/`bash`, but the workflow below is exactly what you'd use on a genuinely minimal or distroless image where those tools are missing):

```bash
kubectl run web-debug --image=nginx:1.27
kubectl debug -it web-debug --image=busybox:1.36 --target=web-debug
# inside:
ps aux
wget -qO- localhost:80
```

**Task:** confirm the ephemeral debug container can see the main container's processes through `--target`.

## Cleanup

```bash
kubectl config set-context --current --namespace=default
kubectl delete ns lab-tshoot
```

## Check yourself

1. How is `kubectl logs` different from `kubectl logs --previous`?
2. What does "empty Endpoints" mean, and what are 2–3 things that can cause it?
3. What's the fastest single command to see "what happened in this namespace in the last 5 minutes"?
