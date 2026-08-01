# 18. Pod Security Admission (PSA)

## Why

There used to be PodSecurityPolicy (PSP) — complex, removed in 1.25. The replacement is **Pod Security Admission** (built into the apiserver).

PSA checks the pod spec on create/update and **rejects** insecure pods.

## Three levels

| Level | Description |
|---|---|
| `privileged` | No restrictions (as root, hostNetwork, …) |
| `baseline` | Minimal restrictions (no hostPath, …) |
| `restricted` | Hardened: non-root, drop capabilities, readOnlyRootFS, … |

## Enabling per namespace

Via **labels** on the namespace:

```bash
kubectl label namespace my-app \
  pod-security.kubernetes.io/enforce=restricted \
  pod-security.kubernetes.io/enforce-version=latest \
  pod-security.kubernetes.io/warn=restricted \
  pod-security.kubernetes.io/audit=restricted
```

| Label suffix | Mode |
|---|---|
| `enforce` | Reject the pod |
| `warn` | Allow, but warn the user |
| `audit` | Allow, record in the audit log |

## What `restricted` forbids (the essentials)

- `runAsNonRoot: true` (or `runAsUser` > 0)
- `allowPrivilegeEscalation: false`
- `capabilities.drop: [ALL]`
- `seccompProfile.type: RuntimeDefault` (or Localhost)
- Forbidden: `hostNetwork`, `hostPID`, `hostIPC`, `hostPath` (except a whitelist), `privileged: true`

## Example of a compliant pod

```yaml
apiVersion: v1
kind: Pod
metadata: { name: secure }
spec:
  securityContext:
    runAsNonRoot: true
    seccompProfile:
      type: RuntimeDefault
  containers:
    - name: app
      image: nginx:1.27-alpine
      securityContext:
        allowPrivilegeEscalation: false
        capabilities:
          drop: [ALL]
        readOnlyRootFilesystem: true
      volumeMounts:
        - name: tmp
          mountPath: /tmp
        - name: cache
          mountPath: /var/cache/nginx
        - name: run
          mountPath: /var/run
  volumes:
    - name: tmp
      emptyDir: {}
    - name: cache
      emptyDir: {}
    - name: run
      emptyDir: {}
```

nginx writes to `/var/cache` and `/var/run` — without an emptyDir it won't start with `readOnlyRootFilesystem`.

## Checking without apply

```bash
kubectl label namespace test psa=restricted --dry-run=client -o yaml
# or use cluster-level policies (Pod Security Standards)
```

On `kubectl apply` of a violating pod:

```text
Error from server: pods "bad" is forbidden: violates PodSecurity "restricted:latest": ...
```

## Exemptions

In the apiserver config you can exempt namespaces/users. In minikube — rarely needed.

## CKS checklist

- The three PSA levels?
- How do you enable `restricted` on a namespace?
- The difference between enforce / warn / audit?
- What's needed for `readOnlyRootFilesystem` with nginx?
- How did PSA replace PSP?

Lab: [20-lab-pod-security.md](20-lab-pod-security.md). SecurityContext details: [19-securitycontext.md](19-securitycontext.md).
