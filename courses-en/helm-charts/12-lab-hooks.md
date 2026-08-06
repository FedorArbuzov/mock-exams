# 12. Lab: pre-upgrade Job hook

## Setup

```bash
cd ~/helm-work
kubectl create namespace lab-helm-hooks
kubectl config set-context --current --namespace=lab-helm-hooks
helm create migrate-demo
```

## Task 1. Add a hook Job

Create `migrate-demo/templates/hooks/pre-upgrade-job.yaml`:

```yaml
apiVersion: batch/v1
kind: Job
metadata:
  name: "{{ include "migrate-demo.fullname" . }}-migrate"
  labels:
    {{- include "migrate-demo.labels" . | nindent 4 }}
  annotations:
    "helm.sh/hook": pre-install,pre-upgrade
    "helm.sh/hook-weight": "-5"
    "helm.sh/hook-delete-policy": before-hook-creation,hook-succeeded
spec:
  template:
    metadata:
      name: "{{ include "migrate-demo.fullname" . }}-migrate"
    spec:
      restartPolicy: Never
      containers:
        - name: migrate
          image: busybox:1.36
          command: ["sh", "-c", "echo running migrations for {{ .Release.Name }} && sleep 3"]
  backoffLimit: 1
```

## Task 2. Install and upgrade

```bash
helm upgrade --install md ./migrate-demo --wait --timeout 3m
kubectl get jobs
helm upgrade md ./migrate-demo --set replicaCount=2 --wait --timeout 3m
kubectl get jobs
kubectl get pods
```

**Check:** a migrate Job runs on install/upgrade; app Deployment scales to 2.

## Task 3. See hook resources in status

```bash
helm status md
helm get hooks md
```

```bash
helm uninstall md
kubectl delete namespace lab-helm-hooks
kubectl config set-context --current --namespace=default
```

## Self-check

1. What does `before-hook-creation` prevent?
2. Why use negative `hook-weight` for migrations?

Next: [13-packaging-oci.md](13-packaging-oci.md).
