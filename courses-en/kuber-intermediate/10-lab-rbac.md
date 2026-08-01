# 10. Lab: give a pod access to a ConfigMap

## Setup

```bash
kubectl create namespace lab-rbac
kubectl create namespace lab-rbac-other
kubectl config set-context --current --namespace=lab-rbac

kubectl create configmap app-config --from-literal=hello=world
kubectl -n lab-rbac-other create configmap secret-config --from-literal=topsecret=keep-out
```

## Task 1. Run a pod without RBAC

`pod-default.yaml`:

```yaml
apiVersion: v1
kind: Pod
metadata:
  name: kctl-default
spec:
  restartPolicy: Never
  containers:
    - name: c
      image: bitnami/kubectl:latest
      command: ["sleep", "3600"]
```

```bash
kubectl apply -f pod-default.yaml
kubectl wait --for=condition=ready pod/kctl-default --timeout=60s
kubectl exec kctl-default -- kubectl get configmaps
```

**What you'll see:** `Forbidden`. The pod runs with the default ServiceAccount `default`, which has no permission to read ConfigMaps.

```bash
kubectl exec kctl-default -- kubectl auth can-i list configmaps
# returns: no
```

## Task 2. Create a ServiceAccount + Role

`rbac.yaml`:

```yaml
apiVersion: v1
kind: ServiceAccount
metadata:
  name: cm-reader
  namespace: lab-rbac
---
apiVersion: rbac.authorization.k8s.io/v1
kind: Role
metadata:
  name: cm-read
  namespace: lab-rbac
rules:
  - apiGroups: [""]
    resources: ["configmaps"]
    verbs: ["get", "list", "watch"]
---
apiVersion: rbac.authorization.k8s.io/v1
kind: RoleBinding
metadata:
  name: cm-reader-can-read-cm
  namespace: lab-rbac
subjects:
  - kind: ServiceAccount
    name: cm-reader
    namespace: lab-rbac
roleRef:
  kind: Role
  name: cm-read
  apiGroup: rbac.authorization.k8s.io
```

```bash
kubectl apply -f rbac.yaml
kubectl auth can-i list configmaps \
  --as=system:serviceaccount:lab-rbac:cm-reader \
  -n lab-rbac
# yes
kubectl auth can-i list configmaps \
  --as=system:serviceaccount:lab-rbac:cm-reader \
  -n lab-rbac-other
# no
```

## Task 3. Run a pod with this SA

`pod-rbac.yaml`:

```yaml
apiVersion: v1
kind: Pod
metadata:
  name: kctl-rbac
spec:
  serviceAccountName: cm-reader
  restartPolicy: Never
  containers:
    - name: c
      image: bitnami/kubectl:latest
      command: ["sleep", "3600"]
```

```bash
kubectl apply -f pod-rbac.yaml
kubectl wait --for=condition=ready pod/kctl-rbac --timeout=60s
kubectl exec kctl-rbac -- kubectl get configmaps
kubectl exec kctl-rbac -- kubectl get configmap app-config -o yaml
```

**What you'll see:** the list of ConfigMaps in `lab-rbac` and the contents of `app-config`. Access granted.

The other namespace is still forbidden:

```bash
kubectl exec kctl-rbac -- kubectl get configmaps -n lab-rbac-other
# Forbidden
```

## Task 4. Scoped access via resourceNames

Tighten the Role: allow reading **only** a specific ConfigMap.

Replace the rules in `rbac.yaml`:

```yaml
rules:
  - apiGroups: [""]
    resources: ["configmaps"]
    resourceNames: ["app-config"]
    verbs: ["get"]
```

```bash
kubectl apply -f rbac.yaml
kubectl exec kctl-rbac -- kubectl get configmap app-config -o yaml   # OK
kubectl exec kctl-rbac -- kubectl get configmaps                      # Forbidden (no list)
```

**What you learned:** `resourceNames` restricts **by name**, but the `verbs` must now match too (no `list/watch` — so `kubectl get configmaps` without a name doesn't work).

## Task 5. Use a built-in ClusterRole

Roll the Role back (full access to ConfigMaps), or create a new RoleBinding with `view`:

`rb-view.yaml`:

```yaml
apiVersion: rbac.authorization.k8s.io/v1
kind: RoleBinding
metadata:
  name: cm-reader-as-viewer
  namespace: lab-rbac
subjects:
  - kind: ServiceAccount
    name: cm-reader
    namespace: lab-rbac
roleRef:
  kind: ClusterRole
  name: view                # built-in
  apiGroup: rbac.authorization.k8s.io
```

```bash
kubectl apply -f rb-view.yaml
kubectl exec kctl-rbac -- kubectl get pods,svc,configmaps
```

**What you'll see:** the pod now has read-only "everything" in `lab-rbac`. The `view` ClusterRole is a handy one-click set of permissions.

## Task 6. Revoke access — without deleting the RoleBinding

Remove the ServiceAccount from subjects (or delete the RoleBinding) and verify that `Forbidden` is back:

```bash
kubectl delete rolebinding cm-reader-as-viewer cm-reader-can-read-cm
kubectl exec kctl-rbac -- kubectl get configmaps
# Forbidden
```

## Cleanup

```bash
kubectl delete namespace lab-rbac lab-rbac-other
kubectl config set-context --current --namespace=default
```

## Self-check questions

1. Which ServiceAccount do pods use by default? What permissions does it have?
2. Why `subjects[].namespace` in a RoleBinding if the RoleBinding is itself namespaced?
3. What happens if `roleRef` references a ClusterRole but the binding itself is a RoleBinding (not a ClusterRoleBinding)?
4. Why does `kubectl get configmaps` (list) not work if only `verbs: [get]` with `resourceNames` is allowed?
5. How do you check "can I / an SA do X" without running the command itself?
