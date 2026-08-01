# 15. Resources and QoS classes

## requests vs limits

```yaml
resources:
  requests:
    cpu: 100m
    memory: 128Mi
  limits:
    cpu: 200m
    memory: 256Mi
```

- **`requests`** is the "guarantee". The scheduler **reserves** exactly this much on the node. If the node doesn't have enough free requests, the pod won't start (status `Pending`, reason `Unschedulable`).
- **`limits`** is the "ceiling". The container won't get more than specified. On CPU, exceeding it is **throttled**. On memory — `OOMKilled` (the kernel kills the process, kubelet restarts the container).

`100m` (milli) = 0.1 CPU. `128Mi` = 128 mebibytes (≠ 128 MB).

## QoS classes

Based on `requests`/`limits`, Kubernetes assigns the pod a **QoS class**. This affects eviction (who gets killed first when memory is scarce).

| Class | Condition | Behavior under pressure |
|---|---|---|
| `Guaranteed` | For all containers: `requests == limits` for CPU **and** memory. | Killed **last**. |
| `Burstable` | At least one container: `requests` < `limits` (or only one is specified). | Killed **second**. |
| `BestEffort` | Neither requests nor limits are **specified at all**. | Killed **first**. |

View the QoS:

```bash
kubectl get pod my-pod -o jsonpath='{.status.qosClass}'
```

## Eviction: what and why

When a node is under pressure (low memory, low disk), kubelet **evicts** pods. The order:

1. Best-effort goes first.
2. Among Burstable — the one that **exceeds its request** goes first. The more it exceeds, the sooner.
3. Guaranteed — only in node-level eviction (running out of disk, for example).

This logic is based on priorityClass and QoS, but at its core is `requests`. Therefore:

- BestEffort — only suitable for non-serious tasks.
- Burstable — the standard for most services.
- Guaranteed — for the critically important ones (DBs, queues), plus predictable CPU and memory behavior.

## CPU: throttle, not kill

If a container tries to consume more CPU than `limits.cpu`, the kernel **throttles** it — reduces its quantum. The container isn't killed, it just runs slower. In metrics this appears as "cpu_cfs_throttled_seconds".

## Memory: hard kill

If a container tries to exceed `limits.memory`, the kernel sends `SIGKILL` to the process with the highest OOM score. kubelet sees this as `OOMKilled`:

```bash
kubectl describe pod my-pod | grep -A2 State
# State: Terminated
# Reason: OOMKilled
```

Unlike CPU, OOM is **irreversible**: the process dies, and the container restarts (if restartPolicy allows).

## How to choose values

The metrics of a real process at rest and under load:

```bash
kubectl top pods                      # current consumption
kubectl top pods --containers
kubectl describe pod ... | grep -A3 Allocated   # planned vs reality on the node
```

An empirical recipe:

- **CPU request** — the median (or p50) real consumption under load.
- **CPU limit** — high, to survive spikes (or no limit at all if the workload is latency-sensitive).
- **Memory request** — RSS under normal load + 20%.
- **Memory limit** — request × 1.5–2 (or close to it for Guaranteed).

If `memory request == limit` and the application requests more, `OOMKilled` is guaranteed. This is "disciplined", but requires precise knowledge of how much memory the application can consume.

## LimitRange and ResourceQuota

These objects help **at the namespace level**:

- **LimitRange** — sets defaults and minimums/maximums for `requests`/`limits` in a namespace. If a pod didn't specify resources, LimitRange fills in its own.
- **ResourceQuota** — a limit on the sum of all `requests`/`limits` in a namespace. Protects against "one service ate all the cluster's resources".

```yaml
apiVersion: v1
kind: ResourceQuota
metadata:
  name: ns-quota
spec:
  hard:
    requests.cpu: "2"
    requests.memory: 4Gi
    limits.cpu: "4"
    limits.memory: 8Gi
    pods: "10"
```

```yaml
apiVersion: v1
kind: LimitRange
metadata:
  name: ns-defaults
spec:
  limits:
    - type: Container
      default:
        cpu: 200m
        memory: 256Mi
      defaultRequest:
        cpu: 100m
        memory: 128Mi
```

## Checklist

- What's the difference between requests and limits on CPU? On memory?
- What QoS does a pod with no specified resources have?
- In what case is it `OOMKilled`, and in what case throttling?
- What happens to a pod if the scheduler can't find a node with sufficient requests?
- Why LimitRange if a pod already has resources?

In the lab [16-lab-resources-qos.md](16-lab-resources-qos.md) we'll actually trigger OOMKilled, throttling, and Pending due to insufficient resources.
