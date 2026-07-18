# 10. Лаба: дать поду доступ к ConfigMap

## Подготовка

```bash
kubectl create namespace lab-rbac
kubectl create namespace lab-rbac-other
kubectl config set-context --current --namespace=lab-rbac

kubectl create configmap app-config --from-literal=hello=world
kubectl -n lab-rbac-other create configmap secret-config --from-literal=topsecret=keep-out
```

## Задание 1. Запустить под без RBAC

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

**Что увидите:** `Forbidden`. Под работает с дефолтным ServiceAccount `default`, у которого нет прав на чтение ConfigMap.

```bash
kubectl exec kctl-default -- kubectl auth can-i list configmaps
# выдаст: no
```

## Задание 2. Создать ServiceAccount + Role

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

## Задание 3. Запустить под с этим SA

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

**Что увидите:** список ConfigMap в `lab-rbac` и содержимое `app-config`. Доступ есть.

Чужой namespace по-прежнему запрещён:

```bash
kubectl exec kctl-rbac -- kubectl get configmaps -n lab-rbac-other
# Forbidden
```

## Задание 4. Точечный доступ через resourceNames

Усильте Role: разрешите читать **только** конкретный ConfigMap.

Замените rules в `rbac.yaml`:

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
kubectl exec kctl-rbac -- kubectl get configmaps                      # Forbidden (list-а нет)
```

**Что узнали:** `resourceNames` ограничивает **по имени**, но и `verbs` теперь должны соответствовать (нет `list/watch` — `kubectl get configmaps` без имени не работает).

## Задание 5. Использовать готовую ClusterRole

Откатите Role обратно (полный доступ к ConfigMap), либо создайте новую RoleBinding с `view`:

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

**Что увидите:** под теперь read-only «всё» в `lab-rbac`. ClusterRole `view` — типовая удобная права-в-один-клик.

## Задание 6. Запретить доступ — без удаления RoleBinding

Уберите ServiceAccount из subjects (или удалите RoleBinding) и проверьте, что `Forbidden` вернулся:

```bash
kubectl delete rolebinding cm-reader-as-viewer cm-reader-can-read-cm
kubectl exec kctl-rbac -- kubectl get configmaps
# Forbidden
```

## Уборка

```bash
kubectl delete namespace lab-rbac lab-rbac-other
kubectl config set-context --current --namespace=default
```

## Вопросы для самопроверки

1. Какой ServiceAccount используют поды по умолчанию? Какие у него права?
2. Зачем `subjects[].namespace` в RoleBinding, если RoleBinding сам namespaced?
3. Что произойдёт, если в `roleRef` указать ClusterRole, а сам binding — RoleBinding (а не ClusterRoleBinding)?
4. Почему `kubectl get configmaps` (list) не работает, если разрешён только `verbs: [get]` с `resourceNames`?
5. Как проверить «может ли я / SA сделать X», не выполняя самой команды?
