# 18. Lab: CPU-based HPA

## Setup

```bash
kubectl top nodes      # metrics-server must be working
kubectl create namespace lab-hpa
kubectl config set-context --current --namespace=lab-hpa
```

## Task 1. Deploy an application with requests

`web.yaml`:

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: web
spec:
  replicas: 1
  selector:
    matchLabels: { app: web }
  template:
    metadata:
      labels: { app: web }
    spec:
      containers:
        - name: app
          image: registry.k8s.io/hpa-example
          ports:
            - containerPort: 80
          resources:
            requests:
              cpu: 100m
              memory: 64Mi
            limits:
              cpu: 500m
              memory: 128Mi
---
apiVersion: v1
kind: Service
metadata:
  name: web
spec:
  selector: { app: web }
  ports:
    - port: 80
      targetPort: 80
```

```bash
kubectl apply -f web.yaml
kubectl rollout status deploy/web
kubectl top pod -l app=web
```

`registry.k8s.io/hpa-example` is a tiny php-apache that burns CPU on each HTTP request. Ideal for demonstrating HPA.

## Task 2. Create an HPA

```bash
kubectl autoscale deploy web --cpu-percent=50 --min=1 --max=5
kubectl get hpa
kubectl describe hpa web | grep -A2 "Min replicas\|Max replicas\|Targets"
```

Alternatively — via a manifest:

```yaml
apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata: { name: web }
spec:
  scaleTargetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: web
  minReplicas: 1
  maxReplicas: 5
  metrics:
    - type: Resource
      resource:
        name: cpu
        target:
          type: Utilization
          averageUtilization: 50
```

## Task 3. Apply load

In a separate tab:

```bash
kubectl run -it --rm load --image=busybox --restart=Never -- sh -c \
  "while true; do wget -qO- http://web; done"
```

In the first tab:

```bash
kubectl get hpa web -w
```

**What you'll see** (after ~1–2 minutes):

```text
NAME   REFERENCE        TARGETS    MINPODS   MAXPODS   REPLICAS
web    Deployment/web   180%/50%   1         5         1
web    Deployment/web   180%/50%   1         5         3       ← scale up
web    Deployment/web   60%/50%    1         5         3
web    Deployment/web   60%/50%    1         5         4
web    Deployment/web   45%/50%    1         5         4
```

HPA saw that utilization was 180% of the target = 50% and raised the replica count until it came down to ~50%.

## Task 4. Remove the load

In the tab with `load`, press Ctrl+C → exit.

In the first tab `kubectl get hpa web -w`:

```text
web    Deployment/web   2%/50%     1   5   4    ← still 4
... (5 minutes)
web    Deployment/web   2%/50%     1   5   1    ← scale down
```

**What you noticed:** scale-down happens **with a delay**. By default this is 5 minutes (`stabilizationWindowSeconds: 300`). This is protection against "flapping".

## Task 5. Change the behavior

Replace the HPA with a manifest that has an explicit behavior:

```yaml
apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata: { name: web }
spec:
  scaleTargetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: web
  minReplicas: 1
  maxReplicas: 5
  metrics:
    - type: Resource
      resource:
        name: cpu
        target:
          type: Utilization
          averageUtilization: 50
  behavior:
    scaleUp:
      stabilizationWindowSeconds: 0
      policies:
        - type: Percent
          value: 100
          periodSeconds: 15
    scaleDown:
      stabilizationWindowSeconds: 30
      policies:
        - type: Pods
          value: 1
          periodSeconds: 30
```

```bash
kubectl apply -f hpa.yaml
```

Apply the load again, then remove it. **What you'll see:** scale-down now starts after 30 seconds, and by 1 pod every 30 seconds. It's slower, but smoother.

## Task 6. What happens without requests

Remove the `resources` block from `web.yaml`:

```bash
kubectl set env deploy/web PLACEHOLDER=    # trigger a restart
kubectl edit deploy/web                    # delete resources by hand
```

```bash
kubectl describe hpa web | tail -20
```

**What you'll see:** the following appears in the HPA Events:

```text
FailedGetResourceMetric: missing request for cpu
```

HPA cannot compute utilization without `requests`. Put the resources block back.

## Cleanup

```bash
kubectl delete namespace lab-hpa
kubectl config set-context --current --namespace=default
```

## Self-check questions

1. What must be present on the Deployment for CPU-based HPA to work?
2. Why is minReplicas needed if the maximum is 5 replicas?
3. How does HPA compute the desired number of replicas? (the formula)
4. What happens to the metric 5 minutes after the load is removed, if `stabilizationWindowSeconds: 300`?
5. How do you make it "scale up aggressively, scale down smoothly"?
