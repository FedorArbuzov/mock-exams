# 14. Probes and Resources: Making an App "Real"

A minimal Pod with no health checks and no limits will run just fine — but in production it's a bad neighbor:

- It can hang without Kubernetes ever noticing.
- It can eat all the memory on a node and take its neighbors down with it.
- It can start receiving traffic before it's actually ready to handle any.

**Probes** and **resources** are how you fix all three.

## Probes: health checks

Kubernetes gives you three kinds:

| Probe | What it checks | What happens on failure |
|--------|---------------|--------------------------|
| **livenessProbe** | "Is the container alive right now?" | The container gets restarted. |
| **readinessProbe** | "Is it ready to take traffic?" | The Pod is pulled out of the Service's endpoints. The container itself is **not** restarted. |
| **startupProbe** | "Has it finished starting up?" (for slow-starting apps). While it's running, liveness/readiness are on hold. | Restart on failure. |

Ways to run a check:

- **httpGet** — an HTTP request against a path/port.
- **tcpSocket** — just try to open a TCP port.
- **exec** — run a command, check for exit code 0.

Example:

```yaml
spec:
  containers:
    - name: web
      image: nginx:1.27
      ports:
        - containerPort: 80
      livenessProbe:
        httpGet:
          path: /
          port: 80
        initialDelaySeconds: 5
        periodSeconds: 10
        failureThreshold: 3
      readinessProbe:
        httpGet:
          path: /
          port: 80
        initialDelaySeconds: 2
        periodSeconds: 5
      startupProbe:
        httpGet:
          path: /
          port: 80
        failureThreshold: 30
        periodSeconds: 2
```

The parameters:

- **`initialDelaySeconds`** — a grace period before the first check.
- **`periodSeconds`** — how often to check.
- **`failureThreshold`** — how many failures in a row before acting.
- **`successThreshold`** — for readiness: how many successes before it counts as "ready."
- **`timeoutSeconds`** — timeout for a single check.

### Ways to get this wrong

- Pointing **liveness** at a "heavy" endpoint like `/healthz` that hits the database — if the database goes down, your containers start restarting in a loop for no good reason.
- Making `livenessProbe` and `readinessProbe` **identical** — that defeats the point; readiness should generally be more forgiving.
- Setting `initialDelaySeconds` too short for an app that takes 30+ seconds to boot — this is exactly what `startupProbe` is for.

## Resources: requests and limits

Every container can declare:

```yaml
resources:
  requests:
    cpu: "100m"
    memory: "128Mi"
  limits:
    cpu: "500m"
    memory: "256Mi"
```

### requests

"How much to reserve, guaranteed" — this is the number the **scheduler** uses to pick a node. If no node has that much free capacity, the Pod stays `Pending`.

Leave `requests` unset, and the scheduler effectively treats it as zero — the Pod can land anywhere and end up starved.

### limits

The ceiling — how much it's allowed to use at most.

- **Going over the CPU limit** → throttled (the container slows down, it isn't killed).
- **Going over the memory limit** → **OOMKilled**, the container gets restarted.

### Units

- CPU: `1` = one core, `500m` = 0.5 core, `100m` = 0.1 core.
- Memory: `Mi` (mebibyte = 1024×1024), `Gi`, `M`, `G`. In practice, people mostly use `Mi`/`Gi`.

### Quality of Service (QoS)

Kubernetes assigns each Pod a QoS class automatically, based on how requests/limits are set:

| Class | Condition | What it means |
|-------|---------|-------------|
| **Guaranteed** | requests == limits, for both CPU and memory, on every container | Least likely to get killed when the node runs low on memory. |
| **Burstable** | requests are set, but below limits | Somewhere in the middle. |
| **BestEffort** | no requests/limits at all | First in line to be killed when resources get tight. |

```bash
kubectl get pod <name> -o jsonpath='{.status.qosClass}'
```

## A properly-configured container

```yaml
spec:
  containers:
    - name: web
      image: my-app:1.0
      ports:
        - containerPort: 8080
      env:
        - name: LOG_LEVEL
          valueFrom:
            configMapKeyRef:
              name: app-config
              key: LOG_LEVEL
      resources:
        requests:
          cpu: "100m"
          memory: "128Mi"
        limits:
          cpu: "500m"
          memory: "256Mi"
      readinessProbe:
        httpGet: { path: /healthz, port: 8080 }
        periodSeconds: 5
      livenessProbe:
        httpGet: { path: /livez, port: 8080 }
        periodSeconds: 15
```

## Commands

```bash
kubectl describe pod <name>            # shows Events / Liveness/Readiness
kubectl get pod <name> -o jsonpath='{.status.qosClass}{"\n"}'
kubectl top pod                        # actual usage (needs metrics-server)
kubectl top node
```

Installing `metrics-server` (needed for `kubectl top`) — see also [ENVIRONMENT.md](ENVIRONMENT.md):

```bash
kubectl apply -f https://github.com/kubernetes-sigs/metrics-server/releases/latest/download/components.yaml
```

On Docker Desktop, if `kubectl top` stays empty, patch metrics-server with `--kubelet-insecure-tls` (command in ENVIRONMENT.md).
