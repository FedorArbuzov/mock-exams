# 09. RBAC: ServiceAccount, Role, RoleBinding

## Что такое RBAC

**Role-Based Access Control** — модель, в которой права выдаются не «персоне», а **роли**. Роль = набор разрешений; вы привязываете роль к субъекту (пользователю, группе, ServiceAccount).

В Kubernetes RBAC устроен из четырёх объектов:

| Объект | Уровень | Что делает |
|---|---|---|
| `Role` | namespace | Список разрешений в одном namespace |
| `ClusterRole` | cluster | Список разрешений на весь кластер (или на cluster-scoped ресурсы) |
| `RoleBinding` | namespace | Привязывает Role или ClusterRole к субъекту в namespace |
| `ClusterRoleBinding` | cluster | Привязывает ClusterRole к субъекту глобально |

## Кто такие «субъекты»

В Kubernetes есть три типа субъектов:

1. **User** — внешний пользователь (например, через сертификат, OIDC). Сам объект `User` в k8s **не хранится**, это просто строка.
2. **Group** — группа таких внешних пользователей.
3. **ServiceAccount** — «учётка» для **подов**. Это реальный объект (`ServiceAccount`) в namespace.

Когда под обращается к API, он делает это **от имени своего ServiceAccount**. По умолчанию это `default` в его namespace.

## Минимальная Role и RoleBinding

```yaml
apiVersion: rbac.authorization.k8s.io/v1
kind: ServiceAccount
metadata:
  name: reader
  namespace: dev
---
apiVersion: rbac.authorization.k8s.io/v1
kind: Role
metadata:
  name: pod-reader
  namespace: dev
rules:
  - apiGroups: [""]            # core API group ("" = pods, services, configmaps, ...)
    resources: ["pods"]
    verbs: ["get", "list", "watch"]
---
apiVersion: rbac.authorization.k8s.io/v1
kind: RoleBinding
metadata:
  name: reader-can-read-pods
  namespace: dev
subjects:
  - kind: ServiceAccount
    name: reader
    namespace: dev
roleRef:
  kind: Role
  name: pod-reader
  apiGroup: rbac.authorization.k8s.io
```

После apply:

- ServiceAccount `reader` в namespace `dev`.
- Любой под, который запущен с `serviceAccountName: reader`, может читать поды в `dev`. Больше ничего.

## Как работают `rules`

Каждая запись в `rules` — это «можно делать `verbs` над `resources` в `apiGroups`». Можно перечислять несколько в массиве:

```yaml
rules:
  - apiGroups: [""]
    resources: ["pods", "services", "configmaps"]
    verbs: ["get", "list", "watch"]
  - apiGroups: ["apps"]
    resources: ["deployments", "statefulsets"]
    verbs: ["*"]                  # все verb-ы
  - apiGroups: [""]
    resources: ["secrets"]
    resourceNames: ["my-secret"]  # точечно: можно работать только с этим Secret
    verbs: ["get"]
```

Стандартные `verbs`: `get`, `list`, `watch`, `create`, `update`, `patch`, `delete`, `deletecollection`. Спец-verb `impersonate` — про делегирование, `bind` и `escalate` — про создание ролей.

## Как узнать `apiGroups` и `resources`

```bash
kubectl api-resources
```

Вы увидите таблицу:

```text
NAME              SHORTNAMES   APIVERSION       NAMESPACED   KIND
pods              po           v1               true         Pod
services          svc          v1               true         Service
deployments       deploy       apps/v1          true         Deployment
storageclasses    sc           storage.k8s.io/v1   false     StorageClass
```

`apiGroups`: для core-объектов (Pod, Service) — пустая строка `""`. Для `apps/v1` — `"apps"`. Для `storage.k8s.io/v1` — `"storage.k8s.io"`.

## ClusterRole + RoleBinding

Иногда нужно **набор разрешений** определить один раз глобально и применять в разных namespace. Тогда:

- `ClusterRole` — описывает права (как Role, но не привязан к namespace).
- `RoleBinding` в namespace **может ссылаться на ClusterRole** — права будут применены **только в этом namespace**.

```yaml
apiVersion: rbac.authorization.k8s.io/v1
kind: ClusterRole
metadata:
  name: pod-reader-everywhere
rules:
  - apiGroups: [""]
    resources: ["pods"]
    verbs: ["get", "list"]
---
apiVersion: rbac.authorization.k8s.io/v1
kind: RoleBinding
metadata:
  name: reader-in-staging
  namespace: staging
subjects:
  - kind: ServiceAccount
    name: reader
    namespace: staging
roleRef:
  kind: ClusterRole          # ← ссылка на ClusterRole
  name: pod-reader-everywhere
  apiGroup: rbac.authorization.k8s.io
```

`ClusterRoleBinding` нужен только когда права действительно глобальные (на cluster-scoped ресурсы или на все namespace сразу).

## Готовые роли

Kubernetes из коробки даёт ClusterRole-ы:

- `cluster-admin` — всё на свете.
- `admin` — почти всё в namespace, кроме quotas.
- `edit` — редактирование объектов в namespace.
- `view` — только чтение.

Их часто используют через RoleBinding:

```yaml
roleRef:
  kind: ClusterRole
  name: view
  apiGroup: rbac.authorization.k8s.io
```

## Проверка прав: `kubectl auth can-i`

```bash
kubectl auth can-i create deploy
kubectl auth can-i get pod -n kube-system
kubectl auth can-i '*' '*' --all-namespaces        # я cluster-admin?

# Проверка от имени ServiceAccount:
kubectl auth can-i list pods --as=system:serviceaccount:dev:reader -n dev
```

## Полезные команды

```bash
kubectl get sa,roles,rolebindings -n dev
kubectl get clusterroles,clusterrolebindings
kubectl describe rolebinding reader-can-read-pods -n dev
kubectl auth can-i ... --as=...
```

## Чек-лист

- В чём разница между Role и ClusterRole?
- Что произойдёт, если ServiceAccount привязать к ClusterRole через RoleBinding (а не ClusterRoleBinding) в namespace `dev`?
- Какой ServiceAccount по умолчанию использует под, если ничего не указать?
- Чем «точечный доступ» (`resourceNames`) отличается от «всем pods»?
- Как проверить «может ли под X сделать Y», не запуская сам под?

В лабе [10-lab-rbac.md](10-lab-rbac.md) дадим поду kubectl-доступ и ограничим его строго одним namespace.
