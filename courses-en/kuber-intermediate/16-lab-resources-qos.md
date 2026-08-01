# 16. Lab: experiment with resources, QoS, and eviction

## Setup

You need `metrics-server` enabled (it's brought up by `mockctl up`). Let's check:

```bash
kubectl top nodes
kubectl top pods -A | head
```

If there's an error — `minikube -p mock-exams addons enable metrics-server` and wait a minute.

```bash
kubectl create namespace lab-qos
kubectl config set-context --current --namespace=lab-qos
```

## Task 1. Three QoS classes

Let's apply three pods with different settings at once.

`qos-pods.yaml`:

```yaml
apiVersion: v1
kind: Pod
metadata: { name: qos-besteffort }
spec:
  restartPolicy: Never
  containers:
    - name: c
      image: busybox
      command: ["sleep", "3600"]
---
apiVersion: v1
kind: Pod
metadata: { name: qos-burstable }
spec:
  restartPolicy: Never
  containers:
    - name: c
      image: busybox
      command: ["sleep", "3600"]
      resources:
        requests:  { cpu: 50m,  memory: 32Mi }
        limits:    { cpu: 100m, memory: 64Mi }
---
apiVersion: v1
kind: Pod
metadata: { name: qos-guaranteed }
spec:
  restartPolicy: Never
  containers:
    - name: c
      image: busybox
      command: ["sleep", "3600"]
      resources:
        requests:  { cpu: 50m, memory: 32Mi }
        limits:    { cpu: 50m, memory: 32Mi }
```

```bash
kubectl apply -f qos-pods.yaml
sleep 3
for p in qos-besteffort qos-burstable qos-guaranteed; do
  printf '%-18s %s\n' "$p" "$(kubectl get pod $p -o jsonpath='{.status.qosClass}')"
done
```

**What you'll see:**

```text
qos-besteffort     BestEffort
qos-burstable      Burstable
qos-guaranteed     Guaranteed
```

## Task 2. OOMKilled

`oom.yaml`:

```yaml
apiVersion: v1
kind: Pod
metadata: { name: oom-test }
spec:
  restartPolicy: OnFailure
  containers:
    - name: hog
      image: polinux/stress
      command: ["stress"]
      args: ["--vm", "1", "--vm-bytes", "200M", "--vm-keep", "--timeout", "30s"]
      resources:
        requests:  { memory: 64Mi, cpu: 50m }
        limits:    { memory: 128Mi, cpu: 100m }
```

```bash
kubectl apply -f oom.yaml
kubectl get pod oom-test -w
```

**What you'll see:** the pod goes `Running` → `Error` (OOMKilled) → restart several times. Via `kubectl describe`:

```text
Last State: Terminated
  Reason:    OOMKilled
  Exit Code: 137
```

`stress` tries to allocate 200 MB RSS, but `limits.memory: 128Mi` doesn't allow it. The kernel kills the process. kubelet restarts it.

## Task 3. CPU throttling — not a kill

`cpu-hog.yaml`:

```yaml
apiVersion: v1
kind: Pod
metadata: { name: cpu-hog }
spec:
  restartPolicy: Never
  containers:
    - name: hog
      image: polinux/stress
      command: ["stress", "--cpu", "2", "--timeout", "60s"]
      resources:
        requests: { cpu: 100m, memory: 32Mi }
        limits:   { cpu: 200m, memory: 64Mi }
```

```bash
kubectl apply -f cpu-hog.yaml
sleep 5
kubectl top pod cpu-hog
```

**What you'll see:** the pod tries to consume 2 CPU, but actually uses ~200m (the limits cap). This is **throttling** — the program doesn't crash, it waits for quanta.

```bash
kubectl describe pod cpu-hog | grep -A2 State
```

State `Running`, no kill signals.

## Task 4. Pending due to insufficient resources

Find out how much CPU there is in the node in total:

```bash
kubectl describe node $(kubectl get nodes -o name | head -1) | grep -A4 "Allocatable\|Allocated"
```

Create a pod that requests knowingly more:

`giant.yaml`:

```yaml
apiVersion: v1
kind: Pod
metadata: { name: giant }
spec:
  restartPolicy: Never
  containers:
    - name: c
      image: busybox
      command: ["sleep", "3600"]
      resources:
        requests:
          cpu: "20"
          memory: 16Gi
```

```bash
kubectl apply -f giant.yaml
kubectl get pod giant
kubectl describe pod giant | grep -A5 Events
```

**What you'll see:** the pod is `Pending`, and in Events:

```text
0/1 nodes are available: Insufficient cpu, Insufficient memory.
```

Reduce `requests` to feasible values and confirm that the pod moved to `Running`.

## Task 5. ResourceQuota

```yaml
apiVersion: v1
kind: ResourceQuota
metadata: { name: q }
spec:
  hard:
    requests.cpu: "500m"
    requests.memory: 512Mi
    pods: "5"
```

```bash
kubectl apply -f resourcequota.yaml
kubectl describe quota q
```

Create 6 identical pods with `requests.cpu: 100m` — the last one won't go through:

```bash
for i in $(seq 1 6); do
  kubectl run small-$i --image=busybox --restart=Never \
    --overrides='{"spec":{"containers":[{"name":"c","image":"busybox","command":["sleep","3600"],"resources":{"requests":{"cpu":"100m","memory":"32Mi"}}}]}}' \
    -- sleep 3600 || echo "small-$i blocked"
done
```

**What you'll see:** `pods: 5/5` or `requests.cpu: 500m/500m` — the next creation fails with `exceeded quota`.

## Task 6. LimitRange — defaults

```yaml
apiVersion: v1
kind: LimitRange
metadata: { name: defaults }
spec:
  limits:
    - type: Container
      default:        { cpu: 200m, memory: 256Mi }
      defaultRequest: { cpu: 100m, memory: 128Mi }
```

```bash
kubectl apply -f limitrange.yaml
kubectl run no-resources --image=busybox -- sleep 3600
kubectl get pod no-resources -o jsonpath='{.spec.containers[0].resources}'
```

**What you'll see:** a pod that didn't specify resources got them **from the LimitRange defaults**. This is "protection against accidentally being BestEffort".

## Cleanup

```bash
kubectl delete namespace lab-qos
kubectl config set-context --current --namespace=default
```

## Self-check questions

1. What QoS does a pod with `requests=limits` for CPU **and** memory get?
2. What happens to a container when it exceeds `limits.cpu`? `limits.memory`?
3. How does `LimitRange` differ from `ResourceQuota`?
4. What status will a pod be in if it requested more resources than the node has?
5. When should you set `limits == requests` in production?
