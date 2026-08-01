# Mock CKA 01 — solutions

> Open after your own attempt.

## Q1

```bash
kubectl config set-context --current --namespace=cka-m1
```

## Q2

```bash
kubectl -n cka-m1 create serviceaccount ops

cat <<'EOF' | kubectl apply -f -
apiVersion: rbac.authorization.k8s.io/v1
kind: Role
metadata:
  name: ops-deploy-reader
  namespace: cka-m1
rules:
  - apiGroups: ["apps"]
    resources: ["deployments"]
    verbs: ["get", "list", "watch"]
---
apiVersion: rbac.authorization.k8s.io/v1
kind: RoleBinding
metadata:
  name: ops-deploy-reader
  namespace: cka-m1
subjects:
  - kind: ServiceAccount
    name: ops
    namespace: cka-m1
roleRef:
  kind: Role
  name: ops-deploy-reader
  apiGroup: rbac.authorization.k8s.io
EOF
```

## Q3

```bash
kubectl label node --all workload=general --overwrite
```

## Q4

```bash
kubectl -n cka-m1 set image deployment/billing-api nginx=nginx:1.27-alpine
kubectl -n cka-m1 scale deployment billing-api --replicas=2
kubectl -n cka-m1 rollout status deployment/billing-api
```

## Q5

```bash
cat <<'EOF' | kubectl apply -f -
apiVersion: rbac.authorization.k8s.io/v1
kind: ClusterRole
metadata:
  name: secret-reader
rules:
  - apiGroups: [""]
    resources: ["secrets"]
    verbs: ["get", "list"]
---
apiVersion: rbac.authorization.k8s.io/v1
kind: ClusterRoleBinding
metadata:
  name: vault-sync-secrets
subjects:
  - kind: ServiceAccount
    name: vault-sync
    namespace: cka-m1-vault
roleRef:
  kind: ClusterRole
  name: secret-reader
  apiGroup: rbac.authorization.k8s.io
EOF
```

## Q6

```bash
kubectl get pods -n kube-system --field-selector=status.phase=Running --no-headers | wc -l > ~/cka-m1-q6.txt
```

## Q7

```bash
cat <<'EOF' | kubectl apply -f -
apiVersion: v1
kind: ResourceQuota
metadata:
  name: platform-quota
  namespace: cka-m1
spec:
  hard:
    cpu: "4"
    memory: 8Gi
    pods: "20"
EOF
```
