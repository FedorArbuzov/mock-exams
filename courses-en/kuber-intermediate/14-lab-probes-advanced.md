# 14. Lab: bring a "broken" application to Ready

We'll work with an application that **takes a long time to start** (20 seconds) and then responds reliably. Without correct probes it ends up in `CrashLoopBackOff`.

## Setup

```bash
kubectl create namespace lab-probes
kubectl config set-context --current --namespace=lab-probes
```

## Task 1. Deploy a "blind" application

`flaky.yaml`:

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: flaky
spec:
  replicas: 1
  selector:
    matchLabels:
      app: flaky
  template:
    metadata:
      labels:
        app: flaky
    spec:
      containers:
        - name: app
          image: busybox
          ports:
            - containerPort: 8080
          command:
            - sh
            - -c
            - |
              echo "starting, will be ready in 20s..."
              sleep 20
              echo "ready"
              while true; do
                printf 'HTTP/1.1 200 OK\r\nContent-Length: 2\r\n\r\nok' | nc -l -p 8080
              done
          livenessProbe:
            httpGet:
              path: /
              port: 8080
            periodSeconds: 5
            failureThreshold: 2
```

```bash
kubectl apply -f flaky.yaml
kubectl get pods -l app=flaky -w
```

**What you'll see:** the pod lives ~10 seconds and moves to `CrashLoopBackOff`. Liveness starts probing right after startup, the application isn't listening on the port yet, two failures — and kubelet restarts the container. Forever.

`kubectl describe pod -l app=flaky | tail -20` will show:

```text
Liveness probe failed: dial tcp ...:8080: connect: connection refused
Container app failed liveness probe, will be restarted
```

## Task 2. Add a startupProbe

This is the correct fix. Open the deployment:

```bash
kubectl edit deploy flaky
```

And add to `containers[0]` before `livenessProbe`:

```yaml
startupProbe:
  tcpSocket:
    port: 8080
  failureThreshold: 30        # 30 attempts
  periodSeconds: 1            # = up to 30 seconds
```

Save. The pod is recreated.

Alternative via `kubectl patch` (or just recreate via `kubectl apply -f` with the updated YAML).

```bash
kubectl get pods -l app=flaky -w
```

**What you'll see:** the pod stays in `Running 0/1`, then moves to `Running 1/1` after about 20 seconds. CrashLoopBackOff no longer happens.

```bash
kubectl describe pod -l app=flaky | grep -A2 "Probes\|Probe"
```

## Task 3. Add a readinessProbe

Right now the application is marked `Ready` as soon as startup passes. Let's add an explicit readiness so the difference is visible. In `kubectl edit`:

```yaml
readinessProbe:
  httpGet:
    path: /
    port: 8080
  periodSeconds: 5
  failureThreshold: 3
```

Save and wait. Then look at the Service's endpoints (if there were one) — readiness does nothing visible without a Service. Let's create one:

```bash
kubectl expose deploy flaky --port=8080
kubectl get endpoints flaky -w
```

In a separate terminal, "break" the application — kill the nc loop inside the container:

```bash
kubectl exec deploy/flaky -- sh -c 'pkill nc'
```

**What you'll see:** after 15 seconds (3 failed × 5 sec period) the pod disappears from endpoints (readiness status = false). After another 10 seconds (2 failed × 5 = liveness), kubelet restarts the container.

After the restart, the startupProbe again gives 30 seconds to spin up, then everything returns to Ready.

## Task 4. preStop hook

Right now, when a pod is deleted, traffic can "drop" — endpoints are updated asynchronously. Let's add `preStop`:

```yaml
lifecycle:
  preStop:
    exec:
      command: ["sh", "-c", "sleep 15"]
```

And give it a larger grace period:

```yaml
terminationGracePeriodSeconds: 30
```

Run `kubectl rollout restart deploy/flaky` and watch:

```bash
kubectl get pods -l app=flaky -w
```

**What you'll see:** the old pod goes to `Terminating` and **holds for 15 seconds** before the real shutdown. kube-proxy uses this window to remove it from endpoints before the process exits. In a real application this saves in-flight requests.

## Task 5. Experiment with liveness that breaks on a dependency

Replace the livenessProbe with one that "checks a nonexistent external service":

```yaml
livenessProbe:
  exec:
    command: ["sh", "-c", "wget -qO- --timeout=2 http://no-such-service && exit 0 || exit 1"]
  periodSeconds: 5
  failureThreshold: 2
```

Apply and wait.

**What you'll see:** the container starts restarting every ~10 seconds, even though the application itself is healthy. This is exactly the "liveness knows about dependencies" antipattern. Roll it back.

## Cleanup

```bash
kubectl delete namespace lab-probes
kubectl config set-context --current --namespace=default
```

## Self-check questions

1. When is a startupProbe mandatory?
2. What happens if you remove startup and keep only liveness with `initialDelaySeconds: 30`?
3. In what case does a preStop hook actually save something?
4. What failure threshold would you set on readiness in prod if the period is 10 seconds, and why?
