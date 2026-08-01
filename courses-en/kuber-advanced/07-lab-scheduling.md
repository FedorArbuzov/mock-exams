# 07. Lab: scheduling on minikube

## Preparation

```bash
kubectl create namespace lab-sched
kubectl config set-context --current --namespace=lab-sched
kubectl label node minikube node-role=worker --overwrite
kubectl label node minikube topology.kubernetes.io/zone=zone-a --overwrite
```

Optional — a second node (if you have enough RAM):

```bash
minikube node add -p mock-exams --worker
kubectl label node mock-exams-m02 topology.kubernetes.io/zone=zone-b --overwrite
kubectl label node mock-exams-m02 node-role=worker --overwrite
kubectl get nodes --show-labels | grep zone
```

## Task 1. nodeSelector

```yaml
apiVersion: v1
kind: Pod
metadata: { name: needs-ssd }
spec:
  nodeSelector: { disktype: ssd }
  containers:
    - name: c
      image: nginx:1.27-alpine
```

```bash
kubectl apply -f needs-ssd.yaml   # Pending — no label
kubectl label node minikube disktype=ssd
kubectl get pod needs-ssd -w      # Running
```

## Task 2. Taint + Toleration

```bash
kubectl taint nodes minikube dedicated=app:NoSchedule
```

```yaml
apiVersion: v1
kind: Pod
metadata: { name: no-toleration }
spec:
  containers: [{ name: c, image: busybox, command: ["sleep","3600"] }]
---
apiVersion: v1
kind: Pod
metadata: { name: with-toleration }
spec:
  tolerations:
    - key: dedicated
      operator: Equal
      value: app
      effect: NoSchedule
  containers: [{ name: c, image: busybox, command: ["sleep","3600"] }]
```

**What you'll see:** `no-toleration` — Pending, `with-toleration` — Running.

```bash
kubectl taint nodes minikube dedicated=app:NoSchedule-
```

## Task 3. podAntiAffinity

```yaml
apiVersion: apps/v1
kind: Deployment
metadata: { name: web }
spec:
  replicas: 3
  selector: { matchLabels: { app: web } }
  template:
    metadata: { labels: { app: web } }
    spec:
      affinity:
        podAntiAffinity:
          requiredDuringSchedulingIgnoredDuringExecution:
            - labelSelector:
                matchLabels: { app: web }
              topologyKey: kubernetes.io/hostname
      containers:
        - name: c
          image: nginx:1.27-alpine
```

On a **single** node:

```bash
kubectl apply -f web.yaml
kubectl get pods -l app=web
```

**What you'll see:** only **1** pod Running, the rest Pending (anti-affinity won't allow a 2nd on the same node).

On **two** nodes — 2 Running, 1 Pending. On three — all 3.

## Task 4. topologySpreadConstraints

```yaml
apiVersion: apps/v1
kind: Deployment
metadata: { name: spread }
spec:
  replicas: 4
  selector: { matchLabels: { app: spread } }
  template:
    metadata: { labels: { app: spread } }
    spec:
      topologySpreadConstraints:
        - maxSkew: 1
          topologyKey: topology.kubernetes.io/zone
          whenUnsatisfiable: DoNotSchedule
          labelSelector: { matchLabels: { app: spread } }
      containers:
        - name: c
          image: nginx:1.27-alpine
```

```bash
kubectl apply -f spread.yaml
kubectl get pods -l app=spread -o wide
```

**What you'll see:** pods distributed across zones (on 2 nodes — 2 in each zone).

## Task 5. Cordon and drain (CKA)

```bash
kubectl cordon minikube
kubectl get node minikube    # SchedulingDisabled
kubectl uncordon minikube
```

## Cleanup

```bash
kubectl delete namespace lab-sched
kubectl label node minikube disktype- node-role- topology.kubernetes.io/zone- 2>/dev/null
kubectl config set-context --current --namespace=default
```

## Self-check questions

1. Why do 3 replicas with anti-affinity on hostname give only 1 Running on a single node?
2. How do you remove a taint?
3. How does cordon differ from drain?
