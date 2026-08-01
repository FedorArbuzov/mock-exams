# 13. Probes advanced

In `kuber-basic` we saw that there's a `livenessProbe` and a `readinessProbe`. Here we'll cover the third kind — `startupProbe`, fine-grained timing settings, and common mistakes.

## Why three probes

| Probe | What it answers | What happens on failure |
|---|---|---|
| `startupProbe` | "Is the container still initializing?" | Restart, and **don't run the other probes** until this one succeeds |
| `readinessProbe` | "Ready to accept traffic?" | Remove the pod from the Service's endpoints |
| `livenessProbe` | "Alive, or stuck/hung?" | Restart the container |

The key idea: **liveness ≠ readiness**. Liveness is "do I need to kill and recreate it", readiness is "can I route requests to it".

## Probe types

In YAML, each probe is one of:

```yaml
livenessProbe:
  httpGet:
    path: /healthz
    port: 8080
    httpHeaders:
      - name: X-Probe
        value: liveness

# or
readinessProbe:
  tcpSocket:
    port: 5432

# or
startupProbe:
  exec:
    command: ["sh", "-c", "test -f /var/run/ready"]

# or (1.24+)
livenessProbe:
  grpc:
    port: 9000
    service: liveness   # service name in the gRPC health check
```

`httpGet` is the most common. Any 2xx/3xx counts as success, 4xx/5xx as failure.

## Timings (the same for all probes)

```yaml
livenessProbe:
  httpGet:
    path: /healthz
    port: 8080
  initialDelaySeconds: 0     # how long to wait after container start
  periodSeconds: 10          # how often to poll
  timeoutSeconds: 1          # how long to wait for a response
  successThreshold: 1        # how many consecutive successes = success
  failureThreshold: 3        # how many consecutive failures = failure
  terminationGracePeriodSeconds: 30   # for liveness — SIGTERM timeout before SIGKILL
```

What's important to understand:

- **`failureThreshold`** for **liveness** — how many probes in a row must fail for k8s to decide to restart the container. Protects against false positives (one dropped packet).
- **`successThreshold`** for **readiness** — how many successful probes are needed after a `NotReady` before returning to endpoints. Useful for applications that "flap" — they don't get yanked into endpoints on every "oh, a successful ping".
- For **liveness**, `successThreshold` is always 1.

## startupProbe — mandatory for slow applications

Some applications take longer to load than you'd want to wait for readiness/liveness. For example, a Java service takes 60 seconds to start.

If you set a `livenessProbe` without a startup one:

```yaml
livenessProbe:
  httpGet: { path: /healthz, port: 8080 }
  failureThreshold: 3
  periodSeconds: 10
```

then after 30 seconds (3 × 10) the pod is killed, because the application isn't responding yet. A dangerous fix is to set `initialDelaySeconds: 90`. But then for the **entire lifetime** of the pod, k8s waits 90 seconds before noticing a hang.

The correct fix is `startupProbe`:

```yaml
startupProbe:
  httpGet: { path: /healthz, port: 8080 }
  failureThreshold: 30          # 30 attempts
  periodSeconds: 5              # every 5 sec = up to 150 sec
livenessProbe:
  httpGet: { path: /healthz, port: 8080 }
  failureThreshold: 3
  periodSeconds: 10
```

Behavior:

1. The container starts.
2. **Only** the startupProbe runs. Every 5 seconds, up to 150 seconds total.
3. As soon as the startupProbe returns success once, it **stops running**, and readiness/liveness are activated.

This way you get "the application can take a long time to start", but as soon as it has started, you react quickly.

## Common mistakes

### 1. liveness checks "is a dependency, is the DB, available"

```yaml
livenessProbe:
  httpGet:
    path: /healthz
    port: 8080
```

If in `/healthz` the application reaches the DB and returns 500 when the DB is unavailable, k8s will **restart** all of your pods when the DB goes down. The cascade builds up: probe failed → restart → probe failed → forever.

**Rule:** liveness checks "is my process alive", not "are my dependencies available". Dependencies are for readiness.

### 2. readiness isn't done at all

If a pod has only liveness, k8s adds it to endpoints right after startup, and traffic goes to a not-yet-ready application.

### 3. timeout too small

`timeoutSeconds: 1` is fine while the cluster is fast. Under load, 1 sec becomes too little → false failures.

### 4. preStop hook without graceful

When a pod is deleted:

1. K8s removes the pod from endpoints (but not immediately — that's asynchronous via kube-proxy).
2. In parallel it sends SIGTERM to the container.
3. After `terminationGracePeriodSeconds` (default 30) — SIGKILL.

Until endpoints are updated, requests keep arriving at the pod. A **preStop hook** provides "sleep N seconds before SIGTERM" to survive this window:

```yaml
spec:
  containers:
    - name: app
      lifecycle:
        preStop:
          exec:
            command: ["sh", "-c", "sleep 15"]
```

This is the correct pattern for production.

## What `kubectl describe` shows

In the Events section of `describe pod`, you can see the probe decisions:

```text
Liveness probe failed: HTTP probe failed with statuscode: 500
Readiness probe failed: dial tcp ...: connect: connection refused
Startup probe failed: HTTP probe failed with statuscode: 503
```

And `Container restartCount` shows how many times k8s has restarted the container.

## Checklist

- What's the difference between liveness and readiness?
- When do you actually need a startupProbe?
- What happens if liveness relies on DB availability?
- What is preStop and why `sleep N` before graceful shutdown?
- How many seconds does k8s give for shutdown by default?

In the lab [14-lab-probes-advanced.md](14-lab-probes-advanced.md) we'll fix a "broken" application that keeps restarting due to incorrect probes.
