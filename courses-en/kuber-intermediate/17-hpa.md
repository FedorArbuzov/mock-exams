# 17. HorizontalPodAutoscaler (HPA)

## What and why

`HorizontalPodAutoscaler` is a controller that **changes the number of replicas** of a Deployment / StatefulSet / ReplicaSet depending on metrics. "More load — spin up more pods; load dropped — remove the extras."

Unlike `VerticalPodAutoscaler` (VPA), which changes `requests`/`limits` **inside** a pod, HPA changes the **number of pods**. This is what people usually mean by "autoscaling".

## How it works

Every 15 seconds (by default) HPA:

1. Fetches the current metric (for example, the average CPU utilization of the pods).
2. Computes: `desiredReplicas = ceil(currentReplicas × currentValue / targetValue)`.
3. Compares it against the `min`/`max` bounds.
4. If it changed — updates `replicas` in the Deployment.

Example: 4 pods, average CPU = 80%, target = 50%. `desired = ceil(4 × 80 / 50) = 7`. Now there are 7 replicas.

## What it needs to work

1. **Metrics API** in the cluster. For CPU/memory this is `metrics-server`. On minikube it is enabled by `mockctl up` (or `minikube addons enable metrics-server`).
2. **`requests`** for CPU/memory on the target Deployment. Without them HPA cannot compute the "utilization percentage".

```bash
kubectl top pods       # should work; if not — no metrics-server
```

## Minimal CPU-based HPA

```yaml
apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata:
  name: web
spec:
  scaleTargetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: web
  minReplicas: 2
  maxReplicas: 10
  metrics:
    - type: Resource
      resource:
        name: cpu
        target:
          type: Utilization
          averageUtilization: 50      # 50% of requests
```

`Utilization` is a percentage of `requests`. If a pod has `requests.cpu: 100m` and actually consumes 80m, utilization = 80%.

An alternative is `AverageValue` (an absolute value):

```yaml
target:
  type: AverageValue
  averageValue: 100m       # 100m average load per pod
```

## Memory-based HPA

```yaml
metrics:
  - type: Resource
    resource:
      name: memory
      target:
        type: Utilization
        averageUtilization: 70
```

Memory-based HPA is finicky: memory is released reluctantly (linux page cache, GC). For **scale-up** it works, but for **scale-down** usually not — because of this the service can get stuck at the maximum number of replicas. More often people use CPU-based + tuning via `behavior` (see below).

## Custom metrics

Besides `Resource` (CPU/memory), HPA can use:

- **Pods** — a custom per-pod metric (RPS, queue length in a connection).
- **Object** — a metric on an object (Service: latency).
- **External** — a metric from an external system (SQS queue length).

These require a **prometheus-adapter** or a similar provider that registers the `custom.metrics.k8s.io` API.

## Behavior: fine-tuning

In autoscaling/v2 a `behavior` field appeared — separate policies for scale up and scale down:

```yaml
spec:
  behavior:
    scaleUp:
      stabilizationWindowSeconds: 0
      policies:
        - type: Percent
          value: 100        # double
          periodSeconds: 15
        - type: Pods
          value: 4          # or +4 pods
          periodSeconds: 15
      selectPolicy: Max
    scaleDown:
      stabilizationWindowSeconds: 300   # 5 minutes of "cooldown"
      policies:
        - type: Percent
          value: 50
          periodSeconds: 60
```

`stabilizationWindowSeconds` for scale-down is the most useful thing here. Without it HPA can "flap" up and down every 15 seconds under fluctuating load. With 300 seconds it scales down only if the load stays consistently low for 5 minutes.

## Useful commands

```bash
kubectl get hpa
kubectl describe hpa web
kubectl get hpa web --watch
kubectl autoscale deploy web --cpu-percent=50 --min=2 --max=10  # imperative equivalent
```

In `describe` you'll see events like:

```text
SuccessfulRescale: New size: 5; reason: cpu resource utilization (percentage of request) above target
```

## When HPA is not a good fit

- **Stateful applications where scaling is a notable procedure.** HPA won't help you reshard a database.
- **Stepwise, discrete load (cron).** HPA reacts with a delay; it's better to scale explicitly on a schedule.
- **Event-driven scaling (KEDA scenarios).** If the trigger is queue length or a message arrival, KEDA is more convenient than a custom metrics adapter.

## Checklist

- What must be configured on the Deployment itself so that HPA can compute utilization for it?
- What's the difference between `Utilization` and `AverageValue`?
- Why is `stabilizationWindowSeconds` needed in scaleDown?
- Which metric types does `autoscaling/v2` support?
- Will HPA work without metrics-server?

In the lab [18-lab-hpa.md](18-lab-hpa.md) we'll spike the CPU and watch how HPA reacts.
