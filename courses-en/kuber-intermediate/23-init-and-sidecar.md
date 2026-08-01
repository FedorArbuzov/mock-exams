# 23. Init and sidecar containers

A Pod can have **several containers**. This is rarely used in tutorials, but it's common in real applications. There are two main patterns:

- **Init container** — runs **before** the main ones, to prepare something.
- **Sidecar** — runs alongside the main container for the whole lifetime of the pod: logs, a proxy, a refresher for Secrets.

## Init containers

```yaml
apiVersion: v1
kind: Pod
metadata: { name: web }
spec:
  initContainers:
    - name: setup
      image: busybox
      command: ["sh", "-c", "echo '<h1>hello</h1>' > /work/index.html"]
      volumeMounts:
        - name: html
          mountPath: /work
  containers:
    - name: nginx
      image: nginx:1.27-alpine
      volumeMounts:
        - name: html
          mountPath: /usr/share/nginx/html
  volumes:
    - name: html
      emptyDir: {}
```

What happens:

1. The Pod is created, the kubelet sees initContainers.
2. It runs `setup`. It waits for it to **succeed** (exit 0).
3. Only then does it start the main `containers` (`nginx`).

There can be several init containers — they run **in order**, sequentially. If one fails, the pod hangs and the kubelet retries (according to the pod's `restartPolicy`: `Always`/`OnFailure`/`Never`).

Typical tasks:

- Wait for a dependency (a DB migration is ready, a ConfigMap appeared).
- Generate a config from env variables.
- Create certificates (cert-manager does this a different way, but the idea is the same).
- Copy files from a read-only image into a writable volume.

An init container **does not run again when the main container restarts**. It only runs again if the whole Pod is recreated.

## Sidecar (the classic pattern)

A "sidecar" in Kubernetes is simply a **second container in a Pod** that **runs for a long time** in parallel with the main one. Before k8s 1.29 this was a conventional pattern, without a separate declaration.

```yaml
apiVersion: v1
kind: Pod
metadata: { name: web }
spec:
  containers:
    - name: nginx
      image: nginx:1.27-alpine
      volumeMounts:
        - name: logs
          mountPath: /var/log/nginx
    - name: log-tailer
      image: busybox
      command: ["sh", "-c", "tail -F /var/log/nginx/access.log"]
      volumeMounts:
        - name: logs
          mountPath: /var/log/nginx
  volumes:
    - name: logs
      emptyDir: {}
```

What happens:

1. Both containers start at the same time.
2. They share `emptyDir`, and the sidecar reads what nginx writes.
3. `kubectl logs pod/web -c log-tailer` shows the access logs.

Sidecar scenarios:

- **Logs** — the main container writes to a file, the sidecar ships it to Loki/CloudWatch.
- **Proxy** — TLS termination, authorization (envoy/nginx).
- **Service mesh** — istio-proxy, linkerd-proxy.
- **Monitoring** — a metrics exporter for an application that doesn't expose them itself.

## Native sidecar (k8s 1.29+, beta in 1.30+)

In newer versions a sidecar got its own mechanism: it's an **init container with `restartPolicy: Always`**:

```yaml
spec:
  initContainers:
    - name: log-tailer
      image: busybox
      restartPolicy: Always
      command: ["sh", "-c", "tail -F /var/log/nginx/access.log || sleep 60"]
      volumeMounts:
        - name: logs
          mountPath: /var/log/nginx
  containers:
    - name: nginx
      image: nginx:1.27-alpine
      volumeMounts:
        - name: logs
          mountPath: /var/log/nginx
  volumes:
    - name: logs
      emptyDir: {}
```

Advantages:

- The sidecar comes up **before** the main containers. Convenient for a proxy: "traffic flows only once the proxy is ready".
- The sidecar shuts down **after** the main ones. Convenient for logs: "manage to flush the remaining logs before the pod dies".
- Jobs finish correctly: the sidecar doesn't "prevent the Job from completing".

In recent minikube versions (k8s 1.29+) this works.

## Restart policy and the kubelet

The Pod-level `spec.restartPolicy`:

- `Always` (default for Deployment) — the kubelet recreates the container when it exits.
- `OnFailure` (Job) — recreates only on a non-zero exit.
- `Never` — never recreates.

This is **per-Pod**, not per-container.

## Lifecycles of init / main / sidecar — simplified

```text
[ Pod created ]
    │
    ▼
[ initContainers run sequentially ]   ← if any
    │
    ▼
[ native sidecars start (k8s 1.29+) ]
    │
    ▼
[ main containers start ]
    │
    ▼
[ during life: probes, restarts ]
    │
    ▼
[ deletion: SIGTERM main → SIGTERM sidecar → SIGKILL ]
```

## Useful commands

```bash
kubectl logs pod/web                  # logs of the default container
kubectl logs pod/web -c log-tailer    # logs of a specific container
kubectl logs pod/web --all-containers # all of them
kubectl exec pod/web -c nginx -- sh   # exec into a specific container

# See the init container:
kubectl describe pod web | grep -A4 "Init Containers"
```

## Checklist

- What's the difference between an init container and a sidecar?
- What happens if an init container fails with exit 1?
- Does an init container run again when the main container restarts?
- Why is a native sidecar needed in k8s 1.29+, if sidecars already worked?
- How do you run `kubectl logs` for a specific container in a multi-container pod?

In the lab [24-lab-init-and-sidecar.md](24-lab-init-and-sidecar.md) we'll assemble a pod with init + sidecar and check the lifecycle.
