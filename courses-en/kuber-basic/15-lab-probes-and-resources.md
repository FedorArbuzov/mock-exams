# 15. Lab: Probes and Resources

The goal: see liveness and readiness actually do something, and watch how Pods behave under resource limits.

> **Before starting:** see [ENVIRONMENT.md](ENVIRONMENT.md). Install metrics-server if you have not already.

> **Interactive check.** Open this lesson in the courses UI (http://127.0.0.1:8091/). Use the **Interactive lab** panel. This lab is mostly observational (probes, OOM, QoS), so the auto-check is light: **Task 1** — Pod `ready-demo` exists, uses `nginx:1.27`, and is Running (its readiness you toggle by hand in the lab). **Cleanup** removes all the demo Pods.

## Setup

Install metrics-server so `kubectl top` works (see [ENVIRONMENT.md](ENVIRONMENT.md)):

```bash
kubectl apply -f https://github.com/kubernetes-sigs/metrics-server/releases/latest/download/components.yaml
# If kubectl top stays empty on Docker Desktop, also apply the kubelet-insecure-tls patch from ENVIRONMENT.md
```

## Task 1. readinessProbe

Use this `ready-demo.yaml` example (you can tweak delays/periods):

```yaml
apiVersion: v1
kind: Pod
metadata:
  name: ready-demo
  labels:
    app: ready
spec:
  containers:
    - name: web
      image: nginx:1.27
      ports:
        - containerPort: 80
      readinessProbe:
        exec:
          command: ["sh", "-c", "[ -f /tmp/ready ]"]
        initialDelaySeconds: 1
        periodSeconds: 2
```

```bash
kubectl apply -f ready-demo.yaml
kubectl get pod ready-demo -w
```

**What you'll see:** `READY 0/1` — the readinessProbe keeps failing because `/tmp/ready` doesn't exist yet.

Now "get it ready":

```bash
kubectl exec ready-demo -- touch /tmp/ready
kubectl get pod ready-demo
```

**Check:** within a few seconds, `READY 1/1`.

## Task 2. livenessProbe and restarts

Use this `live-demo.yaml` example:

```yaml
apiVersion: v1
kind: Pod
metadata:
  name: live-demo
spec:
  containers:
    - name: app
      image: busybox:1.36
      command: ["sh", "-c", "touch /tmp/healthy; sleep 30; rm /tmp/healthy; sleep 600"]
      livenessProbe:
        exec:
          command: ["test", "-f", "/tmp/healthy"]
        initialDelaySeconds: 5
        periodSeconds: 5
        failureThreshold: 2
```

```bash
kubectl apply -f live-demo.yaml
kubectl get pod live-demo -w
```

**What you'll see:** after roughly 40 seconds, `RESTARTS` starts climbing — the liveness check is failing and the container keeps getting restarted.

```bash
kubectl describe pod live-demo
```

Scroll down to the **Events** section at the bottom of the output — that's where the restarts and probe failures show up.

## Task 3. Resources and Pending

Use this `big.yaml` example (or choose any similarly too-large request):

```yaml
apiVersion: v1
kind: Pod
metadata:
  name: big
spec:
  containers:
    - name: web
      image: nginx:1.27
      resources:
        requests:
          memory: "100Gi"
```

```bash
kubectl apply -f big.yaml
kubectl get pod big
kubectl describe pod big
```

**Check:** the Pod sits in `Pending`, with a `FailedScheduling` event in the **Events** section. Delete it once you've seen it.

## Task 4. OOMKilled

Use this `hungry.yaml` example:

```yaml
apiVersion: v1
kind: Pod
metadata:
  name: hungry
spec:
  containers:
    - name: app
      image: polinux/stress
      resources:
        requests:
          memory: "32Mi"
        limits:
          memory: "64Mi"
      command: ["stress"]
      args: ["--vm", "1", "--vm-bytes", "200M", "--vm-hang", "1"]
```

```bash
kubectl apply -f hungry.yaml
kubectl get pod hungry -w
kubectl describe pod hungry
```

**What you'll see:** look at `Last State` and the events near the bottom — `OOMKilled`, and the container gets restarted.

Delete it once you're done.

## Task 5. QoS classes

Create three Pods named `best-effort`, `burstable`, and `guaranteed` (lesson 14 defines each QoS class). You can use any minimal image (for example `busybox:1.36` with `sleep 3600`):

- **best-effort** — no `resources` at all.
- **burstable** — set `requests` only (or limits higher than requests).
- **guaranteed** — `requests` **equal** `limits` for both CPU and memory.

Check the class assigned to each:

```bash
# bash / zsh
for p in best-effort burstable guaranteed; do
  echo "$p: $(kubectl get pod $p -o jsonpath='{.status.qosClass}')"
done
```

```powershell
# PowerShell
foreach ($p in @('best-effort', 'burstable', 'guaranteed')) {
  $class = kubectl get pod $p -o jsonpath='{.status.qosClass}'
  Write-Host "$p`: $class"
}
```

**Check:** `BestEffort`, `Burstable`, and `Guaranteed`, respectively.

## Task 6. Metrics

```bash
kubectl top node
kubectl top pod -A
```

**Check:** you see actual CPU/memory usage. If it complains that metrics aren't available yet, wait a minute and try again.

## Cleanup

```bash
kubectl delete pod ready-demo live-demo big hungry best-effort burstable guaranteed --ignore-not-found
```

## Check yourself

1. What's the practical difference between a failed livenessProbe and a failed readinessProbe?
2. Why does `requests` matter more than `limits` for **scheduling**?
3. What QoS class does a Pod get if you don't set `resources` at all? Why is that not great?
