# 20. Lab: bring a pod up to Restricted

## Preparation

```bash
kubectl create namespace lab-psa
kubectl label namespace lab-psa \
  pod-security.kubernetes.io/enforce=restricted \
  pod-security.kubernetes.io/warn=restricted \
  pod-security.kubernetes.io/audit=restricted
```

## Task 1. An insecure pod — rejected

`bad.yaml`:

```yaml
apiVersion: v1
kind: Pod
metadata: { name: bad }
spec:
  containers:
    - name: c
      image: nginx:latest
      securityContext:
        privileged: true
```

```bash
kubectl apply -f bad.yaml -n lab-psa
```

**What you'll see:** Forbidden, listing the PSA violations.

## Task 2. Fix it up to Restricted

`good.yaml`:

```yaml
apiVersion: v1
kind: Pod
metadata: { name: good }
spec:
  securityContext:
    runAsNonRoot: true
    seccompProfile:
      type: RuntimeDefault
  containers:
    - name: nginx
      image: nginx:1.27-alpine
      securityContext:
        allowPrivilegeEscalation: false
        capabilities:
          drop: [ALL]
        readOnlyRootFilesystem: true
      ports: [{ containerPort: 80 }]
      volumeMounts:
        - { name: tmp, mountPath: /tmp }
        - { name: cache, mountPath: /var/cache/nginx }
        - { name: run, mountPath: /var/run }
  volumes:
    - { name: tmp, emptyDir: {} }
    - { name: cache, emptyDir: {} }
    - { name: run, emptyDir: {} }
```

```bash
kubectl apply -f good.yaml -n lab-psa
kubectl get pod good -n lab-psa
kubectl exec good -n lab-psa -- id
```

## Task 3. Forbid `:latest` via PSA

PSA does **not** check the image tag. For `latest` — an admission webhook ([11-lab-validating-webhook.md](11-lab-validating-webhook.md)).

But you can do it manually:

```bash
# Try a pod with image: nginx:latest without a securityContext — PSA will reject it for other reasons
```

## Task 4. Compare baseline vs restricted

```bash
kubectl label namespace lab-psa \
  pod-security.kubernetes.io/enforce=baseline --overwrite
```

Apply a pod without `runAsNonRoot`, but without `privileged` — it will pass.

```bash
kubectl label namespace lab-psa \
  pod-security.kubernetes.io/enforce=restricted --overwrite
```

## Cleanup

```bash
kubectl delete namespace lab-psa
```

## Self-check questions

1. Which 3 volumes does nginx need with readOnlyRootFilesystem?
2. Why doesn't `privileged: true` pass restricted?
3. How do you enable PSA on a namespace?
