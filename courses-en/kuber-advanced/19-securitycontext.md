# 19. SecurityContext

## Levels

| Level | Field | Affects |
|---|---|---|
| Pod | `spec.securityContext` | All containers in the pod |
| Container | `containers[].securityContext` | A single container (overrides the pod) |

## Key fields

### runAsUser / runAsNonRoot

```yaml
securityContext:
  runAsUser: 1000
  runAsNonRoot: true
```

The process is **not root** (UID 0). `runAsNonRoot: true` — the kubelet rejects the image if USER in the Dockerfile = 0.

### runAsGroup / fsGroup

```yaml
securityContext:
  runAsGroup: 3000
  fsGroup: 2000
```

`fsGroup` — the group for volumes; files on the volume get GID 2000.

### capabilities

```yaml
securityContext:
  capabilities:
    drop: [ALL]
    add: [NET_BIND_SERVICE]    # only if you need a port < 1024
```

`drop: [ALL]` — best practice. Add the minimum.

### privileged

```yaml
securityContext:
  privileged: true    # almost root on the host — avoid
```

### allowPrivilegeEscalation

```yaml
securityContext:
  allowPrivilegeEscalation: false
```

Prevents setuid bits from granting more privileges (e.g. `no_new_privs`).

### readOnlyRootFilesystem

```yaml
securityContext:
  readOnlyRootFilesystem: true
volumeMounts:
  - name: tmp
    mountPath: /tmp
volumes:
  - name: tmp
    emptyDir: {}
```

Everything the application writes to goes through separate volumes.

### seccompProfile

```yaml
securityContext:
  seccompProfile:
    type: RuntimeDefault
```

Restricts syscalls. `RuntimeDefault` — the container runtime's profile.

## Example: a hardened Deployment

```yaml
spec:
  template:
    spec:
      securityContext:
        runAsNonRoot: true
        seccompProfile:
          type: RuntimeDefault
      containers:
        - name: app
          image: myapp:1.0
          securityContext:
            allowPrivilegeEscalation: false
            readOnlyRootFilesystem: true
            capabilities:
              drop: [ALL]
```

## Checking at runtime

```bash
kubectl exec pod/name -- id
# uid=1000 gid=0 ...
```

## Checklist

- Pod vs container securityContext — which overrides which?
- Why `drop: [ALL]`?
- Why does nginx with `readOnlyRootFilesystem` need emptyDir?
- What does `allowPrivilegeEscalation: false` do?

Lab: [20-lab-pod-security.md](20-lab-pod-security.md).
